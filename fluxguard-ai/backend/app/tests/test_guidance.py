from datetime import UTC, datetime
from uuid import uuid4

import httpx
import pytest

from app.core import database
from app.main import app

SEED_EVENT_ID = "e0000000-0000-0000-0000-000000000000"
SEED_ZONE_ID = "00000000-0000-0000-0000-000000000001"
FAKE_EVENT_ID = "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"
FAKE_ALERT_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"


@pytest.fixture(autouse=True)
def setup_mock_alert():
    database.clear_database()
    # Insert an alert to use in tests
    alert_record = {
        "id": uuid4(),
        "zone_id": database.UUID(SEED_ZONE_ID),
        "severity": "high",
        "status": "unacknowledged",
        "title": "North Gate congestion",
        "description": "High accumulation at North Gate",
        "timestamp": datetime.now(UTC),
        "assignee": None,
        "notes": None,
    }
    database.add_alert(alert_record)
    return alert_record


@pytest.mark.asyncio
async def test_generate_guidance_all_roles(setup_mock_alert) -> None:
    alert_id = setup_mock_alert["id"]
    transport = httpx.ASGITransport(app=app)
    roles = ["fan", "volunteer", "operator", "organizer"]

    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        for role in roles:
            payload = {
                "alertId": str(alert_id),
                "audienceRole": role,
                "language": "en",
            }
            response = await client.post(
                f"/api/v1/events/{SEED_EVENT_ID}/guidance/generate",
                json=payload,
            )
            assert response.status_code == 201
            json_data = response.json()
            data = json_data["data"]
            assert data["audienceRole"] == role
            assert data["severity"] == "high"
            assert "expiresAt" in data

            payload_data = data["payload"]
            assert (
                "headline" in payload_data
                or "incidentSummary" in payload_data
                or "eventImpactSummary" in payload_data
            )


@pytest.mark.asyncio
async def test_generate_guidance_fallback_invalid_role(setup_mock_alert) -> None:
    alert_id = setup_mock_alert["id"]
    transport = httpx.ASGITransport(app=app)

    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        # Invalid role in JSON payload should trigger validation error (422)
        # since Pydantic schema validates it
        payload = {
            "alertId": str(alert_id),
            "audienceRole": "invalid-role",
            "language": "en",
        }
        response = await client.post(
            f"/api/v1/events/{SEED_EVENT_ID}/guidance/generate",
            json=payload,
        )
        assert response.status_code == 422


@pytest.mark.asyncio
async def test_generate_guidance_alert_not_found() -> None:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        payload = {
            "alertId": FAKE_ALERT_ID,
            "audienceRole": "operator",
            "language": "en",
        }
        response = await client.post(
            f"/api/v1/events/{SEED_EVENT_ID}/guidance/generate",
            json=payload,
        )
        assert response.status_code == 404
        assert response.json()["detail"]["error"]["code"] == "ALERT_NOT_FOUND"


@pytest.mark.asyncio
async def test_generate_guidance_event_not_found(setup_mock_alert) -> None:
    alert_id = setup_mock_alert["id"]
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        payload = {
            "alertId": str(alert_id),
            "audienceRole": "operator",
            "language": "en",
        }
        response = await client.post(
            f"/api/v1/events/{FAKE_EVENT_ID}/guidance/generate",
            json=payload,
        )
        assert response.status_code == 404
        assert response.json()["detail"]["error"]["code"] == "EVENT_NOT_FOUND"
