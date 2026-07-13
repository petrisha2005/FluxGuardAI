from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

from app.core.security import require_roles
from app.core import database
from app.schemas.base import StandardResponse
from app.core.websocket import manager

router = APIRouter(
    prefix="/events/{eventId}/staffing",
    tags=["staffing"],
    dependencies=[Depends(require_roles(["operator", "organizer"]))],
)


class RedeploymentRequest(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )
    from_zone_id: UUID
    to_zone_id: UUID
    count: int = Field(..., gt=0)


class StaffingStatusResponse(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )
    current_staff: dict[str, int]
    recommended_staff: dict[str, int]
    suggestions: list[dict]


@router.get("", response_model=StandardResponse)
async def get_staffing_status(eventId: UUID):
    """Calculates active staffing optimization plan and suggests steward redeployment."""
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

    # Get current staff count per zone
    current = database.get_zone_staffing(eventId)
    total_staff = sum(current.values())

    zones = database.get_zones_for_event(eventId)
    if not zones:
        return StandardResponse(
            data=StaffingStatusResponse(
                current_staff={}, recommended_staff={}, suggestions=[]
            )
        )

    risk_scores = database.get_latest_risk_scores(eventId)

    # Get risk weights
    weights = {}
    for zone in zones:
        zone_id_str = str(zone["id"])
        latest_risk = next((s for s in risk_scores if s["zone_id"] == zone["id"]), None)
        severity = latest_risk.get("severity", "low").lower() if latest_risk else "low"

        # Map severities to weights
        if severity == "critical":
            weights[zone_id_str] = 4
        elif severity == "high":
            weights[zone_id_str] = 3
        elif severity == "medium":
            weights[zone_id_str] = 2
        else:
            weights[zone_id_str] = 1

    total_weight = sum(weights.values())

    # Distribute staff counts based on weights
    recommended = {}
    for zone_id_str in weights:
        share = weights[zone_id_str] / total_weight if total_weight > 0 else 0.25
        recommended[zone_id_str] = round(total_staff * share)

    # Reconcile sum differences
    diff = total_staff - sum(recommended.values())
    if diff != 0 and recommended:
        # Add remainder to the highest weight zone
        max_zone = max(weights, key=weights.get)
        recommended[max_zone] += diff

    # Compute surplus / deficit pairs to generate suggestions
    surpluses = []
    deficits = []
    for zone_id_str in current:
        curr = current[zone_id_str]
        rec = recommended.get(zone_id_str, curr)
        delta = curr - rec
        if delta > 0:
            surpluses.append({"zone_id": zone_id_str, "amount": delta})
        elif delta < 0:
            deficits.append({"zone_id": zone_id_str, "amount": abs(delta)})

    # Match surpluses with deficits
    suggestions = []
    surpluses.sort(key=lambda x: x["amount"], reverse=True)
    deficits.sort(key=lambda x: x["amount"], reverse=True)

    s_idx, d_idx = 0, 0
    while s_idx < len(surpluses) and d_idx < len(deficits):
        s = surpluses[s_idx]
        d = deficits[d_idx]

        transfer = min(s["amount"], d["amount"])
        if transfer > 0:
            suggestions.append(
                {
                    "fromZoneId": s["zone_id"],
                    "toZoneId": d["zone_id"],
                    "count": transfer,
                    "reason": f"Redeploy {transfer} stewards from low-risk zone to cover congestion risks.",
                }
            )
            s["amount"] -= transfer
            d["amount"] -= transfer

        if s["amount"] <= 0:
            s_idx += 1
        if d["amount"] <= 0:
            d_idx += 1

    return StandardResponse(
        data=StaffingStatusResponse(
            current_staff=current,
            recommended_staff=recommended,
            suggestions=suggestions,
        )
    )


@router.post("/redeploy", response_model=StandardResponse)
async def redeploy_staff(eventId: UUID, request_payload: RedeploymentRequest):
    """Executes a steward dispatch shift change between two zones."""
    current = database.get_zone_staffing(eventId)
    from_str = str(request_payload.from_zone_id)
    to_str = str(request_payload.to_zone_id)

    if from_str not in current or to_str not in current:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": {
                    "code": "INVALID_ZONE_ID",
                    "message": "One or both specified zone IDs are invalid for this event.",
                }
            },
        )

    if current[from_str] < request_payload.count:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": {
                    "code": "INSUFFICIENT_STAFF",
                    "message": f"Zone {from_str} has only {current[from_str]} staff, cannot redeploy {request_payload.count}.",
                }
            },
        )

    # Apply changes
    database.update_zone_staffing(
        eventId, request_payload.from_zone_id, current[from_str] - request_payload.count
    )
    database.update_zone_staffing(
        eventId, request_payload.to_zone_id, current[to_str] + request_payload.count
    )

    updated_staff = database.get_zone_staffing(eventId)

    # Broadcast websocket update
    await manager.broadcast_to_event(
        str(eventId),
        "staff_redeployed",
        {
            "fromZoneId": from_str,
            "toZoneId": to_str,
            "count": request_payload.count,
            "currentStaff": updated_staff,
        },
    )

    return StandardResponse(
        data={
            "status": "SUCCESS",
            "currentStaff": updated_staff,
        }
    )
