from uuid import uuid4

from fastapi.testclient import TestClient

from app.core.security import User, get_current_user
from app.main import app
from app.services.adapters.ticket_scans import get_ticket_scan_rates
from app.services.adapters.transit import get_transit_status
from app.services.adapters.weather import get_current_weather

SEED_EVENT_ID = "e0000000-0000-0000-0000-000000000000"


def test_adapters_simulation_logic() -> None:
    # 1. Weather
    weather = get_current_weather()
    assert "status" in weather
    assert weather["exit_rate_modifier"] in [0.4, 0.6, 1.0]

    # 2. Transit
    transit = get_transit_status()
    assert "status" in transit
    assert transit["status"] in ["arriving", "on_time"]

    # 3. Ticket turnstiles
    scans = get_ticket_scan_rates()
    assert "total_scans_last_minute" in scans
    assert scans["active_turnstiles"] == 16


def test_integrations_endpoint_role_auth() -> None:
    # Remove conftest overrides to test explicit RBAC checks
    app.dependency_overrides.clear()
    client = TestClient(app)

    # 1. Access permitted for Operator role
    app.dependency_overrides[get_current_user] = lambda: User(
        id="op-1", email="op@stadium.org", role="operator"
    )
    res_op = client.get(f"/api/v1/events/{SEED_EVENT_ID}/integrations")
    assert res_op.status_code == 200
    assert "weather" in res_op.json()["data"]
    assert "transit" in res_op.json()["data"]

    # 2. Access blocked (403) for Fan role
    app.dependency_overrides[get_current_user] = lambda: User(
        id="fan-1", email="fan@gmail.com", role="fan"
    )
    res_fan = client.get(f"/api/v1/events/{SEED_EVENT_ID}/integrations")
    assert res_fan.status_code == 403

    # Clean up overrides to return to conftest default
    app.dependency_overrides.clear()


def test_integrations_not_found() -> None:
    client = TestClient(app)
    fake_id = uuid4()
    res = client.get(f"/api/v1/events/{fake_id}/integrations")
    assert res.status_code == 404


def test_predictions_incorporate_coefficients() -> None:
    client = TestClient(app)
    # Ensure prediction cycle runs cleanly pulling from live adapters
    response = client.post(f"/api/v1/events/{SEED_EVENT_ID}/predictions/run")
    assert response.status_code == 202
    data = response.json()["data"]
    assert len(data) > 0
    for p in data:
        assert p["modelVersion"] == "prophet-mvp-v1.0-enriched"
        assert "predictedDensity" in p
        assert 0 <= p["predictedDensity"] <= 100
