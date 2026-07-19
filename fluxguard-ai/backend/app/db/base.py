# Import all models so that Base has them registered before alembic autogenerates migrations
from app.db.database import Base  # noqa
from app.db.models import (  # noqa
    User,
    Stadium,
    Event,
    Incident,
    Volunteer,
    AgentDecision,
    ActionExecution,
    HistoricalRecord,
    AuditLog,
    Zone,
    CrowdMeasurement,
    Prediction,
    RiskScore,
    Alert,
    GuidanceMessage,
    Feedback,
    Camera,
    ZoneStaffing,
    Intervention,
)
