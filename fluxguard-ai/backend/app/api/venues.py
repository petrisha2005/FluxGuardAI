from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.core import database
from app.core.security import require_roles
from app.schemas.base import StandardResponse
from app.schemas.event import EventResponse
from app.schemas.venue import VenueResponse

router = APIRouter(
    prefix="/venues",
    tags=["venues"],
    dependencies=[Depends(require_roles(["operator", "organizer", "volunteer", "fan"]))],
)


@router.get("", response_model=StandardResponse)
def list_venues():
    """List all venues in the tournament city."""
    venues = database.get_all_venues()
    return StandardResponse(data=[VenueResponse(**v) for v in venues])


@router.get("/{venueId}/events", response_model=StandardResponse)
def list_venue_events(venueId: UUID):
    """List events for a specific venue."""
    venue = database.get_venue_by_id(venueId)
    if not venue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": {
                    "code": "VENUE_NOT_FOUND",
                    "message": f"Venue with ID {venueId} not found.",
                }
            },
        )
    events = database.get_events_for_venue(venueId)
    return StandardResponse(data=[EventResponse(**e) for e in events])
