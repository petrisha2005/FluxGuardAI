from uuid import uuid4

import pytest

from app.auth.dependencies import get_current_user
from app.core.security import User
from app.main import app
from app.services.adapters.ticket_scans import get_ticket_scan_rates
from app.services.adapters.transit import get_transit_status
from app.services.adapters.weather import get_current_weather

SEED_EVENT_ID = "e0000000-0000-0000-0000-000000000000"
pytestmark = pytest.mark.asyncio


async def test_adapters_simulation_logic() -> None:
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


async def test_integrations_endpoint_role_auth(async_client) -> None:
    # Remove conftest overrides to test explicit RBAC checks
    app.dependency_overrides.clear()
    # 1. Access permitted for Operator role
    app.dependency_overrides[get_current_user] = lambda: User(
        id="op-1", email="op@stadium.org", role="operator"
    )
    res_op = await async_client.get(f"/api/v1/events/{SEED_EVENT_ID}/integrations")
    assert res_op.status_code == 200
    assert "weather" in res_op.json()["data"]
    assert "transit" in res_op.json()["data"]

    # 2. Access blocked (403) for Fan role
    app.dependency_overrides[get_current_user] = lambda: User(
        id="fan-1", email="fan@gmail.com", role="fan"
    )
    res_fan = await async_client.get(f"/api/v1/events/{SEED_EVENT_ID}/integrations")
    assert res_fan.status_code == 403

    # Clean up overrides to return to conftest default
    app.dependency_overrides.clear()


async def test_integrations_not_found(async_client) -> None:
    fake_id = uuid4()
    res = await async_client.get(f"/api/v1/events/{fake_id}/integrations")
    assert res.status_code == 404


async def test_predictions_incorporate_coefficients(async_client) -> None:
    # Ensure prediction cycle runs cleanly pulling from live adapters
    response = await async_client.post(f"/api/v1/events/{SEED_EVENT_ID}/predictions/run")
    assert response.status_code == 202
    data = response.json()["data"]
    assert len(data) > 0
    for p in data:
        assert p["modelVersion"] == "prophet-mvp-v1.0-enriched"
        assert "predictedDensity" in p
        assert 0 <= p["predictedDensity"] <= 100


async def test_weather_adapter_fallback_on_exception() -> None:
    from unittest.mock import patch

    with patch("app.services.adapters.weather.datetime") as mock_datetime:
        mock_datetime.now.side_effect = RuntimeError("Weather API Timeout")
        fallback_weather = get_current_weather()
        assert fallback_weather["status"] == "clear"
        assert fallback_weather["exit_rate_modifier"] == 1.0
        assert "fallback" in fallback_weather["description"].lower()


async def test_transit_adapter_fallback_on_exception() -> None:
    from unittest.mock import patch

    with patch("app.services.adapters.transit.datetime") as mock_datetime:
        mock_datetime.now.side_effect = Exception("Connection Refused")
        fallback_transit = get_transit_status()
        assert fallback_transit["status"] == "on_time"
        assert fallback_transit["passenger_count"] == 0
        assert "fallback" in fallback_transit["description"].lower()


async def test_ticketing_adapter_fallback_on_exception() -> None:
    from unittest.mock import patch

    with patch("app.services.adapters.ticket_scans.random") as mock_random:
        mock_random.randint.side_effect = RuntimeError("Sensors Unreachable")
        fallback_ticketing = get_ticket_scan_rates()
        assert fallback_ticketing["total_scans_last_minute"] == 0
        assert fallback_ticketing["active_turnstiles"] == 0
        assert fallback_ticketing["average_scans_per_turnstile"] == 0.0
