from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class StadiumBase(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )
    id: str
    name: str
    city: str
    country: str
    capacity: int
    current_attendance: int
    risk_level: str
    prediction_status: str


class EventBase(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )
    match_name: str
    date: str
    attendance: int
    stadium_id: str


class IncidentBase(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )
    type: str
    location: str
    severity: str
    response_actions: list[str]


class ResourceBase(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )
    volunteers_count: int
    medical_units: int
    security_units: int
