import httpx
import pytest

from app.core import database
from app.main import app

SEED_EVENT_ID = "e0000000-0000-0000-0000-000000000000"
SEED_ZONE_ID = "00000000-0000-0000-0000-000000000001"
FAKE_EVENT_ID = "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"
FAKE_ZONE_ID = "00000000-0000-0000-0000-000000000099"


@pytest.fixture(autouse=True)
def cleanup_db():
    database.clear_database()
    yield
    database.clear_database()


@pytest.mark.asyncio
async def test_create_measurement_success() -> None:
    transport = httpx.ASGITransport(app=app)
    payload = {
        "zoneId": SEED_ZONE_ID,
        "measuredAt": "2026-07-09T10:00:00Z",
        "densityCount": 1200,
        "flowRatePerMinute": 340,
        "queueLength": 180,
        "sourceType": "simulator",
        "confidence": 0.92,
    }

    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.post(
            f"/api/v1/events/{SEED_EVENT_ID}/measurements",
            json=payload,
        )

    assert response.status_code == 201
    json_data = response.json()
    assert "data" in json_data
    assert "meta" in json_data

    data = json_data["data"]
    assert data["zoneId"] == SEED_ZONE_ID
    assert data["densityCount"] == 1200
    assert data["flowRatePerMinute"] == 340
    assert data["queueLength"] == 180
    assert data["sourceType"] == "simulator"
    assert data["confidence"] == 0.92
    assert "ingestedAt" in data
    assert "id" in data

    # Verify memory database state
    stored_measurements = database.get_all_measurements()
    assert len(stored_measurements) == 1
    assert str(stored_measurements[0]["id"]) == data["id"]
    assert stored_measurements[0]["density_count"] == 1200


@pytest.mark.asyncio
async def test_create_measurement_event_not_found() -> None:
    transport = httpx.ASGITransport(app=app)
    payload = {
        "zoneId": SEED_ZONE_ID,
        "measuredAt": "2026-07-09T10:00:00Z",
        "densityCount": 1200,
        "flowRatePerMinute": 340,
        "queueLength": 180,
        "sourceType": "simulator",
        "confidence": 0.92,
    }

    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.post(
            f"/api/v1/events/{FAKE_EVENT_ID}/measurements",
            json=payload,
        )

    assert response.status_code == 404
    json_data = response.json()
    assert json_data["detail"]["error"]["code"] == "EVENT_NOT_FOUND"


@pytest.mark.asyncio
async def test_create_measurement_invalid_zone() -> None:
    transport = httpx.ASGITransport(app=app)
    # Zone ID does not belong to the event (uses a fake zone UUID)
    payload = {
        "zoneId": FAKE_ZONE_ID,
        "measuredAt": "2026-07-09T10:00:00Z",
        "densityCount": 1200,
        "flowRatePerMinute": 340,
        "queueLength": 180,
        "sourceType": "simulator",
        "confidence": 0.92,
    }

    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.post(
            f"/api/v1/events/{SEED_EVENT_ID}/measurements",
            json=payload,
        )

    assert response.status_code == 400
    json_data = response.json()
    assert json_data["detail"]["error"]["code"] == "INVALID_ZONE"


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "invalid_fields",
    [
        {"densityCount": -5},
        {"flowRatePerMinute": -1},
        {"queueLength": -10},
        {"confidence": 1.05},
        {"confidence": -0.1},
        {"sourceType": "unknown_source"},
    ],
)
async def test_create_measurement_validation_failures(invalid_fields: dict) -> None:
    transport = httpx.ASGITransport(app=app)
    base_payload = {
        "zoneId": SEED_ZONE_ID,
        "measuredAt": "2026-07-09T10:00:00Z",
        "densityCount": 1200,
        "flowRatePerMinute": 340,
        "queueLength": 180,
        "sourceType": "simulator",
        "confidence": 0.92,
    }
    base_payload.update(invalid_fields)

    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.post(
            f"/api/v1/events/{SEED_EVENT_ID}/measurements",
            json=base_payload,
        )

    assert response.status_code == 422
