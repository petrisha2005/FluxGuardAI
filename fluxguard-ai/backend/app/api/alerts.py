from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status

from app.core import database
from app.schemas.alert import AlertResponse, AlertUpdate
from app.schemas.base import StandardResponse

router = APIRouter(prefix="/events/{eventId}/alerts", tags=["alerts"])


@router.get("", response_model=StandardResponse)
def list_alerts(
    eventId: UUID,
    status: str | None = Query(None, alias="status"),
    severity: str | None = Query(None, alias="severity"),
    zoneId: UUID | None = Query(None, alias="zoneId"),
):
    """Fetch all alerts filtered by status, severity, or zone."""
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

    alerts = database.get_alerts(eventId, status, severity, zoneId)
    return StandardResponse(data=[AlertResponse(**a) for a in alerts])


@router.post("/{alertId}/acknowledge", response_model=StandardResponse)
def acknowledge_alert(eventId: UUID, alertId: UUID):
    """Mark an alert acknowledged by operator."""
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

    alert = database.get_alert_by_id(alertId)
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": {
                    "code": "ALERT_NOT_FOUND",
                    "message": f"Alert with ID {alertId} not found.",
                }
            },
        )

    if alert["status"] == "resolved":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "error": {
                    "code": "ALERT_RESOLVED",
                    "message": f"Alert {alertId} is already resolved and cannot be acknowledged.",
                }
            },
        )

    updated_alert = database.update_alert(alertId, status="acknowledged")
    return StandardResponse(data=AlertResponse(**updated_alert))


@router.patch("/{alertId}", response_model=StandardResponse)
def patch_alert(eventId: UUID, alertId: UUID, payload: AlertUpdate):
    """Update alert status, assignee, or notes."""
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

    alert = database.get_alert_by_id(alertId)
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": {
                    "code": "ALERT_NOT_FOUND",
                    "message": f"Alert with ID {alertId} not found.",
                }
            },
        )

    updated_alert = database.update_alert(
        alertId,
        status=payload.status,
        notes=payload.notes,
        assignee=payload.assignee,
    )
    return StandardResponse(data=AlertResponse(**updated_alert))
