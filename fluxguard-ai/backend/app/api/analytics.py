from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

from app.core.security import require_roles
from app.core import database
from app.schemas.base import StandardResponse

router = APIRouter(
    prefix="/events/{eventId}/analytics",
    tags=["analytics"],
    dependencies=[Depends(require_roles(["operator", "organizer"]))],
)


class InterventionResponse(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )
    id: UUID
    event_id: UUID
    zone_id: UUID
    type: str
    description: str
    trigger_tick: int
    pre_density: int
    pre_risk: str
    post_density: int | None = None
    post_risk: str | None = None
    timestamp: datetime


@router.get("/interventions", response_model=StandardResponse)
async def get_interventions(eventId: UUID):
    """Retrieves all logged interventions and their impact telemetry."""
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

    interventions = database.get_interventions(eventId)
    return StandardResponse(data=[InterventionResponse(**i) for i in interventions])
