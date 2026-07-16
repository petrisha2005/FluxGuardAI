from uuid import UUID

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class ZoneResponse(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )
    id: UUID
    event_id: UUID
    name: str
    type: str
    capacity: int
    parent_zone_id: UUID | None = None
    status: str
