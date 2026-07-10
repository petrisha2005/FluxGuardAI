from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.core import database
from app.core.security import require_roles
from app.core.websocket import manager
from app.schemas.base import StandardResponse
from app.schemas.guidance import GuidanceGenerateRequest, GuidanceResponse
from app.services import guidance

router = APIRouter(
    prefix="/events/{eventId}/guidance",
    tags=["guidance"],
    dependencies=[Depends(require_roles(["operator", "organizer"]))],
)


@router.post("/generate", response_model=StandardResponse, status_code=status.HTTP_201_CREATED)
async def generate_guidance(eventId: UUID, payload: GuidanceGenerateRequest):
    """Generate role-specific guidance for a safety alert."""
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

    # Check alert existence
    alert = database.get_alert_by_id(payload.alert_id)
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": {
                    "code": "ALERT_NOT_FOUND",
                    "message": f"Alert with ID {payload.alert_id} not found.",
                }
            },
        )

    try:
        record = guidance.generate_guidance_for_alert(
            alert_id=payload.alert_id,
            audience_role=payload.audience_role,
            language=payload.language,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": {
                    "code": "GENERATION_ERROR",
                    "message": f"Could not generate guidance: {str(e)}",
                }
            },
        ) from e

    response_obj = GuidanceResponse(**record)

    # Broadcast guidance update
    await manager.broadcast_to_event(
        str(eventId),
        "guidance_created",
        response_obj.model_dump(by_alias=True, mode="json"),
    )

    return StandardResponse(data=response_obj)
