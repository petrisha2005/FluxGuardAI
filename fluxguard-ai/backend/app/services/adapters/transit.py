import logging
from datetime import datetime

logger = logging.getLogger(__name__)


def get_transit_status() -> dict:
    """Simulates train arrivals at Stadium Station, returning surge wave states.

    Includes robust try/except safeguards to prevent system crashes during API issues.
    """
    try:
        seconds = datetime.now().second

        # Simulate a train arriving every 30 seconds for testability/visibility
        time_to_next = 30 - (seconds % 30)

        if time_to_next <= 5 or time_to_next >= 25:
            return {
                "status": "arriving",
                "next_arrival": "arriving now",
                "passenger_count": 450,
                "description": "Train arriving - passengers egressing toward Gate C & West Entrance",
            }
        else:
            return {
                "status": "on_time",
                "next_arrival": f"{time_to_next}s",
                "passenger_count": 0,
                "description": "No active surges - next transit arrival scheduled shortly",
            }
    except Exception as e:
        logger.error(f"Error resolving transit telemetry: {e}")
        return {
            "status": "on_time",
            "next_arrival": "--",
            "passenger_count": 0,
            "description": "No active surges (telemetry fallback)",
        }
