from datetime import UTC, datetime
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

from app.core import database
from app.core.security import require_roles
from app.core.websocket import manager
from app.schemas.base import StandardResponse

router = APIRouter(
    prefix="/events/{eventId}/incidents",
    tags=["incidents"],
    dependencies=[Depends(require_roles(["operator", "organizer", "volunteer"]))],
)


class IncidentCreateRequest(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )
    zone_id: UUID
    type: str = Field(..., pattern="^(MEDICAL|SECURITY|FACILITY|CROWD_FLOW)$")
    severity: str = Field(..., pattern="^(LOW|MEDIUM|HIGH|CRITICAL)$")
    description: str


class IncidentDispatchRequest(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )
    responder_name: str = Field(..., min_length=1)


class IncidentResponse(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )
    id: UUID
    event_id: UUID
    zone_id: UUID
    type: str
    severity: str
    status: str
    description: str
    responder_name: str | None = None
    created_at: datetime
    resolved_at: datetime | None = None


@router.get("", response_model=StandardResponse)
async def get_incidents(eventId: UUID):
    """Lists all reported incidents for the specified event."""
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

    incidents = database.get_incidents(eventId)
    return StandardResponse(data=[IncidentResponse(**i) for i in incidents])


@router.post("", response_model=StandardResponse, status_code=status.HTTP_201_CREATED)
async def create_incident(eventId: UUID, request_payload: IncidentCreateRequest):
    """Creates a new incident safety ticket and broadcasts it via WebSocket."""
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

    # Validate zone belongs to event
    zones = database.get_zones_for_event(eventId)
    zone_ids = [z["id"] for z in zones]
    if request_payload.zone_id not in zone_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": {
                    "code": "INVALID_ZONE_ID",
                    "message": f"Zone {request_payload.zone_id} does not belong to event {eventId}.",
                }
            },
        )

    incident = {
        "id": uuid4(),
        "event_id": eventId,
        "zone_id": request_payload.zone_id,
        "type": request_payload.type,
        "severity": request_payload.severity,
        "status": "REPORTED",
        "description": request_payload.description,
        "responder_name": None,
        "created_at": datetime.now(UTC),
        "resolved_at": None,
    }

    database.add_incident(incident)

    response_obj = IncidentResponse(**incident)

    # Broadcast websocket trigger
    await manager.broadcast_to_event(
        str(eventId),
        "incident_created",
        response_obj.model_dump(by_alias=True, mode="json"),
    )

    return StandardResponse(data=response_obj)


@router.post("/{incidentId}/dispatch", response_model=StandardResponse)
async def dispatch_responder(
    eventId: UUID, incidentId: UUID, request_payload: IncidentDispatchRequest
):
    """Dispatches a safety volunteer / steward to resolve the incident."""
    updated = database.update_incident_status(
        eventId, incidentId, "DISPATCHED", request_payload.responder_name
    )
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": {
                    "code": "INCIDENT_NOT_FOUND",
                    "message": f"Incident with ID {incidentId} not found for event {eventId}.",
                }
            },
        )

    response_obj = IncidentResponse(**updated)

    # Broadcast websocket trigger
    await manager.broadcast_to_event(
        str(eventId),
        "incident_updated",
        response_obj.model_dump(by_alias=True, mode="json"),
    )

    return StandardResponse(data=response_obj)


@router.post("/{incidentId}/resolve", response_model=StandardResponse)
async def resolve_incident(eventId: UUID, incidentId: UUID):
    """Marks an active incident ticket as resolved."""
    updated = database.update_incident_status(eventId, incidentId, "RESOLVED")
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": {
                    "code": "INCIDENT_NOT_FOUND",
                    "message": f"Incident with ID {incidentId} not found for event {eventId}.",
                }
            },
        )

    database.log_intervention_action(
        eventId,
        updated["zone_id"],
        "INCIDENT",
        f"Resolved {updated['type'].lower()} incident ticket: {updated.get('description', '')}",
    )

    response_obj = IncidentResponse(**updated)

    # Broadcast websocket trigger
    await manager.broadcast_to_event(
        str(eventId),
        "incident_updated",
        response_obj.model_dump(by_alias=True, mode="json"),
    )

    return StandardResponse(data=response_obj)
