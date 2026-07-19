import httpx
import pytest

from app.main import app


@pytest.mark.asyncio
async def test_digital_twin_endpoints() -> None:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:

        # Test Overview
        overview_resp = await client.get("/api/v1/digital-twin/overview")
        assert overview_resp.status_code == 200
        ov_data = overview_resp.json()
        assert "data" in ov_data
        assert "stadiumCapacity" in ov_data["data"]
        assert "currentAttendance" in ov_data["data"]
        assert "densityPercent" in ov_data["data"]

        # Test Zones
        zones_resp = await client.get("/api/v1/digital-twin/zones")
        assert zones_resp.status_code == 200
        z_data = zones_resp.json()
        assert "data" in z_data
        assert len(z_data["data"]) > 0
        assert "density" in z_data["data"][0]

        # Test Incidents
        inc_resp = await client.get("/api/v1/digital-twin/incidents")
        assert inc_resp.status_code == 200
        assert "data" in inc_resp.json()

        # Test Heatmap
        heatmap_resp = await client.get("/api/v1/digital-twin/heatmap")
        assert heatmap_resp.status_code == 200
        assert "data" in heatmap_resp.json()

        # Test Cameras
        cams_resp = await client.get("/api/v1/digital-twin/cameras")
        assert cams_resp.status_code == 200
        assert "data" in cams_resp.json()

        # Test Crowd Flow
        flow_resp = await client.get("/api/v1/digital-twin/crowd-flow")
        assert flow_resp.status_code == 200
        assert "data" in flow_resp.json()

        # Test Live logs
        live_resp = await client.get("/api/v1/digital-twin/live")
        assert live_resp.status_code == 200
        assert "data" in live_resp.json()
