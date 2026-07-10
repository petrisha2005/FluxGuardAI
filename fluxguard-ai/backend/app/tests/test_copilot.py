import pytest
from uuid import uuid4
from fastapi import status
from fastapi.testclient import TestClient

from app.core import database
from app.core.security import get_current_user, User
from app.main import app

SEED_EVENT_ID = "e0000000-0000-0000-0000-000000000000"


def test_copilot_offline_chat_triggers() -> None:
    client = TestClient(app)

    # 1. Test Gate C risks
    res_gate = client.post(
        f"/api/v1/events/{SEED_EVENT_ID}/copilot/chat",
        json={"message": "Why is Gate C high risk?"},
    )
    assert res_gate.status_code == 200
    data_gate = res_gate.json()["data"]
    assert "Gate C" in data_gate["response"]
    assert len(data_gate["suggested_actions"]) > 0

    # 2. Test worst zone attention
    res_worst = client.post(
        f"/api/v1/events/{SEED_EVENT_ID}/copilot/chat",
        json={"message": "Which zone needs attention?"},
    )
    assert res_worst.status_code == 200
    data_worst = res_worst.json()["data"]
    assert "attention" in data_worst["response"]

    # 3. Test evacuation route routing
    res_evac = client.post(
        f"/api/v1/events/{SEED_EVENT_ID}/copilot/chat",
        json={"message": "Safest evacuation route?"},
    )
    assert res_evac.status_code == 200
    data_evac = res_evac.json()["data"]
    assert "evacuation" in data_evac["response"]

    # 4. Test summary
    res_sum = client.post(
        f"/api/v1/events/{SEED_EVENT_ID}/copilot/chat",
        json={"message": "Summarize the last 10 minutes"},
    )
    assert res_sum.status_code == 200
    data_sum = res_sum.json()["data"]
    assert "Summary of the last 10 minutes" in data_sum["response"]


def test_copilot_empty_query() -> None:
    client = TestClient(app)
    res = client.post(
        f"/api/v1/events/{SEED_EVENT_ID}/copilot/chat",
        json={"message": "  "},
    )
    assert res.status_code == 400


def test_copilot_not_found() -> None:
    client = TestClient(app)
    fake_id = uuid4()
    res = client.post(
        f"/api/v1/events/{fake_id}/copilot/chat",
        json={"message": "test query"},
    )
    assert res.status_code == 404


def test_copilot_rbac_auth() -> None:
    # Clear overrides to verify real security checks
    app.dependency_overrides.clear()
    client = TestClient(app)

    # Access forbidden (403) for Fan role
    app.dependency_overrides[get_current_user] = lambda: User(
        id="fan-1", email="fan@gmail.com", role="fan"
    )
    res = client.post(
        f"/api/v1/events/{SEED_EVENT_ID}/copilot/chat",
        json={"message": "Why is Gate C high risk?"},
    )
    assert res.status_code == 403

    # Clean up overrides to return to conftest default
    app.dependency_overrides.clear()
