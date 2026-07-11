from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator
from pydantic.alias_generators import to_camel


class GuidanceGenerateRequest(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )
    alert_id: UUID
    audience_role: str
    language: str = "en"

    @field_validator("audience_role")
    @classmethod
    def validate_audience_role(cls, value: str) -> str:
        allowed = {"fan", "volunteer", "operator", "organizer"}
        if value not in allowed:
            raise ValueError(f"audienceRole must be one of {allowed}")
        return value


class FanPayload(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )
    headline: str
    short_message: str
    recommended_route: str
    avoid_zones: list[str]
    estimated_delay: str
    accessibility_note: str
    expires_at: datetime


class VolunteerPayload(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )
    headline: str
    priority: str
    actions: list[str]
    location: str
    escalation_trigger: str
    do_not_say: str
    expires_at: datetime


class OperatorPayload(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )
    incident_summary: str
    risk_drivers: list[str]
    recommended_actions: list[str]
    affected_zones: list[str]
    confidence: float
    monitoring_plan: str
    escalation_options: list[str]


class OrganizerPayload(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )
    event_impact_summary: str
    trend_explanation: str
    recommended_planning_changes: list[str]
    metrics_to_review: list[str]


class GuidanceResponse(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )
    guidance_id: UUID
    audience_role: str
    severity: str
    headline: str
    actions: list[str] = Field(default_factory=list)
    expires_at: datetime
    payload: Any
    prompt_version: str
    schema_version: str
    model_provider: str
    model_name: str
    input_context_hash: str
    status: str = "PENDING_APPROVAL"
