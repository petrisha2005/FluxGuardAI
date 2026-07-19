import pytest

SEED_EVENT_ID = "e0000000-0000-0000-0000-000000000000"
pytestmark = pytest.mark.asyncio


async def test_get_predictions_current(async_client) -> None:
    response = await async_client.get(f"/api/predictions/current?eventId={SEED_EVENT_ID}")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["status"] == "success"
    assert len(json_data["data"]) > 0
    assert "zone_name" in json_data["data"][0]
    assert json_data["data"][0]["horizon_minutes"] == 0


async def test_get_predictions_timeline(async_client) -> None:
    response = await async_client.get(f"/api/predictions/timeline?eventId={SEED_EVENT_ID}")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["status"] == "success"
    assert len(json_data["data"]) > 0
    # verify horizons elements exist (0, 10, 20, 40, 60)
    horizons = [p["horizon_minutes"] for p in json_data["data"]]
    assert 10 in horizons
    assert 60 in horizons


async def test_run_scenario_simulation(async_client) -> None:
    payload = {
        "scenarioType": "gate_closure",
        "affectedZone": "Gate C",
        "severity": "high",
    }
    response = await async_client.post("/api/scenarios/simulate", json=payload)
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["status"] == "success"
    assert "predictedImpact" in json_data["data"]
    assert "recoveryTime" in json_data["data"]
    assert len(json_data["data"]["recommendations"]) > 0


async def test_get_similar_historical_events(async_client) -> None:
    response = await async_client.get("/api/history/similar-events?weather=Rainy")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["status"] == "success"
    assert len(json_data["data"]) > 0
    assert "event_type" in json_data["data"][0]
    assert "Rainy" in json_data["data"][0]["weather"]
