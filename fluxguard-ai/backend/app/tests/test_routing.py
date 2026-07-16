from uuid import UUID
import httpx
import pytest

from app.main import app

SEED_EVENT_ID = "e0000000-0000-0000-0000-000000000000"
FAKE_EVENT_ID = "00000000-0000-0000-0000-000000000999"


@pytest.mark.asyncio
async def test_get_event_routing_recommendations() -> None:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get(f"/api/v1/events/{SEED_EVENT_ID}/routing-recommendations")

    assert response.status_code == 200
    json_data = response.json()
    assert "data" in json_data
    assert json_data["data"] == []


@pytest.mark.asyncio
async def test_get_event_routing_recommendations_not_found() -> None:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get(f"/api/v1/events/{FAKE_EVENT_ID}/routing-recommendations")

    assert response.status_code == 404
