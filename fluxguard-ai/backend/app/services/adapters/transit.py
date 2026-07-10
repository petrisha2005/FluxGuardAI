from datetime import datetime


def get_transit_status() -> dict:
    """Simulates train arrivals at Stadium Station, returning surge wave states."""
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
