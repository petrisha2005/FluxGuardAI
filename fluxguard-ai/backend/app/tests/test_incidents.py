from datetime import UTC, datetime
from uuid import UUID, uuid4

import httpx
import pytest

from app.core import database
from app.main import app

SEED_EVENT_ID = "e0000000-0000-0000-0000-000000000000"
ZONE_1 = "00000000-0000-0000-0000-000000000001"  # North Gate


@pytest.fixture(autouse=True)
def setup_clean_db():
    database.clear_database()


@pytest.mark.asyncio
async def test_create_incident() -> None:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        headers = {"Authorization": "Bearer mock-operator"}
        payload = {
            "zoneId": ZONE_1,
            "type": "MEDICAL",
            "severity": "HIGH",
            "description": "Heat exhaustion near entrance queues.",
        }
        response = await client.post(
            f"/api/v1/events/{SEED_EVENT_ID}/incidents",
            json=payload,
            headers=headers,
        )
        assert response.status_code == 201
        data = response.json()["data"]
        assert data["type"] == "MEDICAL"
        assert data["severity"] == "HIGH"
        assert data["status"] == "REPORTED"

        # Check in DB
        incidents = database.get_incidents(UUID(SEED_EVENT_ID))
        assert len(incidents) == 1
        assert incidents[0]["description"] == "Heat exhaustion near entrance queues."


@pytest.mark.asyncio
async def test_dispatch_and_resolve_incident() -> None:
    incident_id = uuid4()
    mock_incident = {
        "id": incident_id,
        "event_id": UUID(SEED_EVENT_ID),
        "zone_id": UUID(ZONE_1),
        "type": "SECURITY",
        "severity": "CRITICAL",
        "status": "REPORTED",
        "description": "Gate intrusion attempts.",
        "responder_name": None,
        "created_at": datetime.now(UTC),
        "resolved_at": None,
    }
    database.add_incident(mock_incident)

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        headers = {"Authorization": "Bearer mock-operator"}

        # 1. Dispatch
        dispatch_payload = {"responderName": "Steward Jessica"}
        response = await client.post(
            f"/api/v1/events/{SEED_EVENT_ID}/incidents/{incident_id}/dispatch",
            json=dispatch_payload,
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()["data"]
        assert data["status"] == "DISPATCHED"
        assert data["responderName"] == "Steward Jessica"

        # 2. Resolve
        response_res = await client.post(
            f"/api/v1/events/{SEED_EVENT_ID}/incidents/{incident_id}/resolve",
            headers=headers,
        )
        assert response_res.status_code == 200
        data_res = response_res.json()["data"]
        assert data_res["status"] == "RESOLVED"
        assert data_res["resolvedAt"] is not None
