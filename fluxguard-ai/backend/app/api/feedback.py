from datetime import UTC, datetime
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, status

from app.core import database
from app.core.security import require_roles
from app.schemas.base import StandardResponse
from app.schemas.feedback import FeedbackCreate, FeedbackResponse

router = APIRouter(
    prefix="/events/{eventId}/feedback",
    tags=["feedback"],
    dependencies=[Depends(require_roles(["fan", "volunteer", "operator", "organizer"]))],
)


@router.post("", response_model=StandardResponse, status_code=status.HTTP_201_CREATED)
def create_feedback(eventId: UUID, payload: FeedbackCreate):
    """Capture user or volunteer crowd feedback."""
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

    # Check zone membership
    zone = database.get_zone_by_id(payload.zone_id)
    if not zone or zone["event_id"] != eventId:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": {
                    "code": "INVALID_ZONE",
                    "message": f"Zone {payload.zone_id} does not belong to Event {eventId}.",
                }
            },
        )

    feedback_id = uuid4()
    created_at = datetime.now(UTC)

    feedback_record = {
        "id": feedback_id,
        "zone_id": payload.zone_id,
        "rating": payload.rating,
        "comment": payload.comment,
        "created_at": created_at,
    }

    database.add_feedback(feedback_record)

    return StandardResponse(data=FeedbackResponse(**feedback_record))
