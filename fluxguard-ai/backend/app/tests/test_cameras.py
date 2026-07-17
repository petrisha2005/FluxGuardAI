from uuid import UUID
import httpx
import pytest

from app.main import app

SEED_EVENT_ID = "e0000000-0000-0000-0000-000000000000"
FAKE_EVENT_ID = "00000000-0000-0000-0000-000000000999"


@pytest.mark.asyncio
async def test_get_event_cameras() -> None:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get(f"/api/v1/events/{SEED_EVENT_ID}/cameras")

    assert response.status_code == 200
    json_data = response.json()
    assert "data" in json_data
    assert len(json_data["data"]) == 5
    camera = json_data["data"][0]
    assert "id" in camera
    assert "zoneId" in camera
    assert "name" in camera
    assert "fps" in camera
    assert "accuracy" in camera
    assert "status" in camera


@pytest.mark.asyncio
async def test_get_event_cameras_not_found() -> None:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get(f"/api/v1/events/{FAKE_EVENT_ID}/cameras")

    assert response.status_code == 404
