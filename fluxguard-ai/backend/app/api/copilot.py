from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.core import database
from app.core.security import require_roles
from app.schemas.base import StandardResponse
from app.services.copilot import resolve_command_center_query, resolve_copilot_query


class CopilotChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2_000)


class CommandCenterCopilotRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2_000)
    venue: str = Field(min_length=1, max_length=120)
    context: dict[str, Any] = Field(default_factory=dict)


class CommandCenterCopilotResponse(BaseModel):
    answer: str
    confidence: float = Field(ge=0, le=1)
    recommendations: list[str]
    risk_level: str = Field(pattern="^(LOW|MEDIUM|HIGH|CRITICAL)$")
    affected_zones: list[str] = Field(default_factory=list)
    recovery_time: str | None = None
    priority: str = Field(default="MONITOR")
    reasoning: str
    impact: str


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


command_center_router = APIRouter(
    prefix="/api/copilot",
    tags=["copilot"],
    dependencies=[Depends(require_roles(["operator", "organizer", "volunteer"]))],
)


@command_center_router.post("/chat", response_model=CommandCenterCopilotResponse)
async def chat_with_command_center_copilot(payload: CommandCenterCopilotRequest):
    """Enterprise command-center chat endpoint backed by live operational context."""
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

    return await resolve_command_center_query(
        message=payload.message,
        venue=payload.venue,
        context=payload.context,
    )
