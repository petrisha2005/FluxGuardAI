import contextlib
import json
import logging
import uuid
from datetime import UTC, datetime
from uuid import UUID, uuid4

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings
from app.db.database import Base
from app.db.models import (
    ActionExecution,
    AgentDecision,
    Alert,
    AuditLog,
    Camera,
    CrowdMeasurement,
    Event,
    Feedback,
    GuidanceMessage,
    HistoricalRecord,
    Incident,
    Intervention,
    Prediction,
    RiskScore,
    Stadium,
    User,
    Volunteer,
    Zone,
    ZoneStaffing,
)
from app.repositories.event_repository import EventRepository
from app.repositories.incident_repository import IncidentRepository
from app.repositories.stadium_repository import StadiumRepository
from app.repositories.volunteer_repository import VolunteerRepository

logger = logging.getLogger("fluxguard.database")


def utc_now() -> datetime:
    return datetime.now(UTC)


# Thread-local / Global DB connection variables
_engine = None
_SessionLocal = None
_fallback_active = False


def custom_json_serializer(obj):
    def default(o):
        if isinstance(o, datetime):
            return o.isoformat()
        raise TypeError(f"Object of type {o.__class__.__name__} is not JSON serializable")

    return json.dumps(obj, default=default)


def init_db() -> None:
    """Initializes standard SQLAlchemy engine, fallback engine, and schema creation."""
    import sys

    global _engine, _SessionLocal, _fallback_active
    settings = get_settings()
    db_url = settings.database_url

    if "pytest" in sys.modules:
        _fallback_active = True
        db_url = "sqlite:///:memory:"
    elif not db_url:
        _fallback_active = True
        db_url = "sqlite:///:memory:"

    from sqlalchemy.pool import StaticPool

    try:
        if db_url.startswith("sqlite"):
            if db_url == "sqlite:///:memory:":
                _engine = create_engine(
                    db_url,
                    connect_args={"check_same_thread": False},
                    poolclass=StaticPool,
                    json_serializer=custom_json_serializer,
                )
            else:
                _engine = create_engine(
                    db_url,
                    connect_args={"check_same_thread": False},
                    json_serializer=custom_json_serializer,
                )
        else:
            _engine = create_engine(
                db_url,
                pool_pre_ping=True,
                json_serializer=custom_json_serializer,
            )

        # Test connection
        with _engine.connect():
            pass
        _SessionLocal = sessionmaker(bind=_engine, autocommit=False, autoflush=False)
    except Exception as e:
        logger.warning(
            f"Connection to primary database failed: {e}. Defaulting to isolated SQLite fallback."
        )
        _fallback_active = True
        _engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
            json_serializer=custom_json_serializer,
        )
        _SessionLocal = sessionmaker(bind=_engine, autocommit=False, autoflush=False)

    # Initialize all SQLAlchemy tables
    Base.metadata.create_all(_engine)

    if _fallback_active or db_url.startswith("sqlite"):
        with contextlib.closing(_SessionLocal()) as db:
            _seed_baseline_data(db)


def _seed_baseline_data(db: Session) -> None:
    """Seeds baseline Lucusa stadium event information for test suites and development fallbacks."""
    if db.query(Stadium).count() > 0:
        return

    # Seed Venues
    stadiums = [
        Stadium(
            id=UUID("b0000000-0000-0000-0000-000000000000"),
            name="Lucusa Stadium",
            city="Lucusa",
            country="Lusaka",
            capacity=85000,
            latitude=-15.4167,
            longitude=28.2833,
        ),
        Stadium(
            id=UUID("b0000000-0000-0000-0000-000000000001"),
            name="City Arena",
            city="Lucusa",
            country="Lusaka",
            capacity=45000,
            latitude=-15.4300,
            longitude=28.3100,
        ),
        Stadium(
            id=UUID("b0000000-0000-0000-0000-000000000002"),
            name="Downtown Fan Zone",
            city="Lucusa",
            country="Lusaka",
            capacity=25000,
            latitude=-15.4050,
            longitude=28.2700,
        ),
    ]
    for s in stadiums:
        db.add(s)
    db.commit()

    # Seed Events
    events = [
        Event(
            id=UUID("e0000000-0000-0000-0000-000000000000"),
            stadium_id=stadiums[0].id,
            name="FIFA World Cup 2026 - Opening Match",
            date=datetime(2026, 6, 11, 18, 0, 0),
            attendance=75000,
            description="Opening match at the stadium",
            status="active",
            starts_at=datetime(2026, 6, 11, 18, 0, 0),
            ends_at=datetime(2026, 6, 11, 22, 0, 0),
        ),
        Event(
            id=UUID("e0000000-0000-0000-0000-000000000001"),
            stadium_id=stadiums[1].id,
            name="FIFA World Cup 2026 - Group B Match",
            date=datetime(2026, 6, 12, 15, 0, 0),
            attendance=42000,
            description="Group Stage B match",
            status="active",
            starts_at=datetime(2026, 6, 12, 15, 0, 0),
            ends_at=datetime(2026, 6, 12, 19, 0, 0),
        ),
        Event(
            id=UUID("e0000000-0000-0000-0000-000000000002"),
            stadium_id=stadiums[2].id,
            name="World Cup City Live Watch Party",
            date=datetime(2026, 6, 12, 18, 0, 0),
            attendance=18000,
            description="Downtown watch party under the stars",
            status="active",
            starts_at=datetime(2026, 6, 12, 18, 0, 0),
            ends_at=datetime(2026, 6, 12, 23, 0, 0),
        ),
    ]
    for e in events:
        db.add(e)
    db.commit()

    # Seed Zones
    zones = [
        # Lucusa Stadium
        Zone(
            id=UUID("00000000-0000-0000-0000-000000000001"),
            event_id=events[0].id,
            name="North Gate",
            zone_type="gate",
            capacity=2000,
            status="open",
        ),
        Zone(
            id=UUID("00000000-0000-0000-0000-000000000002"),
            event_id=events[0].id,
            name="East Concourse",
            zone_type="concourse",
            capacity=5000,
            status="open",
        ),
        Zone(
            id=UUID("00000000-0000-0000-0000-000000000003"),
            event_id=events[0].id,
            name="Gate C",
            zone_type="gate",
            capacity=1500,
            status="open",
        ),
        Zone(
            id=UUID("00000000-0000-0000-0000-000000000004"),
            event_id=events[0].id,
            name="West Entrance",
            zone_type="gate",
            capacity=1800,
            status="open",
        ),
        # City Arena
        Zone(
            id=UUID("00000000-0000-0000-0000-000000000005"),
            event_id=events[1].id,
            name="Main Entry Gate",
            zone_type="gate",
            capacity=3000,
            status="open",
        ),
        Zone(
            id=UUID("00000000-0000-0000-0000-000000000006"),
            event_id=events[1].id,
            name="South Concourse",
            zone_type="concourse",
            capacity=4000,
            status="open",
        ),
        Zone(
            id=UUID("00000000-0000-0000-0000-000000000007"),
            event_id=events[1].id,
            name="North Gate Stand",
            zone_type="gate",
            capacity=2500,
            status="open",
        ),
        # Downtown Fan Zone
        Zone(
            id=UUID("00000000-0000-0000-0000-000000000008"),
            event_id=events[2].id,
            name="Screening Plaza",
            zone_type="concourse",
            capacity=8000,
            status="open",
        ),
        Zone(
            id=UUID("00000000-0000-0000-0000-000000000009"),
            event_id=events[2].id,
            name="Food & Beverage Court",
            zone_type="concourse",
            capacity=3000,
            status="open",
        ),
        Zone(
            id=UUID("00000000-0000-0000-0000-000000000010"),
            event_id=events[2].id,
            name="Transit Egress Gate",
            zone_type="gate",
            capacity=5000,
            status="open",
        ),
    ]
    for z in zones:
        db.add(z)
    db.commit()

    # Seed Cameras for all zones
    for zone in zones:
        zone_id_str = str(zone.id)
        if zone.name == "North Gate":
            db.add(
                Camera(
                    id=f"{zone_id_str}-cam-1",
                    zone_id=zone.id,
                    name="North Entrance Turnstiles - Cam 1",
                    fps=30,
                    accuracy=0.94,
                    status="active",
                )
            )
        elif zone.name == "East Concourse":
            db.add(
                Camera(
                    id=f"{zone_id_str}-cam-1",
                    zone_id=zone.id,
                    name="East Concourse Central - Cam 1",
                    fps=30,
                    accuracy=0.96,
                    status="active",
                )
            )
            db.add(
                Camera(
                    id=f"{zone_id_str}-cam-2",
                    zone_id=zone.id,
                    name="East Concourse Exit Stairwell - Cam 2",
                    fps=24,
                    accuracy=0.91,
                    status="active",
                )
            )
        elif zone.name == "Gate C":
            db.add(
                Camera(
                    id=f"{zone_id_str}-cam-1",
                    zone_id=zone.id,
                    name="Gate C Main Turnstile - Cam 1",
                    fps=30,
                    accuracy=0.95,
                    status="active",
                )
            )
        elif zone.name == "West Entrance":
            db.add(
                Camera(
                    id=f"{zone_id_str}-cam-1",
                    zone_id=zone.id,
                    name="West Plaza Entry - Cam 1",
                    fps=30,
                    accuracy=0.93,
                    status="active",
                )
            )
        else:
            db.add(
                Camera(
                    id=f"{zone_id_str}-cam-1",
                    zone_id=zone.id,
                    name=f"{zone.name} Monitoring - Cam 1",
                    fps=24,
                    accuracy=0.92,
                    status="active",
                )
            )

    # Seed Volunteers
    volunteers_data = [
        {
            "name": "Mateo Silva",
            "languages": "Spanish,English",
            "skills": "First Aid,Egress Support",
            "location": "Fan Zone A",
        },
        {
            "name": "Sofia Hernandez",
            "languages": "Spanish,French",
            "skills": "Crowd Guidance,Translation",
            "location": "Fan Zone A",
        },
        {
            "name": "Carlos Gomez",
            "languages": "Spanish,English",
            "skills": "Ticketing,First Aid",
            "location": "Gate C",
        },
        {
            "name": "Elena Rostova",
            "languages": "Russian,English",
            "skills": "Translation,VIP Escort",
            "location": "VIP Stand",
        },
        {
            "name": "Kenji Sato",
            "languages": "Japanese,English",
            "skills": "Crowd Guidance,Egress Support",
            "location": "North Concourse",
        },
        {
            "name": "Marie Dubois",
            "languages": "French,English",
            "skills": "Translation,First Aid",
            "location": "East Gate",
        },
        {
            "name": "Lucia Rossi",
            "languages": "Italian,Spanish",
            "skills": "Translation,Crowd Guidance",
            "location": "Fan Zone A",
        },
        {
            "name": "Diego Alvarez",
            "languages": "Spanish,English",
            "skills": "First Aid,Crowd Guidance",
            "location": "Fan Zone A",
        },
    ]
    for v_data in volunteers_data:
        vol = Volunteer(
            id=uuid.uuid4(),
            name=v_data["name"],
            language=v_data["languages"],
            skill=v_data["skills"],
            availability="Available",
            assigned_zone=v_data["location"],
        )
        db.add(vol)

    # Seed AI Decisions & Execution for mock loops
    dec = AgentDecision(
        id=UUID("00000000-0000-0000-0000-000000000001"),
        agent_name="Crowd Control Agent",
        recommendation="OPEN_GATE",
        target="Gate B",
        confidence=94,
        reason="Gate C density exceeds safety threshold",
        expected_impact="Queue duration reduced by 28%",
        status="PENDING_APPROVAL",
    )
    db.add(dec)

    learning_records = [
        ("OPEN_GATE (Gate B)", "Queue length reduced by 31% within 9 minutes", 94),
        ("ASSIGN_STAFF (Gate C)", "Crowd stress resolved; queue stabilized in 7 minutes", 89),
        (
            "INCREASE_SHUTTLE_FREQUENCY (North Station)",
            "Train terminal egress cleared 11 minutes faster than average",
            91,
        ),
    ]
    for action, outcome, score in learning_records:
        rec = HistoricalRecord(
            id=uuid.uuid4(),
            event_name="Reinforcement Learning Sync",
            action=action,
            outcome=outcome,
            effectiveness=score,
            historical_success_rate=f"{score - 2}%",
        )
        db.add(rec)

    db.commit()


@contextlib.contextmanager
def get_db_session() -> Session:
    """Yields database session context manager."""
    global _SessionLocal
    if not _SessionLocal:
        init_db()
    db = _SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_db_pool() -> Session | None:
    """Mock connection pool compatibility layer."""
    global _SessionLocal
    if not _SessionLocal:
        init_db()
    if _fallback_active:
        return None
    return _engine


# --- Event Coordinator Queries ---


def get_all_events() -> list[dict]:
    with get_db_session() as db:
        return EventRepository(db).get_all_events()


def get_event_by_id(event_id: UUID) -> dict | None:
    with get_db_session() as db:
        return EventRepository(db).get_event_by_id(event_id)


# --- Stadium & Venue Queries ---


def get_all_venues() -> list[dict]:
    with get_db_session() as db:
        return StadiumRepository(db).get_all_stadiums()


def get_venue_by_id(venue_id: UUID) -> dict | None:
    with get_db_session() as db:
        return StadiumRepository(db).get_stadium_by_id(venue_id)


def get_events_for_venue(venue_id: UUID) -> list[dict]:
    with get_db_session() as db:
        return EventRepository(db).get_events_for_venue(venue_id)


# --- Zone Queries ---


def get_zones_for_event(event_id: UUID, zone_type: str | None = None) -> list[dict]:
    with get_db_session() as db:
        return StadiumRepository(db).get_zones_for_event(event_id, zone_type)


def get_zone_by_id(zone_id: UUID) -> dict | None:
    with get_db_session() as db:
        return StadiumRepository(db).get_zone_by_id(zone_id)


# --- Crowd Measurement Queries ---


def add_measurement(measurement: dict) -> None:
    with get_db_session() as db:
        StadiumRepository(db).add_measurement(measurement)


def get_all_measurements() -> list[dict]:
    with get_db_session() as db:
        return StadiumRepository(db).get_all_measurements()


# --- Predictions Queries ---


def add_prediction(prediction: dict) -> None:
    with get_db_session() as db:
        StadiumRepository(db).add_prediction(prediction)


def get_predictions(
    event_id: UUID, zone_id: UUID | None = None, horizon_minutes: int | None = None, since=None
) -> list[dict]:
    with get_db_session() as db:
        # Note: since parameter is ignored in basic SQLite/ORM compatibility queries
        return StadiumRepository(db).get_predictions(event_id, zone_id, horizon_minutes)


# --- Risk Scores Queries ---


def update_risk_score(zone_id: UUID, risk_score_data: dict) -> None:
    with get_db_session() as db:
        StadiumRepository(db).update_risk_score(zone_id, risk_score_data)


def get_latest_risk_scores(event_id: UUID) -> list[dict]:
    with get_db_session() as db:
        return StadiumRepository(db).get_latest_risk_scores(event_id)


# --- Alerts Queries ---


def add_alert(alert_data: dict) -> None:
    with get_db_session() as db:
        IncidentRepository(db).add_alert(alert_data)


def get_alert_by_id(alert_id: UUID) -> dict | None:
    with get_db_session() as db:
        return IncidentRepository(db).get_alert_by_id(alert_id)


def update_alert(
    alert_id: UUID, status: str | None = None, notes: str | None = None, assignee: str | None = None
) -> dict | None:
    with get_db_session() as db:
        return IncidentRepository(db).update_alert(alert_id, assignee, status, notes)


def get_alerts(
    event_id: UUID,
    status: str | None = None,
    severity: str | None = None,
    zone_id: UUID | None = None,
) -> list[dict]:
    with get_db_session() as db:
        alerts = IncidentRepository(db).get_alerts(event_id, status)
        if severity:
            alerts = [alt for alt in alerts if alt["severity"].upper() == severity.upper()]
        if zone_id:
            alerts = [alt for alt in alerts if alt["zone_id"] == zone_id]
        return alerts


# --- Guidance Message Queries ---


def add_guidance(guidance_record: dict) -> None:
    with get_db_session() as db:
        IncidentRepository(db).add_guidance(guidance_record)


def get_guidance_for_alert(alert_id: UUID, audience_role: str) -> dict | None:
    with get_db_session() as db:
        return IncidentRepository(db).get_guidance_for_alert(alert_id, audience_role)


def get_guidance_by_id(guidance_id: UUID) -> dict | None:
    with get_db_session() as db:
        return IncidentRepository(db).get_guidance_by_id(guidance_id)


def update_guidance_status(guidance_id: UUID, status: str) -> dict | None:
    with get_db_session() as db:
        return IncidentRepository(db).update_guidance_status(guidance_id, status)


def get_active_approved_guidance(event_id: UUID) -> list[dict]:
    with get_db_session() as db:
        return IncidentRepository(db).get_active_approved_guidance(event_id)


# --- Feedback Queries ---


def add_feedback(feedback_record: dict) -> None:
    with get_db_session() as db:
        StadiumRepository(db).add_feedback(feedback_record)


def get_all_feedback() -> list[dict]:
    with get_db_session() as db:
        return StadiumRepository(db).get_all_feedback()


# --- Staffing & Volunteers Queries ---


def get_zone_staffing(event_id: UUID) -> dict[str, int]:
    with get_db_session() as db:
        return EventRepository(db).get_zone_staffing(event_id)


def update_zone_staffing(event_id: UUID, zone_id: UUID, count: int) -> None:
    with get_db_session() as db:
        EventRepository(db).update_zone_staffing(event_id, zone_id, count)


def get_all_volunteers() -> list[dict]:
    with get_db_session() as db:
        return VolunteerRepository(db).get_all_volunteers()


# --- Incidents Queries ---


def add_incident(incident: dict) -> None:
    with get_db_session() as db:
        IncidentRepository(db).add_incident(incident)


def get_incidents(event_id: UUID) -> list[dict]:
    with get_db_session() as db:
        return IncidentRepository(db).get_incidents(event_id)


def update_incident_status(
    event_id: UUID, incident_id: UUID, status: str, responder_name: str | None = None
) -> dict | None:
    with get_db_session() as db:
        return IncidentRepository(db).update_incident_status(incident_id, status, responder_name)


# --- Cameras & Interventions ---


def get_cameras_for_event(event_id: UUID) -> list[dict]:
    with get_db_session() as db:
        return StadiumRepository(db).get_cameras_for_event(event_id)


def get_zone_links(event_id: UUID) -> list[dict]:
    with get_db_session() as db:
        return StadiumRepository(db).get_zone_links(event_id)


def add_intervention(intervention: dict) -> None:
    with get_db_session() as db:
        i = Intervention(
            id=intervention["id"],
            event_id=intervention["event_id"],
            zone_id=intervention["zone_id"],
            type=intervention["type"],
            description=intervention["description"],
            trigger_tick=intervention["trigger_tick"],
            pre_density=intervention["pre_density"],
            pre_risk=intervention["pre_risk"],
            post_density=intervention["post_density"],
            post_risk=intervention["post_risk"],
            timestamp=intervention.get("timestamp") or utc_now(),
        )
        db.add(i)
        db.commit()


def get_interventions(event_id: UUID) -> list[dict]:
    with get_db_session() as db:
        records = db.query(Intervention).filter(Intervention.event_id == event_id).all()
        return [
            {
                "id": r.id,
                "event_id": r.event_id,
                "zone_id": r.zone_id,
                "type": r.type,
                "description": r.description,
                "trigger_tick": r.trigger_tick,
                "pre_density": r.pre_density,
                "pre_risk": r.pre_risk,
                "post_density": r.post_density,
                "post_risk": r.post_risk,
                "timestamp": r.timestamp,
            }
            for r in records
        ]


def update_intervention(event_id: UUID, intervention_id: UUID, updates: dict) -> None:
    with get_db_session() as db:
        r = (
            db.query(Intervention)
            .filter(Intervention.event_id == event_id, Intervention.id == intervention_id)
            .first()
        )
        if r:
            if "post_density" in updates:
                r.post_density = updates["post_density"]
            if "post_risk" in updates:
                r.post_risk = updates["post_risk"]
            db.commit()


def log_intervention_action(event_id: UUID, zone_id: UUID, type_str: str, description: str) -> None:
    measurements = get_all_measurements()
    current_tick = len(measurements) // 4

    zone_measurements = [m for m in measurements if m["zone_id"] == zone_id]
    latest_m = max(zone_measurements, key=lambda x: x["measured_at"]) if zone_measurements else None

    zone = get_zone_by_id(zone_id)
    capacity = zone["capacity"] if zone else 500
    density_percentage = 0
    if latest_m and capacity > 0:
        density_percentage = round((latest_m["density_count"] / capacity) * 100)

    risk_scores = get_latest_risk_scores(event_id)
    latest_risk = next((s for s in risk_scores if s["zone_id"] == zone_id), None)
    pre_risk = latest_risk["severity"].upper() if latest_risk else "LOW"

    intervention = {
        "id": uuid4(),
        "event_id": event_id,
        "zone_id": zone_id,
        "type": type_str,
        "description": description,
        "trigger_tick": current_tick,
        "pre_density": density_percentage,
        "pre_risk": pre_risk,
        "post_density": None,
        "post_risk": None,
        "timestamp": utc_now(),
    }
    add_intervention(intervention)


def resolve_pending_interventions(event_id: UUID) -> None:
    with get_db_session() as db:
        measurements = get_all_measurements()
        current_tick = len(measurements) // 4

        pending = (
            db.query(Intervention)
            .filter(Intervention.event_id == event_id, Intervention.post_density.is_(None))
            .all()
        )

        for i in pending:
            # Resolve after 2 ticks
            if current_tick >= i.trigger_tick + 2:
                zone_id = i.zone_id
                zone_measurements = [m for m in measurements if m["zone_id"] == zone_id]
                latest_m = (
                    max(zone_measurements, key=lambda x: x["measured_at"])
                    if zone_measurements
                    else None
                )

                zone = get_zone_by_id(zone_id)
                capacity = zone["capacity"] if zone else 500
                density_percentage = 0
                if latest_m and capacity > 0:
                    density_percentage = round((latest_m["density_count"] / capacity) * 100)

                risk_scores = get_latest_risk_scores(event_id)
                latest_risk = next((s for s in risk_scores if s["zone_id"] == zone_id), None)
                post_risk = latest_risk["severity"].upper() if latest_risk else "LOW"

                i.post_density = density_percentage
                i.post_risk = post_risk
        db.commit()


def clear_database() -> None:
    """Wipes all records from tables to support isolation resets during tests."""
    with get_db_session() as db:
        db.query(GuidanceMessage).delete()
        db.query(Feedback).delete()
        db.query(Alert).delete()
        db.query(RiskScore).delete()
        db.query(Prediction).delete()
        db.query(CrowdMeasurement).delete()
        db.query(Camera).delete()
        db.query(ZoneStaffing).delete()
        db.query(Zone).delete()
        db.query(Incident).delete()
        db.query(Event).delete()
        db.query(Stadium).delete()
        db.query(Volunteer).delete()
        db.query(ActionExecution).delete()
        db.query(AgentDecision).delete()
        db.query(HistoricalRecord).delete()
        db.query(User).delete()
        db.query(AuditLog).delete()
        db.query(Intervention).delete()
        db.commit()

        # Re-seed baseline data for test integrity
        _seed_baseline_data(db)


def get_city_overview_data() -> list[dict]:
    """Fetches and aggregates operations statuses across all stadiums in a single DB transaction."""
    with get_db_session() as db:
        stadiums = db.query(Stadium).all()
        result = []
        for s in stadiums:
            event = (
                db.query(Event).filter(Event.stadium_id == s.id, Event.status == "active").first()
            )
            if not event:
                event = db.query(Event).filter(Event.stadium_id == s.id).first()

            avg_density = 45
            active_incidents = 0
            active_alerts = 0
            total_capacity = 0
            total_stewards = 0
            risk_level = "LOW"
            event_name = "No Active Event"
            event_id = ""

            if event:
                event_name = event.name
                event_id = str(event.id)
                zones = db.query(Zone).filter(Zone.event_id == event.id).all()
                total_capacity = sum(z.capacity for z in zones) if zones else 0
                zone_ids = [z.id for z in zones]

                if zone_ids:
                    risk_scores = db.query(RiskScore).filter(RiskScore.zone_id.in_(zone_ids)).all()
                    if risk_scores:
                        severities = [rs.severity.upper() for rs in risk_scores]
                        if "CRITICAL" in severities:
                            risk_level = "CRITICAL"
                        elif "HIGH" in severities:
                            risk_level = "HIGH"
                        elif "MEDIUM" in severities:
                            risk_level = "MEDIUM"

                    alerts = db.query(Alert).filter(Alert.zone_id.in_(zone_ids)).all()
                    active_incidents = len([a for a in alerts if a.status == "unacknowledged"])
                    active_alerts = len(alerts)

                    staffing_records = (
                        db.query(ZoneStaffing).filter(ZoneStaffing.zone_id.in_(zone_ids)).all()
                    )
                    total_stewards = sum(sr.stewards_count for sr in staffing_records)

            result.append(
                {
                    "id": str(s.id),
                    "name": s.name,
                    "city": s.city,
                    "country": s.country,
                    "latitude": s.latitude or -15.4167,
                    "longitude": s.longitude or 28.2833,
                    "activeEventName": event_name,
                    "activeEventId": event_id,
                    "averageDensity": avg_density,
                    "activeIncidentsCount": active_incidents,
                    "activeAlertsCount": active_alerts,
                    "totalCapacity": total_capacity,
                    "totalStewards": total_stewards,
                    "riskLevel": risk_level,
                }
            )
        return result
