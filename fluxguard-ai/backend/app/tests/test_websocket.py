import pytest
from fastapi.testclient import TestClient
from fastapi.websockets import WebSocketDisconnect

from app.core import database
from app.main import app

SEED_EVENT_ID = "e0000000-0000-0000-0000-000000000000"
SEED_ZONE_ID = "00000000-0000-0000-0000-000000000001"
FAKE_EVENT_ID = "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"


@pytest.fixture(autouse=True)
def cleanup_db():
    database.clear_database()
    yield
    database.clear_database()


def test_websocket_invalid_event() -> None:
    client = TestClient(app)
    with pytest.raises(WebSocketDisconnect) as exc_info:
        with client.websocket_connect(f"/ws/events/{FAKE_EVENT_ID}"):
            pass
    assert exc_info.value.code == 1008


def test_websocket_broadcasts() -> None:
    client = TestClient(app)

    # Establish WebSocket connection
    with client.websocket_connect(f"/ws/events/{SEED_EVENT_ID}") as websocket:
        # 1. Post a measurements tick to trigger zone_status_updated broadcast
        payload = {
            "zoneId": SEED_ZONE_ID,
            "measuredAt": "2026-07-09T10:00:00Z",
            "densityCount": 60,
            "flowRatePerMinute": 30,
            "queueLength": 90,
            "sourceType": "simulator",
            "confidence": 0.9,
        }
        res_ingest = client.post(
            f"/api/v1/events/{SEED_EVENT_ID}/measurements",
            json=payload,
        )
        assert res_ingest.status_code == 201

        # Assert client receives the broadcast frame
        msg_status = websocket.receive_json()
        assert msg_status["type"] == "zone_status_updated"
        assert msg_status["data"]["zoneId"] == SEED_ZONE_ID
        assert msg_status["data"]["densityCount"] == 60

        # 2. Run predictions forecast to trigger prediction/risk broadcast events
        res_predict = client.post(f"/api/v1/events/{SEED_EVENT_ID}/predictions/run")
        assert res_predict.status_code == 202

        # Assert predictions update broadcast
        msg_pred = websocket.receive_json()
        assert msg_pred["type"] == "prediction_updated"
        assert len(msg_pred["data"]) == 12

        # Assert risk score updates broadcast
        msg_risk = websocket.receive_json()
        assert msg_risk["type"] == "risk_score_updated"
        assert len(msg_risk["data"]) == 4
