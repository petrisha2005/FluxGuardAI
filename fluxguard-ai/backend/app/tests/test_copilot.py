from uuid import uuid4

import pytest
from httpx import ASGITransport, AsyncClient

from app.auth.dependencies import get_current_user
from app.core.security import User
from app.main import app

SEED_EVENT_ID = "e0000000-0000-0000-0000-000000000000"


async def post_json(path: str, payload: dict) -> object:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        return await client.post(path, json=payload)


@pytest.mark.asyncio
async def test_command_center_copilot_chat_uses_live_context() -> None:
    res = await post_json(
        "/api/copilot/chat",
        {
            "message": "Which zone needs immediate attention?",
            "venue": "FluxGuard AI Stadium Command Center",
            "context": {
                "zones": [
                    {
                        "id": "gate-c",
                        "name": "Gate C",
                        "density": 88,
                        "queueLength": 240,
                        "entryRate": 56,
                        "exitRate": 28,
                        "risk": "HIGH",
                        "lastUpdated": "2026-07-19T12:00:00Z",
                    },
                    {
                        "id": "west-entrance",
                        "name": "West Entrance",
                        "density": 42,
                        "queueLength": 80,
                        "entryRate": 24,
                        "exitRate": 30,
                        "risk": "LOW",
                        "lastUpdated": "2026-07-19T12:00:00Z",
                    },
                ],
                "riskAssessments": [],
                "events": [],
                "tick": 4,
                "lastUpdated": "2026-07-19T12:00:00Z",
                "isEvacuationActive": False,
            },
        },
    )

    assert res.status_code == 200
    data = res.json()
    assert data["risk_level"] == "HIGH"
    assert "Gate C" in data["answer"]
    assert data["confidence"] > 0
    assert data["recommendations"]


@pytest.mark.asyncio
async def test_copilot_offline_chat_triggers() -> None:
    # 1. Test Gate C risks
    res_gate = await post_json(
        f"/api/v1/events/{SEED_EVENT_ID}/copilot/chat",
        {"message": "Why is Gate C high risk?"},
    )
    assert res_gate.status_code == 200
    data_gate = res_gate.json()["data"]
    assert "Gate C" in data_gate["response"]
    assert len(data_gate["suggested_actions"]) > 0

    # 2. Test worst zone attention
    res_worst = await post_json(
        f"/api/v1/events/{SEED_EVENT_ID}/copilot/chat",
        {"message": "Which zone needs attention?"},
    )
    assert res_worst.status_code == 200
    data_worst = res_worst.json()["data"]
    assert "attention" in data_worst["response"]

    # 3. Test evacuation route routing
    res_evac = await post_json(
        f"/api/v1/events/{SEED_EVENT_ID}/copilot/chat",
        {"message": "Safest evacuation route?"},
    )
    assert res_evac.status_code == 200
    data_evac = res_evac.json()["data"]
    assert "evacuation" in data_evac["response"]

    # 4. Test summary
    res_sum = await post_json(
        f"/api/v1/events/{SEED_EVENT_ID}/copilot/chat",
        {"message": "Summarize the last 10 minutes"},
    )
    assert res_sum.status_code == 200
    data_sum = res_sum.json()["data"]
    assert "Summary of the last 10 minutes" in data_sum["response"]


@pytest.mark.asyncio
async def test_copilot_empty_query() -> None:
    res = await post_json(
        f"/api/v1/events/{SEED_EVENT_ID}/copilot/chat",
        {"message": "  "},
    )
    assert res.status_code == 400


@pytest.mark.asyncio
async def test_copilot_not_found() -> None:
    fake_id = uuid4()
    res = await post_json(
        f"/api/v1/events/{fake_id}/copilot/chat",
        {"message": "test query"},
    )
    assert res.status_code == 404


@pytest.mark.asyncio
async def test_copilot_rbac_auth() -> None:
    # Clear overrides to verify real security checks
    app.dependency_overrides.clear()

    # Access forbidden (403) for Fan role
    app.dependency_overrides[get_current_user] = lambda: User(
        id="fan-1", email="fan@gmail.com", role="fan"
    )
    res = await post_json(
        f"/api/v1/events/{SEED_EVENT_ID}/copilot/chat",
        {"message": "Why is Gate C high risk?"},
    )
    assert res.status_code == 403

    # Clean up overrides to return to conftest default
    app.dependency_overrides.clear()
