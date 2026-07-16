import httpx
import pytest

from app.main import app

SEED_VENUE_ID = "b0000000-0000-0000-0000-000000000000"
SEED_EVENT_ID = "e0000000-0000-0000-0000-000000000000"
FAKE_VENUE_ID = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"


@pytest.mark.asyncio
async def test_list_venues() -> None:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get("/api/v1/venues")

    assert response.status_code == 200
    json_data = response.json()
    assert "data" in json_data
    assert len(json_data["data"]) == 3
    names = [v["name"] for v in json_data["data"]]
    assert "Lucusa Stadium" in names
    assert "City Arena" in names
    assert "Downtown Fan Zone" in names


@pytest.mark.asyncio
async def test_list_venue_events() -> None:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get(f"/api/v1/venues/{SEED_VENUE_ID}/events")

    assert response.status_code == 200
    json_data = response.json()
    assert "data" in json_data
    assert len(json_data["data"]) == 1
    assert json_data["data"][0]["id"] == SEED_EVENT_ID
    assert json_data["data"][0]["name"] == "FIFA World Cup 2026 - Opening Match"


@pytest.mark.asyncio
async def test_list_venue_events_not_found() -> None:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get(f"/api/v1/venues/{FAKE_VENUE_ID}/events")

    assert response.status_code == 404
