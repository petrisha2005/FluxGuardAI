from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status

from app.core import database
from app.schemas.base import StandardResponse
from app.schemas.prediction import PredictionResponse
from app.services import prediction, risk

router = APIRouter(prefix="/events/{eventId}/predictions", tags=["predictions"])


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
def run_prediction_cycle(eventId: UUID):
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

    return StandardResponse(data=[PredictionResponse(**p) for p in new_predictions])
