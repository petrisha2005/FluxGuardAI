import pytest

from app.api.websocket import websocket_endpoint
from app.core import database
from app.core.websocket import manager

SEED_EVENT_ID = "e0000000-0000-0000-0000-000000000000"
SEED_ZONE_ID = "00000000-0000-0000-0000-000000000001"
FAKE_EVENT_ID = "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"
pytestmark = pytest.mark.asyncio


class FakeWebSocket:
    def __init__(self) -> None:
        self.accepted = False
        self.close_code: int | None = None
        self.messages: list[dict] = []

    async def accept(self) -> None:
        self.accepted = True

    async def close(self, code: int = 1000) -> None:
        self.close_code = code

    async def send_json(self, payload: dict) -> None:
        self.messages.append(payload)


@pytest.fixture(autouse=True)
def cleanup_db():
    database.clear_database()
    yield
    database.clear_database()


async def test_websocket_invalid_event() -> None:
    websocket = FakeWebSocket()
    await websocket_endpoint(websocket, FAKE_EVENT_ID)
    assert websocket.accepted is False
    assert websocket.close_code == 1008


async def test_websocket_broadcasts(async_client) -> None:
    websocket = FakeWebSocket()
    manager.active_connections[str(SEED_EVENT_ID)] = [websocket]

    payload = {
        "zoneId": SEED_ZONE_ID,
        "measuredAt": "2026-07-09T10:00:00Z",
        "densityCount": 60,
        "flowRatePerMinute": 30,
        "queueLength": 90,
        "sourceType": "simulator",
        "confidence": 0.9,
    }
    res_ingest = await async_client.post(
        f"/api/v1/events/{SEED_EVENT_ID}/measurements",
        json=payload,
    )
    assert res_ingest.status_code == 201

    msg_status = websocket.messages[0]
    assert msg_status["type"] == "zone_status_updated"
    assert msg_status["data"]["zoneId"] == SEED_ZONE_ID
    assert msg_status["data"]["densityCount"] == 60

    res_predict = await async_client.post(f"/api/v1/events/{SEED_EVENT_ID}/predictions/run")
    assert res_predict.status_code == 202

    message_types = [message["type"] for message in websocket.messages]
    assert "prediction_updated" in message_types
    assert "risk_score_updated" in message_types

    prediction_message = next(
        message for message in websocket.messages if message["type"] == "prediction_updated"
    )
    risk_message = next(
        message for message in websocket.messages if message["type"] == "risk_score_updated"
    )
    assert len(prediction_message["data"]) == 12
    assert len(risk_message["data"]) == 4
