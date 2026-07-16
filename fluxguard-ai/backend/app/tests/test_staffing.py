from datetime import UTC, datetime
from uuid import UUID, uuid4

import httpx
import pytest

from app.core import database
from app.main import app

SEED_EVENT_ID = "e0000000-0000-0000-0000-000000000000"
ZONE_1 = "00000000-0000-0000-0000-000000000001"  # North Gate
ZONE_3 = "00000000-0000-0000-0000-000000000003"  # Gate C


@pytest.fixture(autouse=True)
def setup_mock_staffing():
    database.clear_database()

    # Seed zone staffing back to default state
    database.update_zone_staffing(UUID(SEED_EVENT_ID), UUID(ZONE_1), 20)
    database.update_zone_staffing(UUID(SEED_EVENT_ID), UUID(ZONE_3), 25)

    # Set Gate C to CRITICAL risk level to trigger staffing optimization
    database.update_risk_score(
        UUID(ZONE_3),
        {
            "id": uuid4(),
            "zone_id": UUID(ZONE_3),
            "severity": "critical",
            "risk_score": 95,
            "drivers": ["high density"],
            "prediction_horizon_minutes": 20,
            "generated_at": datetime.now(UTC),
        },
    )


@pytest.mark.asyncio
async def test_get_staffing_recommendations() -> None:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        headers = {"Authorization": "Bearer mock-operator"}
        response = await client.get(
            f"/api/v1/events/{SEED_EVENT_ID}/staffing",
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()["data"]

        current = data["currentStaff"]
        recommended = data["recommendedStaff"]
        suggestions = data["suggestions"]

        # Conserved sum check (stewards total = 70)
        assert sum(current.values()) == 70
        assert sum(recommended.values()) == 70

        # Optimization weight check: critical risk zone (Gate C) should have highest recommendations!
        assert recommended[ZONE_3] > recommended[ZONE_1]
        assert len(suggestions) > 0
        assert any(s["toZoneId"] == ZONE_3 for s in suggestions)


@pytest.mark.asyncio
async def test_execute_redeploy() -> None:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        headers = {"Authorization": "Bearer mock-operator"}
        payload = {
            "fromZoneId": ZONE_1,
            "toZoneId": ZONE_3,
            "count": 5,
        }
        response = await client.post(
            f"/api/v1/events/{SEED_EVENT_ID}/staffing/redeploy",
            json=payload,
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()["data"]
        assert data["status"] == "SUCCESS"

        updated = data["currentStaff"]
        assert updated[ZONE_1] == 15  # 20 - 5
        assert updated[ZONE_3] == 30  # 25 + 5


@pytest.mark.asyncio
async def test_get_staffing_predictive_alerts() -> None:
    # Add a future prediction for ZONE_3 forecasting a crowd surge (85% density in 20 minutes)
    database.add_prediction({
        "id": uuid4(),
        "zone_id": UUID(ZONE_3),
        "horizon_minutes": 20,
        "predicted_density": 85,
        "predicted_queue_length": 150,
        "predicted_flow_rate": 12.0,
        "confidence_interval_low": 75,
        "confidence_interval_high": 95,
        "generated_at": datetime.now(UTC),
        "model_version": "prophet-test",
    })

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        headers = {"Authorization": "Bearer mock-operator"}
        response = await client.get(
            f"/api/v1/events/{SEED_EVENT_ID}/staffing",
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()["data"]
        
        assert "alerts" in data
        assert len(data["alerts"]) > 0
        assert any("Upcoming Crowd Surge" in a and "Gate C" in a for a in data["alerts"])
