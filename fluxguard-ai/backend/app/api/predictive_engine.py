from uuid import UUID

from fastapi import APIRouter, Query
from pydantic import BaseModel

from app.services.historical_intelligence import find_similar_historical_events
from app.services.predictive_engine import generate_five_horizon_predictions
from app.services.scenario_simulator import simulate_scenario

router = APIRouter(tags=["predictive_intelligence"])


class ScenarioRequest(BaseModel):
    scenarioType: str
    affectedZone: str | None = None
    severity: str = "medium"


@router.get("/api/predictions/current")
@router.get("/api/v1/predictions/current")
def get_current_predictions(eventId: UUID | None = Query(None)):
    """Fetch current density risk levels and staffing indicators."""
    event_id = eventId or UUID("e0000000-0000-0000-0000-000000000000")
    all_predictions = generate_five_horizon_predictions(event_id)
    current_preds = [p for p in all_predictions if p["horizon_minutes"] == 0]
    return {"status": "success", "data": current_preds}


@router.get("/api/predictions/timeline")
@router.get("/api/v1/predictions/timeline")
def get_predictions_timeline(eventId: UUID | None = Query(None)):
    """Fetch predictive stats over the five horizons (0, 10, 20, 40, 60 minutes)."""
    event_id = eventId or UUID("e0000000-0000-0000-0000-000000000000")
    timeline_preds = generate_five_horizon_predictions(event_id)
    return {"status": "success", "data": timeline_preds}


@router.post("/api/scenarios/simulate")
@router.post("/api/v1/scenarios/simulate")
def run_scenario_simulation(payload: ScenarioRequest):
    """Simulates a decision override scenario, returning impact analysis."""
    result = simulate_scenario(payload.scenarioType, payload.affectedZone, payload.severity)
    return {"status": "success", "data": result}


@router.get("/api/history/similar-events")
@router.get("/api/v1/history/similar-events")
def get_similar_historical_events(weather: str | None = Query(None)):
    """Fetch past matches configurations and successful outcomes."""
    events = find_similar_historical_events(weather_query=weather)
    return {"status": "success", "data": events}
