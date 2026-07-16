import httpx
import pytest

from app.main import app

SEED_EVENT_ID = "e0000000-0000-0000-0000-000000000000"
FAKE_EVENT_ID = "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"


@pytest.mark.asyncio
async def test_list_events() -> None:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get("/api/v1/events")

    assert response.status_code == 200
    json_data = response.json()
    assert "data" in json_data
    assert "meta" in json_data
    assert len(json_data["data"]) == 3
    event = next(e for e in json_data["data"] if e["id"] == SEED_EVENT_ID)
    assert event["name"] == "FIFA World Cup 2026 - Opening Match"


@pytest.mark.asyncio
async def test_get_event_by_id() -> None:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get(f"/api/v1/events/{SEED_EVENT_ID}")

    assert response.status_code == 200
    json_data = response.json()
    assert json_data["data"]["id"] == SEED_EVENT_ID
    assert json_data["data"]["status"] == "active"


@pytest.mark.asyncio
async def test_get_event_not_found() -> None:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get(f"/api/v1/events/{FAKE_EVENT_ID}")

    assert response.status_code == 404
    json_data = response.json()
    assert "detail" in json_data
    assert "error" in json_data["detail"]
    assert json_data["detail"]["error"]["code"] == "EVENT_NOT_FOUND"


@pytest.mark.asyncio
async def test_list_zones() -> None:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get(f"/api/v1/events/{SEED_EVENT_ID}/zones")

    assert response.status_code == 200
    json_data = response.json()
    assert len(json_data["data"]) == 4
    zone_names = {zone["name"] for zone in json_data["data"]}
    assert "North Gate" in zone_names
    assert "Gate C" in zone_names


@pytest.mark.asyncio
async def test_list_zones_filtered_by_type() -> None:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        # Filter for "concourse" type
        response = await client.get(
            f"/api/v1/events/{SEED_EVENT_ID}/zones",
            params={"zoneType": "concourse"},
        )

    assert response.status_code == 200
    json_data = response.json()
    assert len(json_data["data"]) == 1
    assert json_data["data"][0]["name"] == "East Concourse"
    assert json_data["data"][0]["type"] == "concourse"


@pytest.mark.asyncio
async def test_list_zones_event_not_found() -> None:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get(f"/api/v1/events/{FAKE_EVENT_ID}/zones")

    assert response.status_code == 404
    json_data = response.json()
    assert "detail" in json_data
    assert "error" in json_data["detail"]
    assert json_data["detail"]["error"]["code"] == "EVENT_NOT_FOUND"


@pytest.mark.asyncio
async def test_get_event_zone_links() -> None:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get(f"/api/v1/events/{SEED_EVENT_ID}/links")

    assert response.status_code == 200
    json_data = response.json()
    assert "data" in json_data
    assert len(json_data["data"]) == 3
    link = json_data["data"][0]
    assert "sourceId" in link
    assert "targetId" in link
    assert "capacityFlow" in link
