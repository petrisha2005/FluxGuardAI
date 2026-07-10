import jwt
import pytest
from fastapi.testclient import TestClient

from app.core.security import User, decode_token, get_current_user
from app.main import app

SEED_EVENT_ID = "e0000000-0000-0000-0000-000000000000"


@pytest.fixture
def clean_auth_overrides():
    # Remove the conftest dependency bypass to test real security functions
    app.dependency_overrides.clear()
    yield
    # Conftest will restore it when conftest fixture yields back, but to be safe:
    app.dependency_overrides[get_current_user] = lambda: User(
        id="mock-op-uuid",
        email="operator@stadiumops.org",
        role="operator",
    )


def test_mock_tokens_access(clean_auth_overrides) -> None:
    client = TestClient(app)

    # 1. Valid operator access to alerts list
    response = client.get(
        f"/api/v1/events/{SEED_EVENT_ID}/alerts",
        headers={"Authorization": "Bearer mock-operator"},
    )
    assert response.status_code == 200

    # 2. Invalid mock token
    response_invalid = client.get(
        f"/api/v1/events/{SEED_EVENT_ID}/alerts",
        headers={"Authorization": "Bearer mock-unknown"},
    )
    assert response_invalid.status_code == 401


def test_role_based_access_denied(clean_auth_overrides) -> None:
    client = TestClient(app)

    # A fan role should not be authorized to access alert endpoints
    response_fan = client.get(
        f"/api/v1/events/{SEED_EVENT_ID}/alerts",
        headers={"Authorization": "Bearer mock-fan"},
    )
    assert response_fan.status_code == 403
    assert "not authorized" in response_fan.json()["detail"]["error"]["message"].lower()

    # A volunteer role should not be authorized to trigger prediction runs
    response_vol = client.post(
        f"/api/v1/events/{SEED_EVENT_ID}/predictions/run",
        headers={"Authorization": "Bearer mock-volunteer"},
    )
    assert response_vol.status_code == 403


def test_production_jwt_decoding() -> None:
    # Verify that decoding JWT works with settings
    secret = "super-secret-key"
    payload = {
        "sub": "user-1234",
        "email": "test@ops.org",
        "role": "operator",
        "user_metadata": {"preferred_language": "fr"},
    }
    token = jwt.encode(payload, secret, algorithm="HS256")

    decoded = decode_token(token, secret, "HS256")
    assert decoded["sub"] == "user-1234"
    assert decoded["email"] == "test@ops.org"
    assert decoded["role"] == "operator"
