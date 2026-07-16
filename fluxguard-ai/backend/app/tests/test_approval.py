from datetime import UTC, datetime
from uuid import uuid4

import httpx
import pytest

from app.core import database
from app.main import app

SEED_EVENT_ID = "e0000000-0000-0000-0000-000000000000"
SEED_ZONE_ID = "00000000-0000-0000-0000-000000000001"
FAKE_GUIDANCE_ID = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"


@pytest.fixture(autouse=True)
def setup_mock_data():
    database.clear_database()
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

    guidance_record = {
        "guidance_id": uuid4(),
        "alert_id": alert_record["id"],
        "audience_role": "operator",
        "severity": "high",
        "headline": "Operator Directive",
        "actions": ["Verify CCTV", "Notify captains"],
        "expires_at": datetime.now(UTC),
        "payload": {},
        "prompt_version": "1.0",
        "schema_version": "1.0",
        "model_provider": "system",
        "model_name": "test",
        "input_context_hash": "hash",
        "status": "PENDING_APPROVAL",
    }
    database.add_guidance(guidance_record)
    return alert_record, guidance_record


@pytest.mark.asyncio
async def test_approve_guidance(setup_mock_data) -> None:
    _, guidance = setup_mock_data
    guidance_id = guidance["guidance_id"]
    transport = httpx.ASGITransport(app=app)

    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        # Mock authorization header by default
        headers = {"Authorization": "Bearer mock-operator"}
        response = await client.post(
            f"/api/v1/events/{SEED_EVENT_ID}/guidance/{guidance_id}/approve",
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()["data"]
        assert data["status"] == "APPROVED"


@pytest.mark.asyncio
async def test_reject_guidance(setup_mock_data) -> None:
    _, guidance = setup_mock_data
    guidance_id = guidance["guidance_id"]
    transport = httpx.ASGITransport(app=app)

    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        headers = {"Authorization": "Bearer mock-operator"}
        response = await client.post(
            f"/api/v1/events/{SEED_EVENT_ID}/guidance/{guidance_id}/reject",
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()["data"]
        assert data["status"] == "REJECTED"


@pytest.mark.asyncio
async def test_approve_guidance_not_found() -> None:
    transport = httpx.ASGITransport(app=app)

    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        headers = {"Authorization": "Bearer mock-operator"}
        response = await client.post(
            f"/api/v1/events/{SEED_EVENT_ID}/guidance/{FAKE_GUIDANCE_ID}/approve",
            headers=headers,
        )
        assert response.status_code == 404
