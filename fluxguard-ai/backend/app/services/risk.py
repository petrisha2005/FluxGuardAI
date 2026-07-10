from datetime import UTC, datetime
from uuid import UUID, uuid4

from app.core import database


def calculate_zone_risk_score(
    predicted_density: int, predicted_queue: int
) -> tuple[int, str, list[str]]:
    """Calculates risk score, severity band, and active risk drivers."""
    # Score is weighted primarily by density, secondary by queue length
    score = max(predicted_density, min(100, int(predicted_queue / 4)))

    drivers = []
    if predicted_density > 85:
        drivers.append("Critical crowd density threshold exceeded")
    elif predicted_density > 65:
        drivers.append("Elevated crowd density forecast")
    elif predicted_density > 50:
        drivers.append("Moderate crowd accumulation")

    if predicted_queue > 250:
        drivers.append("Critical queue backup forecast")
    elif predicted_queue > 150:
        drivers.append("Extended queue lengths detected")

    if not drivers:
        drivers.append("Normal crowd flow baseline")

    # Severity bands matching docs/ML_PIPELINE.md:
    # 0-39: low, 40-64: medium, 65-84: high, 85-100: critical
    if score >= 85:
        severity = "critical"
    elif score >= 65:
        severity = "high"
    elif score >= 40:
        severity = "medium"
    else:
        severity = "low"

    return score, severity, drivers


def get_recommendation_for_severity(zone_name: str, severity: str) -> str:
    """Returns a deterministic operational recommendation based on risk severity."""
    if severity == "critical":
        return f"Immediately halt incoming flow and redirect visitors away from {zone_name}."
    if severity == "high":
        return f"Redirect incoming visitors to lower-density zones near {zone_name}."
    if severity == "medium":
        return f"Monitor {zone_name} closely and prepare volunteer support."
    return f"Maintain standard monitoring for {zone_name}."


def evaluate_and_score_risks(event_id: UUID, predictions: list[dict]) -> list[dict]:
    """Evaluates prediction forecasts, updates zone risk scores, and spawns alerts."""
    generated_at = datetime.now(UTC)
    zones = database.get_zones_for_event(event_id)
    updated_scores = []

    for zone in zones:
        zone_id = zone["id"]
        zone_predictions = [p for p in predictions if p["zone_id"] == zone_id]

        if not zone_predictions:
            continue

        # Evaluate risk across all horizons; pick the highest risk horizon
        worst_score = -1
        worst_severity = "low"
        worst_drivers = []
        worst_horizon = 20

        for p in zone_predictions:
            score, severity, drivers = calculate_zone_risk_score(
                p["predicted_density"], p["predicted_queue_length"]
            )
            if score > worst_score:
                worst_score = score
                worst_severity = severity
                worst_drivers = drivers
                worst_horizon = p["horizon_minutes"]

        risk_record = {
            "zone_id": zone_id,
            "risk_score": worst_score,
            "severity": worst_severity,
            "drivers": worst_drivers,
            "prediction_horizon_minutes": worst_horizon,
            "generated_at": generated_at,
        }

        database.update_risk_score(zone_id, risk_record)
        updated_scores.append(risk_record)

        # Trigger alert if severity is High or Critical
        if worst_severity in {"high", "critical"}:
            # Check if there's already an active (unacknowledged/acknowledged) alert for this zone
            existing_alerts = database.get_alerts(event_id=event_id, zone_id=zone_id)
            active_alerts = [
                a for a in existing_alerts if a["status"] in {"unacknowledged", "acknowledged"}
            ]

            if not active_alerts:
                recommendation = get_recommendation_for_severity(zone["name"], worst_severity)
                alert_record = {
                    "id": uuid4(),
                    "zone_id": zone_id,
                    "severity": worst_severity,
                    "status": "unacknowledged",
                    "title": f"{zone['name']} congestion forecast",
                    "description": f"{worst_drivers[0]}. {recommendation}",
                    "timestamp": generated_at,
                    "assignee": None,
                    "notes": None,
                }
                database.add_alert(alert_record)

    return updated_scores
