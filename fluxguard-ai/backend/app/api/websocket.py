from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import BaseModel

from app.core import database
from app.core.websocket import manager

router = APIRouter(tags=["websocket"])


@router.websocket("/ws/events/{eventId}")
async def websocket_endpoint(websocket: WebSocket, eventId: str):
    """WebSocket endpoint for receiving real-time stadium operations updates."""
    # Validate event existence
    try:
        event_uuid = database.UUID(eventId)
        event = database.get_event_by_id(event_uuid)
    except ValueError:
        event = None

    if not event:
        # Close connection immediately with bad policy code if event not found
        await websocket.close(code=1008)
        return

    await manager.connect(eventId, websocket)
    try:
        while True:
            # Maintain connection and listen for client text inputs (e.g. pings)
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(eventId, websocket)
    except Exception:
        manager.disconnect(eventId, websocket)


class BroadcastPayload(BaseModel):
    message_type: str
    payload: dict


@router.post("/api/ws/broadcast/{eventId}")
@router.post("/api/v1/ws/broadcast/{eventId}")
async def broadcast_ws_event(eventId: str, data: BroadcastPayload):
    """Utility endpoint to broadcast real-time global ops signals to websocket listeners."""
    await manager.broadcast_to_event(eventId, data.message_type, data.payload)
    return {"status": "success", "message": f"Broadcasted {data.message_type} to event {eventId}"}
