import httpx
import pytest

from app.core import database
from app.main import app

SEED_EVENT_ID = "e0000000-0000-0000-0000-000000000000"
SEED_ZONE_ID = "00000000-0000-0000-0000-000000000001"
FAKE_EVENT_ID = "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"


@pytest.fixture(autouse=True)
def cleanup_db():
    database.clear_database()
    yield
    database.clear_database()


@pytest.mark.asyncio
async def test_get_predictions_empty() -> None:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get(f"/api/v1/events/{SEED_EVENT_ID}/predictions")

    assert response.status_code == 200
    json_data = response.json()
    assert len(json_data["data"]) == 0


@pytest.mark.asyncio
async def test_get_predictions_event_not_found() -> None:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get(f"/api/v1/events/{FAKE_EVENT_ID}/predictions")

    assert response.status_code == 404
    json_data = response.json()
    assert json_data["detail"]["error"]["code"] == "EVENT_NOT_FOUND"


@pytest.mark.asyncio
async def test_run_predictions_cycle() -> None:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        # Run prediction cycle
        response_run = await client.post(f"/api/v1/events/{SEED_EVENT_ID}/predictions/run")
        assert response_run.status_code == 202
        json_data_run = response_run.json()

        # 4 zones * 3 horizons = 12 predictions generated
        assert len(json_data_run["data"]) == 12
        p = json_data_run["data"][0]
        assert "horizonMinutes" in p
        assert p["modelVersion"] == "prophet-mvp-v1.0-enriched"

        # Query back predictions
        response_get = await client.get(f"/api/v1/events/{SEED_EVENT_ID}/predictions")
        assert response_get.status_code == 200
        json_data_get = response_get.json()
        assert len(json_data_get["data"]) == 12

        # Query back predictions with filters
        response_filtered = await client.get(
            f"/api/v1/events/{SEED_EVENT_ID}/predictions",
            params={"zoneId": SEED_ZONE_ID, "horizonMinutes": 30},
        )
        assert response_filtered.status_code == 200
        json_data_filtered = response_filtered.json()
        assert len(json_data_filtered["data"]) == 1
        assert json_data_filtered["data"][0]["zoneId"] == SEED_ZONE_ID
        assert json_data_filtered["data"][0]["horizonMinutes"] == 30
