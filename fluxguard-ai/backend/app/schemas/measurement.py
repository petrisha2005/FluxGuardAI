from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator
from pydantic.alias_generators import to_camel


class MeasurementCreate(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )
    zone_id: UUID
    measured_at: datetime
    density_count: int = Field(ge=0)
    flow_rate_per_minute: int = Field(ge=0)
    queue_length: int = Field(ge=0)
    source_type: str
    confidence: float = Field(ge=0.0, le=1.0)

    @field_validator("source_type")
    @classmethod
    def validate_source_type(cls, value: str) -> str:
        allowed = {"simulator", "camera", "sensor", "manual", "ticket_scan"}
        if value not in allowed:
            raise ValueError(f"sourceType must be one of {allowed}")
        return value


class MeasurementResponse(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )
    id: UUID
    zone_id: UUID
    measured_at: datetime
    density_count: int
    flow_rate_per_minute: int
    queue_length: int
    source_type: str
    confidence: float
    ingested_at: datetime
