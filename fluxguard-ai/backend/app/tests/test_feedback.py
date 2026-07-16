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
async def test_submit_feedback_success() -> None:
    transport = httpx.ASGITransport(app=app)
    payload = {
        "zoneId": SEED_ZONE_ID,
        "rating": 4,
        "comment": "North Gate flows smoothly, but queue is long.",
    }

    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.post(
            f"/api/v1/events/{SEED_EVENT_ID}/feedback",
            json=payload,
        )

    assert response.status_code == 201
    json_data = response.json()
    assert "data" in json_data
    assert "meta" in json_data

    data = json_data["data"]
    assert data["zoneId"] == SEED_ZONE_ID
    assert data["rating"] == 4
    assert data["comment"] == "North Gate flows smoothly, but queue is long."
    assert "id" in data
    assert "createdAt" in data

    # Verify memory database state
    stored_feedback = database.get_all_feedback()
    assert len(stored_feedback) == 1
    assert str(stored_feedback[0]["id"]) == data["id"]
    assert stored_feedback[0]["rating"] == 4


@pytest.mark.asyncio
async def test_submit_feedback_event_not_found() -> None:
    transport = httpx.ASGITransport(app=app)
    payload = {
        "zoneId": SEED_ZONE_ID,
        "rating": 3,
        "comment": "Okay.",
    }

    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.post(
            f"/api/v1/events/{FAKE_EVENT_ID}/feedback",
            json=payload,
        )

    assert response.status_code == 404
    json_data = response.json()
    assert json_data["detail"]["error"]["code"] == "EVENT_NOT_FOUND"


@pytest.mark.asyncio
async def test_submit_feedback_invalid_zone() -> None:
    transport = httpx.ASGITransport(app=app)
    payload = {
        "zoneId": FAKE_ZONE_ID,
        "rating": 3,
        "comment": "Okay.",
    }

    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.post(
            f"/api/v1/events/{SEED_EVENT_ID}/feedback",
            json=payload,
        )

    assert response.status_code == 400
    json_data = response.json()
    assert json_data["detail"]["error"]["code"] == "INVALID_ZONE"


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "invalid_payload",
    [
        {"zoneId": SEED_ZONE_ID, "rating": 6, "comment": "Too high rating"},
        {"zoneId": SEED_ZONE_ID, "rating": 0, "comment": "Too low rating"},
        {"zoneId": SEED_ZONE_ID, "rating": 3, "comment": "a" * 501},  # Comment too long
    ],
)
async def test_submit_feedback_validation_failures(invalid_payload: dict) -> None:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.post(
            f"/api/v1/events/{SEED_EVENT_ID}/feedback",
            json=invalid_payload,
        )

    assert response.status_code == 422
