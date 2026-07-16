from datetime import UTC, datetime

import httpx
import pytest

from app.core import database
from app.main import app

SEED_EVENT_ID = "e0000000-0000-0000-0000-000000000000"
ZONE_1 = "00000000-0000-0000-0000-000000000001"  # North Gate
ZONE_2 = "00000000-0000-0000-0000-000000000002"  # East Concourse
ZONE_3 = "00000000-0000-0000-0000-000000000003"  # Gate C
ZONE_4 = "00000000-0000-0000-0000-000000000004"  # West Entrance


@pytest.fixture(autouse=True)
def setup_clean_db():
    database.clear_database()


@pytest.mark.asyncio
async def test_intervention_effectiveness_lifecycle() -> None:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        headers = {"Authorization": "Bearer mock-operator"}

        # 1. Seed some initial measurements for all 4 zones (Tick 0)
        for zone in [ZONE_1, ZONE_2, ZONE_3, ZONE_4]:
            await client.post(
                f"/api/v1/events/{SEED_EVENT_ID}/measurements",
                json={
                    "zoneId": zone,
                    "measuredAt": datetime.now(UTC).isoformat(),
                    "densityCount": 200,  # 40% of 500 capacity
                    "flowRatePerMinute": 10.0,
                    "queueLength": 5,
                    "sourceType": "camera",
                    "confidence": 0.95,
                },
                headers=headers,
            )

        # 2. Trigger staff redeployment -> Logs an intervention (Pre-density should be 40%)
        redeploy_payload = {
            "fromZoneId": ZONE_2,
            "toZoneId": ZONE_1,
            "count": 5,
        }
        await client.post(
            f"/api/v1/events/{SEED_EVENT_ID}/staffing/redeploy",
            json=redeploy_payload,
            headers=headers,
        )

        # 3. Verify it is logged with None post-intervention metrics
        response = await client.get(
            f"/api/v1/events/{SEED_EVENT_ID}/analytics/interventions",
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()["data"]
        assert len(data) == 1
        assert data[0]["type"] == "STAFF"
        assert data[0]["preDensity"] == 10
        assert data[0]["postDensity"] is None

        # 4. Ingest Tick 1 measurements
        for zone in [ZONE_1, ZONE_2, ZONE_3, ZONE_4]:
            await client.post(
                f"/api/v1/events/{SEED_EVENT_ID}/measurements",
                json={
                    "zoneId": zone,
                    "measuredAt": datetime.now(UTC).isoformat(),
                    "densityCount": 150,
                    "flowRatePerMinute": 10.0,
                    "queueLength": 4,
                    "sourceType": "camera",
                    "confidence": 0.95,
                },
                headers=headers,
            )

        # 5. Ingest Tick 2 measurements (This triggers the resolve update because current_tick (2) >= trigger_tick (0) + 2)
        # Set ZONE_1 density to 100 (5% of 2000 capacity)
        for zone in [ZONE_1, ZONE_2, ZONE_3, ZONE_4]:
            density = 100 if zone == ZONE_1 else 150
            await client.post(
                f"/api/v1/events/{SEED_EVENT_ID}/measurements",
                json={
                    "zoneId": zone,
                    "measuredAt": datetime.now(UTC).isoformat(),
                    "densityCount": density,
                    "flowRatePerMinute": 10.0,
                    "queueLength": 3,
                    "sourceType": "camera",
                    "confidence": 0.95,
                },
                headers=headers,
            )

        # 6. Verify GET response resolves the post-intervention values
        response_resolved = await client.get(
            f"/api/v1/events/{SEED_EVENT_ID}/analytics/interventions",
            headers=headers,
        )
        assert response_resolved.status_code == 200
        data_resolved = response_resolved.json()["data"]
        assert len(data_resolved) == 1
        assert data_resolved[0]["postDensity"] == 5  # 100/2000 * 100 = 5%
        assert data_resolved[0]["postRisk"] == "LOW"
