from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, field_validator
from pydantic.alias_generators import to_camel


class AlertResponse(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )
    id: UUID
    zone_id: UUID
    severity: str
    status: str
    title: str
    description: str
    timestamp: datetime
    assignee: str | None = None
    notes: str | None = None


class AlertUpdate(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )
    status: str
    assignee: str | None = None
    notes: str | None = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str) -> str:
        allowed = {"unacknowledged", "acknowledged", "resolved"}
        if value not in allowed:
            raise ValueError(f"status must be one of {allowed}")
        return value
