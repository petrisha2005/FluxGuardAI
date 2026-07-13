from datetime import UTC, datetime, timedelta
from uuid import UUID, uuid4

import httpx
import pytest

from app.core import database
from app.main import app

SEED_EVENT_ID = "e0000000-0000-0000-0000-000000000000"
SEED_ZONE_ID = "00000000-0000-0000-0000-000000000001"


@pytest.fixture(autouse=True)
def setup_mock_signage():
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

    # 1. Unexpired Approved guidance
    g1 = {
        "guidance_id": uuid4(),
        "alert_id": alert_record["id"],
        "audience_role": "fan",
        "severity": "high",
        "headline": "Approved Directive",
        "actions": ["Follow signs"],
        "expires_at": datetime.now(UTC) + timedelta(hours=2),
        "payload": {},
        "prompt_version": "1.0",
        "schema_version": "1.0",
        "model_provider": "system",
        "model_name": "test",
        "input_context_hash": "hash1",
        "status": "APPROVED",
    }
    database.add_guidance(g1)

    # 2. Unexpired Pending guidance
    g2 = {
        "guidance_id": uuid4(),
        "alert_id": alert_record["id"],
        "audience_role": "fan",
        "severity": "high",
        "headline": "Pending Directive",
        "actions": ["Follow signs"],
        "expires_at": datetime.now(UTC) + timedelta(hours=2),
        "payload": {},
        "prompt_version": "1.0",
        "schema_version": "1.0",
        "model_provider": "system",
        "model_name": "test",
        "input_context_hash": "hash2",
        "status": "PENDING_APPROVAL",
    }
    database.add_guidance(g2)

    # 3. Expired Approved guidance
    g3 = {
        "guidance_id": uuid4(),
        "alert_id": alert_record["id"],
        "audience_role": "fan",
        "severity": "high",
        "headline": "Expired Approved Directive",
        "actions": ["Follow signs"],
        "expires_at": datetime.now(UTC) - timedelta(hours=2),
        "payload": {},
        "prompt_version": "1.0",
        "schema_version": "1.0",
        "model_provider": "system",
        "model_name": "test",
        "input_context_hash": "hash3",
        "status": "APPROVED",
    }
    database.add_guidance(g3)

    return alert_record, g1, g2, g3


@pytest.mark.asyncio
async def test_get_active_approved_guidance(setup_mock_signage) -> None:
    _, g1, _, _ = setup_mock_signage
    transport = httpx.ASGITransport(app=app)

    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        headers = {"Authorization": "Bearer mock-operator"}
        response = await client.get(
            f"/api/v1/events/{SEED_EVENT_ID}/guidance/active",
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()["data"]
        # Only the unexpired approved directive should return!
        assert len(data) == 1
        assert data[0]["guidanceId"] == str(g1["guidance_id"])
        assert data[0]["alertId"] == str(g1["alert_id"])
        assert data[0]["status"] == "APPROVED"
