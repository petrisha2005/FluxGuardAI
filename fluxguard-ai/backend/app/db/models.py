import uuid
from datetime import UTC, datetime

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import relationship
from sqlalchemy.types import CHAR, TypeDecorator

from app.db.database import Base


def utc_now() -> datetime:
    return datetime.now(UTC)


class GUID(TypeDecorator):
    """Platform-independent GUID type.
    Uses PostgreSQL's UUID type, otherwise uses CHAR(32), storing as string without hyphens.
    """

    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(PG_UUID(as_uuid=True))
        else:
            return dialect.type_descriptor(CHAR(32))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        elif dialect.name == "postgresql":
            return str(value)
        else:
            if not isinstance(value, uuid.UUID):
                try:
                    return uuid.UUID(str(value)).hex
                except ValueError:
                    return str(value)
            else:
                return value.hex

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        else:
            if not isinstance(value, uuid.UUID):
                try:
                    return uuid.UUID(str(value))
                except ValueError:
                    return str(value)
            return value


class User(Base):
    __tablename__ = "users"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False)  # fan, volunteer, operator, organizer, admin
    preferred_language = Column(String, default="en")
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)


class Stadium(Base):
    __tablename__ = "stadiums"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    city = Column(String, nullable=False)
    country = Column(String, nullable=False)
    capacity = Column(Integer, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)

    events = relationship("Event", back_populates="stadium", cascade="all, delete-orphan")


class Event(Base):
    __tablename__ = "events"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    stadium_id = Column(GUID, ForeignKey("stadiums.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    date = Column(DateTime, nullable=False)
    attendance = Column(Integer, nullable=True)

    # Compatibility fields
    description = Column(String, nullable=True)
    status = Column(String, nullable=False, default="active")
    starts_at = Column(DateTime, nullable=False)
    ends_at = Column(DateTime, nullable=False)

    stadium = relationship("Stadium", back_populates="events")
    incidents = relationship("Incident", back_populates="event", cascade="all, delete-orphan")
    zones = relationship("Zone", back_populates="event", cascade="all, delete-orphan")
    staffing = relationship("ZoneStaffing", back_populates="event", cascade="all, delete-orphan")


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    event_id = Column(GUID, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    zone_id = Column(GUID, ForeignKey("zones.id", ondelete="CASCADE"), nullable=True)
    type = Column(String, nullable=False)
    severity = Column(String, nullable=False)
    status = Column(String, nullable=False)
    location = Column(String, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    resolved_at = Column(DateTime, nullable=True)

    # Compatibility fields
    description = Column(String, nullable=True)
    responder_name = Column(String, nullable=True)

    event = relationship("Event", back_populates="incidents")


class Volunteer(Base):
    __tablename__ = "volunteers"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    language = Column(String, nullable=False)
    skill = Column(String, nullable=False)
    availability = Column(String, nullable=False)
    assigned_zone = Column(String, nullable=True)


class AgentDecision(Base):
    __tablename__ = "agent_decisions"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    agent_name = Column(String, nullable=False)
    recommendation = Column(String, nullable=False)
    confidence = Column(Integer, nullable=False)
    status = Column(String, nullable=False, default="PENDING_APPROVAL")
    created_at = Column(DateTime, default=utc_now)

    # Compatibility fields
    expected_impact = Column(String, nullable=True)
    reason = Column(String, nullable=True)
    target = Column(String, nullable=True)

    executions = relationship(
        "ActionExecution", back_populates="decision", cascade="all, delete-orphan"
    )


class ActionExecution(Base):
    __tablename__ = "action_executions"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    decision_id = Column(GUID, ForeignKey("agent_decisions.id", ondelete="CASCADE"), nullable=False)
    action = Column(String, nullable=False)
    result = Column(String, nullable=False)
    execution_time = Column(DateTime, default=utc_now)

    # Compatibility fields
    operator = Column(String, nullable=True)
    impact = Column(String, nullable=True)

    decision = relationship("AgentDecision", back_populates="executions")


class HistoricalRecord(Base):
    __tablename__ = "historical_records"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    event_name = Column(String, nullable=False)
    action = Column(String, nullable=False)
    outcome = Column(String, nullable=False)
    effectiveness = Column(Integer, nullable=False)
    historical_success_rate = Column(String, nullable=True)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    user = Column(String, nullable=False)
    action = Column(String, nullable=False)
    timestamp = Column(DateTime, default=utc_now)
    metadata_json = Column(JSON, default=dict)


# --- Core Simulation Models ---


class Zone(Base):
    __tablename__ = "zones"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    event_id = Column(GUID, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    zone_type = Column(String, nullable=False)
    capacity = Column(Integer, nullable=False)
    parent_zone_id = Column(GUID, ForeignKey("zones.id", ondelete="SET NULL"), nullable=True)
    status = Column(String, nullable=False, default="open")

    event = relationship("Event", back_populates="zones")
    measurements = relationship(
        "CrowdMeasurement", back_populates="zone", cascade="all, delete-orphan"
    )
    predictions = relationship("Prediction", back_populates="zone", cascade="all, delete-orphan")
    risk_score = relationship(
        "RiskScore", uselist=False, back_populates="zone", cascade="all, delete-orphan"
    )
    alerts = relationship("Alert", back_populates="zone", cascade="all, delete-orphan")
    feedback = relationship("Feedback", back_populates="zone", cascade="all, delete-orphan")
    cameras = relationship("Camera", back_populates="zone", cascade="all, delete-orphan")
    staffing = relationship("ZoneStaffing", back_populates="zone", cascade="all, delete-orphan")


class CrowdMeasurement(Base):
    __tablename__ = "crowd_measurements"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    zone_id = Column(GUID, ForeignKey("zones.id", ondelete="CASCADE"), nullable=False)
    measured_at = Column(DateTime, nullable=False)
    density_count = Column(Integer, nullable=False)
    flow_rate_per_minute = Column(Integer, nullable=False)
    queue_length = Column(Integer, nullable=False)
    source_type = Column(String, nullable=False)
    confidence = Column(Float, nullable=False)
    ingested_at = Column(DateTime, default=utc_now)

    zone = relationship("Zone", back_populates="measurements")


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    zone_id = Column(GUID, ForeignKey("zones.id", ondelete="CASCADE"), nullable=False)
    horizon_minutes = Column(Integer, nullable=False)
    predicted_density = Column(Integer, nullable=False)
    predicted_queue_length = Column(Integer, nullable=False)
    predicted_flow_rate = Column(Integer, nullable=False)
    confidence_interval_low = Column(Float, nullable=False)
    confidence_interval_high = Column(Float, nullable=False)
    generated_at = Column(DateTime, nullable=False)
    model_version = Column(String, nullable=False)

    zone = relationship("Zone", back_populates="predictions")


class RiskScore(Base):
    __tablename__ = "risk_scores"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    zone_id = Column(GUID, ForeignKey("zones.id", ondelete="CASCADE"), unique=True, nullable=False)
    risk_score = Column(Integer, nullable=False)
    severity = Column(String, nullable=False)
    drivers_json = Column(JSON, nullable=False, default=list)
    prediction_horizon_minutes = Column(Integer, nullable=False)
    generated_at = Column(DateTime, nullable=False)

    zone = relationship("Zone", back_populates="risk_score")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    zone_id = Column(GUID, ForeignKey("zones.id", ondelete="CASCADE"), nullable=False)
    severity = Column(String, nullable=False)
    status = Column(String, nullable=False, default="open")
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    timestamp = Column(DateTime, nullable=False)
    assignee = Column(String, nullable=True)
    notes = Column(String, nullable=True)

    zone = relationship("Zone", back_populates="alerts")
    guidances = relationship(
        "GuidanceMessage", back_populates="alert", cascade="all, delete-orphan"
    )


class GuidanceMessage(Base):
    __tablename__ = "guidance_messages"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    alert_id = Column(GUID, ForeignKey("alerts.id", ondelete="CASCADE"), nullable=False)
    audience_role = Column(String, nullable=False)
    severity = Column(String, nullable=False)
    headline = Column(String, nullable=False)
    actions_json = Column(JSON, nullable=False, default=list)
    expires_at = Column(DateTime, nullable=False)
    payload_json = Column(JSON, nullable=False, default=dict)
    prompt_version = Column(String, nullable=False)
    schema_version = Column(String, nullable=False)
    model_provider = Column(String, nullable=False)
    model_name = Column(String, nullable=False)
    input_context_hash = Column(String, nullable=False)
    status = Column(String, nullable=False, default="PENDING_APPROVAL")

    alert = relationship("Alert", back_populates="guidances")


class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    zone_id = Column(GUID, ForeignKey("zones.id", ondelete="CASCADE"), nullable=False)
    rating = Column(Integer, nullable=False)
    comment = Column(String(500), nullable=False)
    created_at = Column(DateTime, default=utc_now)

    zone = relationship("Zone", back_populates="feedback")


class Camera(Base):
    __tablename__ = "cameras"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    zone_id = Column(GUID, ForeignKey("zones.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    fps = Column(Integer, nullable=False, default=30)
    accuracy = Column(Float, nullable=False, default=0.95)
    status = Column(String, nullable=False, default="active")

    zone = relationship("Zone", back_populates="cameras")


class ZoneStaffing(Base):
    __tablename__ = "zone_staffing"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    event_id = Column(GUID, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    zone_id = Column(GUID, ForeignKey("zones.id", ondelete="CASCADE"), nullable=False)
    count = Column(Integer, nullable=False, default=0)

    event = relationship("Event", back_populates="staffing")
    zone = relationship("Zone", back_populates="staffing")


class Intervention(Base):
    __tablename__ = "interventions"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    event_id = Column(GUID, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    zone_id = Column(GUID, ForeignKey("zones.id", ondelete="CASCADE"), nullable=False)
    type = Column(String, nullable=False)
    description = Column(String, nullable=False)
    trigger_tick = Column(Integer, nullable=False)
    pre_density = Column(Integer, nullable=False)
    pre_risk = Column(String, nullable=False)
    post_density = Column(Integer, nullable=True)
    post_risk = Column(String, nullable=True)
    timestamp = Column(DateTime, default=utc_now)
