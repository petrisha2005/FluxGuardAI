from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core import database
from app.core.security import require_roles
from app.core.websocket import manager
from app.schemas.alert import AlertResponse
from app.schemas.base import StandardResponse
from app.schemas.prediction import PredictionResponse
from app.schemas.risk import RiskScoreResponse
from app.services import prediction, risk

router = APIRouter(
    prefix="/events/{eventId}/predictions",
    tags=["predictions"],
    dependencies=[Depends(require_roles(["operator", "organizer"]))],
)


@router.get("", response_model=StandardResponse)
def get_predictions(
    eventId: UUID,
    zoneId: UUID | None = Query(None, alias="zoneId"),
    horizonMinutes: int | None = Query(None, alias="horizonMinutes"),
    since: datetime | None = Query(None, alias="since"),
):
    """Fetch forecast predictions for event zones."""
    event = database.get_event_by_id(eventId)
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": {
                    "code": "EVENT_NOT_FOUND",
                    "message": f"Event with ID {eventId} not found.",
                }
            },
        )

    predictions = database.get_predictions(eventId, zoneId, horizonMinutes, since)
    return StandardResponse(data=[PredictionResponse(**p) for p in predictions])


@router.post("/run", response_model=StandardResponse, status_code=status.HTTP_202_ACCEPTED)
async def run_prediction_cycle(eventId: UUID):
    """Trigger dynamic forecast prediction run and evaluate risk scoring."""
    event = database.get_event_by_id(eventId)
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": {
                    "code": "EVENT_NOT_FOUND",
                    "message": f"Event with ID {eventId} not found.",
                }
            },
        )

    # 1. Run forecast computation
    new_predictions = prediction.run_prediction_cycle(eventId)

    # 2. Score risks and spawn alerts
    risk.evaluate_and_score_risks(eventId, new_predictions)

    # 3. Retrieve and format objects to broadcast
    predictions_payload = [
        PredictionResponse(**p).model_dump(by_alias=True, mode="json") for p in new_predictions
    ]

    latest_scores = database.get_latest_risk_scores(eventId)
    risk_scores_payload = [
        RiskScoreResponse(**s).model_dump(by_alias=True, mode="json") for s in latest_scores
    ]

    active_alerts = database.get_alerts(eventId, status="unacknowledged")
    alerts_payload = [
        AlertResponse(**a).model_dump(by_alias=True, mode="json") for a in active_alerts
    ]

    # 4. Broadcast live channel events
    await manager.broadcast_to_event(str(eventId), "prediction_updated", predictions_payload)
    await manager.broadcast_to_event(str(eventId), "risk_score_updated", risk_scores_payload)
    for alert_p in alerts_payload:
        await manager.broadcast_to_event(str(eventId), "alert_created", alert_p)

    return StandardResponse(data=[PredictionResponse(**p) for p in new_predictions])
