from fastapi import APIRouter, WebSocket, WebSocketDisconnect

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
