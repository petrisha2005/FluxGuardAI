import logging
from typing import Any

from fastapi import WebSocket

logger = logging.getLogger("fluxguard.websocket")


class ConnectionManager:
    """Manages active WebSocket subscriptions and broadcasts update frames by event ID."""

    def __init__(self):
        # Maps event_id (string/UUID) to a list of active WebSocket connections
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, event_id: str, websocket: WebSocket) -> None:
        """Accepts and registers a new client connection under an event ID."""
        await websocket.accept()
        if event_id not in self.active_connections:
            self.active_connections[event_id] = []
        self.active_connections[event_id].append(websocket)
        logger.info(f"WebSocket client connected to event channel: {event_id}")

    def disconnect(self, event_id: str, websocket: WebSocket) -> None:
        """Removes a client connection from registration."""
        if event_id in self.active_connections:
            if websocket in self.active_connections[event_id]:
                self.active_connections[event_id].remove(websocket)
            if not self.active_connections[event_id]:
                del self.active_connections[event_id]
        logger.info(f"WebSocket client disconnected from event channel: {event_id}")

    async def broadcast_to_event(self, event_id: str, message_type: str, data: Any) -> None:
        """Broadcasts a structured JSON payload to all active clients subscribed to the event."""
        connections = self.active_connections.get(event_id, [])
        if not connections:
            return

        payload = {
            "type": message_type,
            "data": data,
        }

        # Iterate and send, pruning any dead connections on the fly
        disconnected = []
        for connection in connections:
            try:
                await connection.send_json(payload)
            except Exception as e:
                logger.warning(f"Failed to send WebSocket message: {e}")
                disconnected.append(connection)

        for conn in disconnected:
            self.disconnect(event_id, conn)


# Global singleton instance
manager = ConnectionManager()
