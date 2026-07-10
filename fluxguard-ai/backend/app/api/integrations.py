from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.core import database
from app.core.security import require_roles
from app.schemas.base import StandardResponse
from app.services.adapters.ticket_scans import get_ticket_scan_rates
from app.services.adapters.transit import get_transit_status
from app.services.adapters.weather import get_current_weather

router = APIRouter(
    prefix="/events/{eventId}/integrations",
    tags=["integrations"],
    dependencies=[Depends(require_roles(["operator", "organizer", "volunteer"]))],
)


@router.get("", response_model=StandardResponse)
def get_integrations_status(eventId: UUID):
    """Fetch live aggregated states from external ticketing, transit, and weather adapters."""
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

    data = {
        "weather": get_current_weather(),
        "transit": get_transit_status(),
        "ticketScans": get_ticket_scan_rates(),
    }

    return StandardResponse(data=data)
