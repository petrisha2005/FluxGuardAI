import httpx
import pytest

from app.core import database
from app.main import app

SEED_EVENT_ID = "e0000000-0000-0000-0000-000000000000"
SEED_ZONE_ID = "00000000-0000-0000-0000-000000000001"  # North Gate
FAKE_EVENT_ID = "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"


@pytest.fixture(autouse=True)
def cleanup_db():
    database.clear_database()
    yield
    database.clear_database()


@pytest.mark.asyncio
async def test_risk_and_alerts_lifecycle() -> None:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        # 1. Post a high congestion signal for North Gate
        # density_count=1900 (95% of 2000 capacity), queue_length=400, flow_rate=60
        payload = {
            "zoneId": SEED_ZONE_ID,
            "measuredAt": "2026-07-09T10:00:00Z",
            "densityCount": 1900,
            "flowRatePerMinute": 60,
            "queueLength": 400,
            "sourceType": "simulator",
            "confidence": 0.95,
        }
        res_ingest = await client.post(
            f"/api/v1/events/{SEED_EVENT_ID}/measurements",
            json=payload,
        )
        assert res_ingest.status_code == 201

        # 2. Run forecasting predictions cycle
        res_predict = await client.post(f"/api/v1/events/{SEED_EVENT_ID}/predictions/run")
        assert res_predict.status_code == 202

        # 3. Retrieve risk scores
        res_risk = await client.get(f"/api/v1/events/{SEED_EVENT_ID}/risk-scores")
        assert res_risk.status_code == 200
        risk_data = res_risk.json()["data"]

        # Verify North Gate risk record exists and is critical
        north_gate_risk = next(r for r in risk_data if r["zoneId"] == SEED_ZONE_ID)
        assert north_gate_risk["severity"] == "critical"
        assert north_gate_risk["riskScore"] >= 85
        assert "Critical crowd density threshold exceeded" in north_gate_risk["drivers"]

        # 4. Fetch the triggered alerts list
        res_alerts = await client.get(f"/api/v1/events/{SEED_EVENT_ID}/alerts")
        assert res_alerts.status_code == 200
        alerts = res_alerts.json()["data"]
        assert len(alerts) >= 1

        alert = next(a for a in alerts if a["zoneId"] == SEED_ZONE_ID)
        assert alert["severity"] == "critical"
        assert alert["status"] == "unacknowledged"
        assert "congestion forecast" in alert["title"]

        alert_id = alert["id"]

        # 5. Acknowledge alert
        res_ack = await client.post(f"/api/v1/events/{SEED_EVENT_ID}/alerts/{alert_id}/acknowledge")
        assert res_ack.status_code == 200
        assert res_ack.json()["data"]["status"] == "acknowledged"

        # 6. Patch status to resolved
        res_patch = await client.patch(
            f"/api/v1/events/{SEED_EVENT_ID}/alerts/{alert_id}",
            json={
                "status": "resolved",
                "notes": "Crowd redirected successfully",
                "assignee": "Operator A",
            },
        )
        assert res_patch.status_code == 200
        updated_alert = res_patch.json()["data"]
        assert updated_alert["status"] == "resolved"
        assert updated_alert["notes"] == "Crowd redirected successfully"
        assert updated_alert["assignee"] == "Operator A"

        # 7. Check transition conflicts: cannot acknowledge a resolved alert
        res_conflict = await client.post(
            f"/api/v1/events/{SEED_EVENT_ID}/alerts/{alert_id}/acknowledge"
        )
        assert res_conflict.status_code == 409
        assert res_conflict.json()["detail"]["error"]["code"] == "ALERT_RESOLVED"
