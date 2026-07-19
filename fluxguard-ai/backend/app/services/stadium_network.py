# Stadium Network management database mock
STADIUM_REGISTRY = {
    "stadium_001": {
        "id": "stadium_001",
        "name": "MetLife Stadium",
        "city": "New York",
        "country": "USA",
        "capacity": 82000,
        "currentAttendance": 72000,
        "riskLevel": "high",
        "predictionStatus": "Critical congestion in 18 minutes",
    },
    "stadium_002": {
        "id": "stadium_002",
        "name": "SoFi Stadium",
        "city": "Los Angeles",
        "country": "USA",
        "capacity": 70000,
        "currentAttendance": 65000,
        "riskLevel": "low",
        "predictionStatus": "Standard crowd flow",
    },
    "stadium_003": {
        "id": "stadium_003",
        "name": "Mercedes-Benz Stadium",
        "city": "Atlanta",
        "country": "USA",
        "capacity": 71000,
        "currentAttendance": 68000,
        "riskLevel": "low",
        "predictionStatus": "Stable exit patterns",
    },
    "stadium_004": {
        "id": "stadium_004",
        "name": "Hard Rock Stadium",
        "city": "Miami",
        "country": "USA",
        "capacity": 65000,
        "currentAttendance": 59000,
        "riskLevel": "medium",
        "predictionStatus": "Moderate queue delays",
    },
}


def get_all_stadiums() -> list[dict]:
    """Returns lists of all currently monitored stadiums in the network."""
    return list(STADIUM_REGISTRY.values())


def add_stadium(stadium_data: dict) -> dict:
    """Registers a new stadium into the global command center network."""
    sid = stadium_data.get("id") or f"stadium_{len(STADIUM_REGISTRY) + 1:03d}"
    new_stadium = {
        "id": sid,
        "name": stadium_data.get("name", "Unknown Stadium"),
        "city": stadium_data.get("city", "Unknown City"),
        "country": stadium_data.get("country", "Unknown Country"),
        "capacity": int(stadium_data.get("capacity", 50000)),
        "currentAttendance": int(stadium_data.get("currentAttendance", 0)),
        "riskLevel": stadium_data.get("riskLevel", "low"),
        "predictionStatus": stadium_data.get("predictionStatus", "Standard operational baseline"),
    }
    STADIUM_REGISTRY[sid] = new_stadium
    return new_stadium


def get_stadium_by_id(stadium_id: str) -> dict | None:
    """Returns detail parameters of a targeted stadium in the network registry."""
    return STADIUM_REGISTRY.get(stadium_id)
