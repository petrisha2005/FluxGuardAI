import pytest

from app.services.copilot import generate_offline_response

pytestmark = pytest.mark.asyncio


async def test_list_stadiums(async_client) -> None:
    response = await async_client.get("/api/stadiums")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["status"] == "success"
    assert len(json_data["data"]) >= 4
    assert json_data["data"][0]["name"] == "MetLife Stadium"


async def test_register_stadium(async_client) -> None:
    payload = {
        "id": "stadium_005",
        "name": "Lusail Stadium",
        "city": "Doha",
        "country": "Qatar",
        "capacity": 80000,
        "currentAttendance": 0,
        "riskLevel": "low",
        "predictionStatus": "Registration baseline",
    }
    response = await async_client.post("/api/stadiums", json=payload)
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["status"] == "success"
    assert json_data["data"]["name"] == "Lusail Stadium"


async def test_get_city_status(async_client) -> None:
    response = await async_client.get("/api/city/status")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["status"] == "success"
    assert "transportation" in json_data["data"]
    assert "weather" in json_data["data"]
    assert len(json_data["data"]["fanZones"]) > 0


async def test_run_city_query(async_client) -> None:
    payload = {"query": "Match starts in 45 minutes"}
    response = await async_client.post("/api/city/query", json=payload)
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["status"] == "success"
    assert "T-45 minutes" in json_data["data"]["predictedTimeline"]
    assert len(json_data["data"]["predictions"]) > 0


async def test_dispatch_emergency_incident(async_client) -> None:
    payload = {"incidentDescription": "Medical emergency near Gate C"}
    response = await async_client.post("/api/emergency/dispatch", json=payload)
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["status"] == "success"
    assert json_data["data"]["priority"] == "HIGH"
    assert "Ambulance Unit 3" in json_data["data"]["assignedResources"]["medical"]


async def test_get_volunteer_recommendation(async_client) -> None:
    response = await async_client.get(
        "/api/volunteers/recommend?needDescription=Spanish speaking volunteers near Fan Zone A"
    )
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["status"] == "success"
    assert json_data["data"]["availableCount"] > 0
    assert "Spanish" in json_data["data"]["assignedVolunteers"][0]["languages"]


async def test_get_global_risk_indices(async_client) -> None:
    response = await async_client.get("/api/risk/global")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["status"] == "success"
    assert json_data["data"]["level3CityRisk"]["overallRisk"] == "HIGH"


async def test_copilot_global_commands() -> None:
    # 1. Test global stadium status query
    res1 = generate_offline_response("Show global stadium status", [], [])
    assert "Global Command Network Status" in res1["response"]
    assert "Critical: 2" in res1["response"]

    # 2. Test which stadium needs attention query
    res2 = generate_offline_response("Which stadium needs attention?", [], [])
    assert "MetLife Stadium" in res2["response"]
    assert "Arrival surge" in res2["response"]

    # 3. Test coordinate response query
    res3 = generate_offline_response("Coordinate response for medical incident", [], [])
    assert "Emergency Resource Coordination Response" in res3["response"]
    assert "ambulance" in res3["response"]
