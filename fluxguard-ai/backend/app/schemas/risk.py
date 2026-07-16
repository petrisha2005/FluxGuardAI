from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class RiskScoreResponse(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )
    zone_id: UUID
    risk_score: int
    severity: str
    drivers: list[str]
    prediction_horizon_minutes: int
    generated_at: datetime
