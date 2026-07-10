from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core import database
from app.core.security import require_roles
from app.schemas.base import StandardResponse
from app.schemas.event import EventResponse
from app.schemas.zone import ZoneResponse

router = APIRouter(
    prefix="/events",
    tags=["events"],
    dependencies=[Depends(require_roles(["operator", "organizer", "volunteer"]))],
)


@router.get("", response_model=StandardResponse)
def list_events():
    """List all events visible to the authenticated user."""
    events = database.get_all_events()
    return StandardResponse(data=[EventResponse(**e) for e in events])


@router.get("/{eventId}", response_model=StandardResponse)
def get_event(eventId: UUID):
    """Fetch event details."""
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
    return StandardResponse(data=EventResponse(**event))


@router.get("/{eventId}/zones", response_model=StandardResponse)
def list_event_zones(eventId: UUID, zoneType: str | None = Query(None, alias="zoneType")):
    """List zones for an event."""
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
    zones = database.get_zones_for_event(eventId, zoneType)
    return StandardResponse(data=[ZoneResponse(**z) for z in zones])
