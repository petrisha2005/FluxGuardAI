from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.database import get_db_session
from app.core.security import require_roles
from app.db.models import Camera, CrowdMeasurement, Event, Incident, RiskScore, Stadium, Zone
from app.schemas.base import StandardResponse

router = APIRouter(
    prefix="/digital-twin",
    tags=["digital-twin"],
    dependencies=[Depends(require_roles(["operator", "organizer", "volunteer", "fan"]))],
)


def get_event_or_default(db, event_id: UUID | None = None) -> Event:
    if event_id:
        event = db.query(Event).filter(Event.id == event_id).first()
    else:
        event = db.query(Event).filter(Event.status == "active").first()
        if not event:
            event = db.query(Event).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": {
                    "code": "EVENT_NOT_FOUND",
                    "message": "No active event found in the database.",
                }
            },
        )
    return event


@router.get("/overview", response_model=StandardResponse)
def get_digital_twin_overview(eventId: UUID | None = None):
    with get_db_session() as db:
        event = get_event_or_default(db, eventId)
        stadium = db.query(Stadium).filter(Stadium.id == event.stadium_id).first()

        zones = db.query(Zone).filter(Zone.event_id == event.id).all()
        stadium_capacity = (
            stadium.capacity if stadium else (sum(z.capacity for z in zones) or 85000)
        )
        attendance = event.attendance or 72000

        risk_scores = db.query(RiskScore).filter(RiskScore.zone_id.in_([z.id for z in zones])).all()
        avg_density = (
            int(sum(r.risk_score for r in risk_scores) / len(risk_scores)) if risk_scores else 48
        )

        active_incidents = (
            db.query(Incident)
            .filter(Incident.event_id == event.id, Incident.status != "RESOLVED")
            .count()
        )

        risk_level = "LOW"
        if any(r.severity.upper() == "CRITICAL" for r in risk_scores):
            risk_level = "CRITICAL"
        elif any(r.severity.upper() == "HIGH" for r in risk_scores):
            risk_level = "HIGH"
        elif any(r.severity.upper() == "MEDIUM" for r in risk_scores):
            risk_level = "MEDIUM"

        return StandardResponse(
            data={
                "stadiumCapacity": stadium_capacity,
                "currentAttendance": attendance,
                "densityPercent": min(100, max(0, avg_density)),
                "riskLevel": risk_level,
                "activeIncidents": active_incidents,
                "gateStatus": "Restricted" if risk_level in ["HIGH", "CRITICAL"] else "Normal",
                "emergencyLevel": (
                    "RED"
                    if risk_level == "CRITICAL"
                    else "YELLOW" if risk_level == "HIGH" else "GREEN"
                ),
                "weather": {
                    "temp": 17.5,
                    "rain": "2.4mm" if risk_level in ["HIGH", "CRITICAL"] else "0.0mm",
                    "wind": "14km/h",
                    "visibility": "8km" if risk_level in ["HIGH", "CRITICAL"] else "12km",
                    "description": "Showers" if risk_level in ["HIGH", "CRITICAL"] else "Clear Sky",
                },
            }
        )


@router.get("/zones", response_model=StandardResponse)
def get_digital_twin_zones(eventId: UUID | None = None):
    with get_db_session() as db:
        event = get_event_or_default(db, eventId)
        zones = db.query(Zone).filter(Zone.event_id == event.id).all()

        data = []
        for zone in zones:
            risk_score_rec = db.query(RiskScore).filter(RiskScore.zone_id == zone.id).first()
            risk_val = risk_score_rec.risk_score if risk_score_rec else 35
            risk_sev = risk_score_rec.severity.upper() if risk_score_rec else "LOW"

            meas = (
                db.query(CrowdMeasurement)
                .filter(CrowdMeasurement.zone_id == zone.id)
                .order_by(CrowdMeasurement.measured_at.desc())
                .first()
            )
            density = meas.density_count if meas else risk_val
            queue = meas.queue_length if meas else (15 if risk_sev == "HIGH" else 0)

            incidents_count = (
                db.query(Incident)
                .filter(Incident.zone_id == zone.id, Incident.status != "RESOLVED")
                .count()
            )

            ai_recommendation = "Stable operations. Maintain posture."
            if density > 80:
                ai_recommendation = f"Open overflow exit corridors at {zone.name} immediately."
            elif density > 60:
                ai_recommendation = f"Deploy 3 additional stewards to assist {zone.name} flow."

            data.append(
                {
                    "id": str(zone.id),
                    "name": zone.name,
                    "density": min(100, max(0, density)),
                    "capacity": zone.capacity,
                    "risk": risk_val,
                    "status": risk_sev,
                    "occupancy": int(zone.capacity * (density / 100)),
                    "queueLength": queue,
                    "riskScore": risk_val,
                    "openIncidents": incidents_count,
                    "aiRecommendation": ai_recommendation,
                }
            )

        return StandardResponse(data=data)


@router.get("/incidents", response_model=StandardResponse)
def get_digital_twin_incidents(eventId: UUID | None = None):
    with get_db_session() as db:
        event = get_event_or_default(db, eventId)
        incidents = (
            db.query(Incident)
            .filter(Incident.event_id == event.id, Incident.status != "RESOLVED")
            .all()
        )

        data = []
        for inc in incidents:
            zone = db.query(Zone).filter(Zone.id == inc.zone_id).first()
            data.append(
                {
                    "id": str(inc.id),
                    "type": inc.type,
                    "zoneId": str(inc.zone_id) if inc.zone_id else None,
                    "zoneName": zone.name if zone else "Main Concourse",
                    "severity": inc.severity.upper(),
                    "description": inc.description or "Operational incident reported",
                    "status": inc.status,
                    "createdAt": inc.created_at.isoformat(),
                }
            )
        return StandardResponse(data=data)


@router.get("/heatmap", response_model=StandardResponse)
def get_digital_twin_heatmap(eventId: UUID | None = None):
    with get_db_session() as db:
        event = get_event_or_default(db, eventId)
        zones = db.query(Zone).filter(Zone.event_id == event.id).all()

        data = []
        for zone in zones:
            risk_score_rec = db.query(RiskScore).filter(RiskScore.zone_id == zone.id).first()
            density = risk_score_rec.risk_score if risk_score_rec else 40
            risk_sev = risk_score_rec.severity.upper() if risk_score_rec else "LOW"

            data.append(
                {
                    "zoneId": str(zone.id),
                    "zoneName": zone.name,
                    "density": min(100, max(0, density)),
                    "riskLevel": risk_sev,
                }
            )
        return StandardResponse(data=data)


@router.get("/cameras", response_model=StandardResponse)
def get_digital_twin_cameras(eventId: UUID | None = None):
    with get_db_session() as db:
        event = get_event_or_default(db, eventId)
        zones = db.query(Zone).filter(Zone.event_id == event.id).all()
        zone_ids = [z.id for z in zones]

        cameras = db.query(Camera).filter(Camera.zone_id.in_(zone_ids)).all()
        return StandardResponse(
            data=[
                {
                    "id": str(cam.id),
                    "name": cam.name,
                    "status": cam.status,
                    "fps": cam.fps,
                    "accuracy": cam.accuracy,
                    "zoneId": str(cam.zone_id),
                }
                for cam in cameras
            ]
        )


@router.get("/crowd-flow", response_model=StandardResponse)
def get_digital_twin_crowd_flow(eventId: UUID | None = None):
    with get_db_session() as db:
        event = get_event_or_default(db, eventId)
        zones = db.query(Zone).filter(Zone.event_id == event.id).all()

        # Connect zones in a circle/flow route: North Gate -> East Concourse -> Gate C -> West Entrance -> North Gate
        data = []
        for i in range(len(zones)):
            src = zones[i]
            tgt = zones[(i + 1) % len(zones)]

            risk_rec = db.query(RiskScore).filter(RiskScore.zone_id == src.id).first()
            src_risk = risk_rec.risk_score if risk_rec else 40

            flow_rate = int(src_risk * 1.5)
            velocity = round(max(0.4, 2.5 - (src_risk / 50.0)), 2)

            data.append(
                {
                    "sourceZoneId": str(src.id),
                    "sourceZoneName": src.name,
                    "targetZoneId": str(tgt.id),
                    "targetZoneName": tgt.name,
                    "flowRate": flow_rate,
                    "velocity": velocity,
                    "status": "NORMAL" if src_risk < 70 else "SLOWED",
                }
            )
        return StandardResponse(data=data)


@router.get("/live", response_model=StandardResponse)
def get_digital_twin_live(eventId: UUID | None = None):
    with get_db_session() as db:
        event = get_event_or_default(db, eventId)
        zones = db.query(Zone).filter(Zone.event_id == event.id).all()

        # Create a live events feed log from active incidents and high risk score zones
        logs = []

        incidents = (
            db.query(Incident)
            .filter(Incident.event_id == event.id)
            .order_by(Incident.created_at.desc())
            .limit(5)
            .all()
        )
        for inc in incidents:
            zone = db.query(Zone).filter(Zone.id == inc.zone_id).first()
            zone_name = zone.name if zone else "Stadium"
            logs.append(
                {
                    "timestamp": inc.created_at.strftime("%H:%M:%S"),
                    "message": f"Incident reported: {inc.type} in {zone_name} - {inc.description}",
                    "severity": inc.severity.upper(),
                }
            )

        risk_scores = (
            db.query(RiskScore)
            .filter(RiskScore.zone_id.in_([z.id for z in zones]), RiskScore.risk_score > 60)
            .all()
        )
        for r in risk_scores:
            zone = db.query(Zone).filter(Zone.id == r.zone_id).first()
            if zone:
                logs.append(
                    {
                        "timestamp": (
                            r.generated_at.strftime("%H:%M:%S")
                            if r.generated_at
                            else datetime.now().strftime("%H:%M:%S")
                        ),
                        "message": f"High density detected at {zone.name}: {r.risk_score}%",
                        "severity": r.severity.upper(),
                    }
                )

        # Sort logs by timestamp desc
        logs.sort(key=lambda x: x["timestamp"], reverse=True)
        return StandardResponse(data=logs[:6])
