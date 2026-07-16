from datetime import UTC, datetime
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, status

from app.core import database
from app.core.security import require_roles
from app.core.websocket import manager
from app.schemas.base import StandardResponse
from app.schemas.measurement import MeasurementCreate, MeasurementResponse

router = APIRouter(
    prefix="/events/{eventId}/measurements",
    tags=["measurements"],
    dependencies=[Depends(require_roles(["operator", "organizer", "volunteer"]))],
)


@router.post("", response_model=StandardResponse, status_code=status.HTTP_201_CREATED)
async def create_measurement(eventId: UUID, payload: MeasurementCreate):
    """Ingest crowd measurement from simulator or trusted integration."""
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

    # Ingest measurement
    measurement_id = uuid4()
    ingested_at = datetime.now(UTC)

    measurement_record = {
        "id": measurement_id,
        "zone_id": payload.zone_id,
        "measured_at": payload.measured_at,
        "density_count": payload.density_count,
        "flow_rate_per_minute": payload.flow_rate_per_minute,
        "queue_length": payload.queue_length,
        "source_type": payload.source_type,
        "confidence": payload.confidence,
        "ingested_at": ingested_at,
    }

    database.add_measurement(measurement_record)
    database.resolve_pending_interventions(eventId)

    response_obj = MeasurementResponse(**measurement_record)

    # Broadcast zone status update
    await manager.broadcast_to_event(
        str(eventId),
        "zone_status_updated",
        response_obj.model_dump(by_alias=True, mode="json"),
    )

    return StandardResponse(data=response_obj)
