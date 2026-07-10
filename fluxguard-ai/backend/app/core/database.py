import threading
from datetime import datetime
from uuid import UUID

# Mock database tables using thread-safe structures
_lock = threading.Lock()

# Seed Event (valid UUID representation)
_events = {
    UUID("e0000000-0000-0000-0000-000000000000"): {
        "id": UUID("e0000000-0000-0000-0000-000000000000"),
        "name": "FIFA World Cup 2026 - Opening Match",
        "description": "Opening match at the stadium",
        "status": "active",
        "starts_at": datetime(2026, 6, 11, 18, 0, 0),
        "ends_at": datetime(2026, 6, 11, 22, 0, 0),
    }
}

# Seed Zones mapped to the Event ID (using valid hexadecimal UUIDs)
_zones = {
    UUID("00000000-0000-0000-0000-000000000001"): {
        "id": UUID("00000000-0000-0000-0000-000000000001"),
        "event_id": UUID("e0000000-0000-0000-0000-000000000000"),
        "name": "North Gate",
        "type": "gate",
        "capacity": 2000,
        "parent_zone_id": None,
        "status": "open",
    },
    UUID("00000000-0000-0000-0000-000000000002"): {
        "id": UUID("00000000-0000-0000-0000-000000000002"),
        "event_id": UUID("e0000000-0000-0000-0000-000000000000"),
        "name": "East Concourse",
        "type": "concourse",
        "capacity": 5000,
        "parent_zone_id": None,
        "status": "open",
    },
    UUID("00000000-0000-0000-0000-000000000003"): {
        "id": UUID("00000000-0000-0000-0000-000000000003"),
        "event_id": UUID("e0000000-0000-0000-0000-000000000000"),
        "name": "Gate C",
        "type": "gate",
        "capacity": 1500,
        "parent_zone_id": None,
        "status": "open",
    },
    UUID("00000000-0000-0000-0000-000000000004"): {
        "id": UUID("00000000-0000-0000-0000-000000000004"),
        "event_id": UUID("e0000000-0000-0000-0000-000000000000"),
        "name": "West Entrance",
        "type": "gate",
        "capacity": 1800,
        "parent_zone_id": None,
        "status": "open",
    },
}

_measurements = []


def get_all_events() -> list[dict]:
    with _lock:
        return list(_events.values())


def get_event_by_id(event_id: UUID) -> dict | None:
    with _lock:
        return _events.get(event_id)


def get_zones_for_event(event_id: UUID, zone_type: str | None = None) -> list[dict]:
    with _lock:
        results = [z for z in _zones.values() if z["event_id"] == event_id]
        if zone_type:
            results = [z for z in results if z["type"] == zone_type]
        return results


def get_zone_by_id(zone_id: UUID) -> dict | None:
    with _lock:
        return _zones.get(zone_id)


def add_measurement(measurement: dict) -> None:
    with _lock:
        _measurements.append(measurement)


def get_all_measurements() -> list[dict]:
    with _lock:
        return list(_measurements)


def clear_database() -> None:
    """Utility to reset dynamic database state in tests."""
    with _lock:
        _measurements.clear()
