from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class EventBase(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )
    name: str
    description: str | None = None
    status: str
    starts_at: datetime
    ends_at: datetime
    venue_id: UUID | None = None


class EventResponse(EventBase):
    id: UUID
