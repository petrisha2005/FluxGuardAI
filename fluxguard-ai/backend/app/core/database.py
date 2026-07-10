import threading
from datetime import datetime
from uuid import UUID

# Mock database tables using thread-safe structures
_lock = threading.Lock()

# Seed Event
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
_predictions = []
_risk_scores = {}
_alerts = {}
_guidance = []
_feedback = []


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


# Predictions Table Helpers
def add_prediction(prediction: dict) -> None:
    with _lock:
        _predictions.append(prediction)


def get_predictions(
    event_id: UUID,
    zone_id: UUID | None = None,
    horizon_minutes: int | None = None,
    since: datetime | None = None,
) -> list[dict]:
    with _lock:
        event_zone_ids = {z["id"] for z in _zones.values() if z["event_id"] == event_id}
        results = [p for p in _predictions if p["zone_id"] in event_zone_ids]

        if zone_id:
            results = [p for p in results if p["zone_id"] == zone_id]
        if horizon_minutes is not None:
            results = [p for p in results if p["horizon_minutes"] == horizon_minutes]
        if since:
            results = [p for p in results if p["generated_at"] >= since]

        return results


# Risk Scores Table Helpers
def update_risk_score(zone_id: UUID, risk_score: dict) -> None:
    with _lock:
        _risk_scores[zone_id] = risk_score


def get_latest_risk_scores(event_id: UUID) -> list[dict]:
    with _lock:
        event_zone_ids = {z["id"] for z in _zones.values() if z["event_id"] == event_id}
        return [score for zone_id, score in _risk_scores.items() if zone_id in event_zone_ids]


# Alerts Table Helpers
def add_alert(alert: dict) -> None:
    with _lock:
        _alerts[alert["id"]] = alert


def get_alert_by_id(alert_id: UUID) -> dict | None:
    with _lock:
        return _alerts.get(alert_id)


def update_alert(
    alert_id: UUID, status: str, notes: str | None = None, assignee: str | None = None
) -> dict | None:
    with _lock:
        if alert_id in _alerts:
            _alerts[alert_id]["status"] = status
            if notes is not None:
                _alerts[alert_id]["notes"] = notes
            if assignee is not None:
                _alerts[alert_id]["assignee"] = assignee
            return _alerts[alert_id]
        return None


def get_alerts(
    event_id: UUID,
    status: str | None = None,
    severity: str | None = None,
    zone_id: UUID | None = None,
) -> list[dict]:
    with _lock:
        event_zone_ids = {z["id"] for z in _zones.values() if z["event_id"] == event_id}
        results = [a for a in _alerts.values() if a["zone_id"] in event_zone_ids]

        if status:
            results = [a for a in results if a["status"] == status]
        if severity:
            results = [a for a in results if a["severity"] == severity]
        if zone_id:
            results = [a for a in results if a["zone_id"] == zone_id]

        return results


# Guidance Table Helpers
def add_guidance(guidance_record: dict) -> None:
    with _lock:
        _guidance.append(guidance_record)


def get_guidance_for_alert(alert_id: UUID, audience_role: str) -> dict | None:
    with _lock:
        for g in _guidance:
            if g["alert_id"] == alert_id and g["audience_role"] == audience_role:
                return g
        return None


# Feedback Table Helpers
def add_feedback(feedback_record: dict) -> None:
    with _lock:
        _feedback.append(feedback_record)


def get_all_feedback() -> list[dict]:
    with _lock:
        return list(_feedback)


def clear_database() -> None:
    """Utility to reset dynamic database state in tests."""
    with _lock:
        _measurements.clear()
        _predictions.clear()
        _risk_scores.clear()
        _alerts.clear()
        _guidance.clear()
        _feedback.clear()
