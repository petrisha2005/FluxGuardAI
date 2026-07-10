from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.core import database
from app.core.security import require_roles
from app.schemas.base import StandardResponse
from app.services.copilot import resolve_copilot_query


class CopilotChatRequest(BaseModel):
    message: str


router = APIRouter(
    prefix="/events/{eventId}/copilot",
    tags=["copilot"],
    dependencies=[Depends(require_roles(["operator", "organizer", "volunteer"]))],
)


@router.post("/chat", response_model=StandardResponse)
async def chat_with_copilot(eventId: UUID, payload: CopilotChatRequest):
    """Sends a query to the FluxGuard AI Copilot, returning actionable response summaries."""
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

    if not payload.message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": {
                    "code": "EMPTY_MESSAGE",
                    "message": "Chat message query cannot be empty.",
                }
            },
        )

    res = await resolve_copilot_query(eventId, payload.message)
    return StandardResponse(data=res)
