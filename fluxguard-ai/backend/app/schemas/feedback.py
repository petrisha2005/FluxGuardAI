from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class FeedbackCreate(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )
    zone_id: UUID
    rating: int = Field(ge=1, le=5)
    comment: str = Field(max_length=500)


class FeedbackResponse(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )
    id: UUID
    zone_id: UUID
    rating: int
    comment: str
    created_at: datetime
