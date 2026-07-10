from uuid import UUID

from fastapi import APIRouter, HTTPException, status

from app.core import database
from app.schemas.base import StandardResponse
from app.schemas.risk import RiskScoreResponse

router = APIRouter(prefix="/events/{eventId}/risk-scores", tags=["risk"])


@router.get("", response_model=StandardResponse)
def get_risk_scores(eventId: UUID):
    """Fetch latest risk scoring records by zone."""
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

    scores = database.get_latest_risk_scores(eventId)
    return StandardResponse(data=[RiskScoreResponse(**s) for s in scores])
