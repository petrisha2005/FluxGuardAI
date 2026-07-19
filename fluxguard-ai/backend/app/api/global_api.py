from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

from app.auth.dependencies import require_role
from app.auth.roles import UserRole
from app.services.city_intelligence import get_city_operations_status, query_city_impact_prediction
from app.services.emergency_coordinator import dispatch_resources
from app.services.predictive_engine import calculate_global_risk_intelligence
from app.services.stadium_network import add_stadium, get_all_stadiums
from app.services.volunteer_manager import recommend_volunteers_for_need

router = APIRouter(tags=["global_operations"])


class StadiumCreate(BaseModel):
    id: str | None = None
    name: str
    city: str
    country: str
    capacity: int
    currentAttendance: int = 0
    riskLevel: str = "low"
    predictionStatus: str = "Standard operational baseline"


class CityQueryRequest(BaseModel):
    query: str


class EmergencyDispatchRequest(BaseModel):
    incidentDescription: str


@router.get("/api/stadiums")
@router.get("/api/v1/stadiums")
def list_stadiums():
    """Retrieve all monitored stadiums across the worldwide enterprise network."""
    return {"status": "success", "data": get_all_stadiums()}


@router.post("/api/stadiums")
@router.post("/api/v1/stadiums")
def register_stadium(payload: StadiumCreate):
    """Registers a new stadium in the operations command network."""
    res = add_stadium(payload.model_dump())
    return {"status": "success", "data": res}


@router.get("/api/city/status")
@router.get("/api/v1/city/status")
def get_city_status():
    """Fetches real-time status of external systems like transportation and fan zones."""
    return {"status": "success", "data": get_city_operations_status()}


@router.post("/api/city/query")
@router.post("/api/v1/city/query")
def run_city_query(payload: CityQueryRequest):
    """Predicts city impact dynamics for a natural language timeline status query."""
    res = query_city_impact_prediction(payload.query)
    return {"status": "success", "data": res}


@router.post(
    "/api/emergency/dispatch",
    dependencies=[Depends(require_role(UserRole.SECURITY_SUPERVISOR, UserRole.SUPER_ADMIN))],
)
@router.post(
    "/api/v1/emergency/dispatch",
    dependencies=[Depends(require_role(UserRole.SECURITY_SUPERVISOR, UserRole.SUPER_ADMIN))],
)
def dispatch_emergency_incident(payload: EmergencyDispatchRequest):
    """Trigger emergency resource dispatches for high-priority safety warnings."""
    res = dispatch_resources(payload.incidentDescription)
    return {"status": "success", "data": res}


@router.get(
    "/api/volunteers/recommend",
    dependencies=[Depends(require_role(UserRole.VOLUNTEER_COORDINATOR, UserRole.SUPER_ADMIN))],
)
@router.get(
    "/api/v1/volunteers/recommend",
    dependencies=[Depends(require_role(UserRole.VOLUNTEER_COORDINATOR, UserRole.SUPER_ADMIN))],
)
def get_volunteer_recommendation(needDescription: str = Query(...)):
    """Matches and assigns volunteer resources based on language and skill requests."""
    res = recommend_volunteers_for_need(needDescription)
    return {"status": "success", "data": res}


@router.get("/api/risk/global")
@router.get("/api/v1/risk/global")
def get_global_risk_indices():
    """Fetch multi-level risk prediction metrics (Zone, Stadium, and City wide)."""
    res = calculate_global_risk_intelligence()
    return {"status": "success", "data": res}
