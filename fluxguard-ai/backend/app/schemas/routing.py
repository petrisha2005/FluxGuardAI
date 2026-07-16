from uuid import UUID

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class RoutingRecommendationResponse(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )
    source_zone_id: UUID
    target_zone_id: UUID
    reason: str
    delay_reduction_minutes: int
    confidence: float
    relief_time_minutes: int
