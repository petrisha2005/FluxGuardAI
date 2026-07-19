from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core import database
from app.core.security import require_roles
from app.schemas.base import StandardResponse
from app.schemas.camera import CameraResponse
from app.schemas.event import EventResponse
from app.schemas.routing import RoutingRecommendationResponse
from app.schemas.zone import ZoneResponse
from app.schemas.zone_link import ZoneLinkResponse
from app.services.routing import generate_routing_recommendations

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


@router.get("/{eventId}/links", response_model=StandardResponse)
def get_event_zone_links(eventId: UUID):
    """Fetch connection links between zones for an event."""
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
    links = database.get_zone_links(eventId)
    return StandardResponse(data=[ZoneLinkResponse(**link) for link in links])


@router.get("/{eventId}/cameras", response_model=StandardResponse)
def get_event_cameras(eventId: UUID):
    """Fetch simulated cameras for an event."""
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
    cameras = database.get_cameras_for_event(eventId)
    return StandardResponse(data=[CameraResponse(**c) for c in cameras])


@router.get("/{eventId}/routing-recommendations", response_model=StandardResponse)
def get_event_routing_recommendations(eventId: UUID):
    """Fetch AI-generated routing/detour recommendations for an event."""
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
    recommendations = generate_routing_recommendations(eventId)
    return StandardResponse(data=[RoutingRecommendationResponse(**r) for r in recommendations])
