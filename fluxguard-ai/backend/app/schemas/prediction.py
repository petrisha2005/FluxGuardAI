from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class PredictionResponse(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )
    id: UUID
    zone_id: UUID
    horizon_minutes: int
    predicted_density: int
    predicted_queue_length: int
    predicted_flow_rate: int
    confidence_interval_low: float
    confidence_interval_high: float
    generated_at: datetime
    model_version: str
