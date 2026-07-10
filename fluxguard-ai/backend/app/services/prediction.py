from datetime import UTC, datetime
from uuid import UUID, uuid4

from app.core import database


def generate_mock_predictions(
    zone_id: UUID,
    current_density: int,
    current_queue: int,
    current_flow: int,
    generated_at: datetime,
) -> list[dict]:
    """Generates mock forecasts for 20, 30, and 40-minute horizons based on current zone signals."""
    predictions = []
    horizons = [20, 30, 40]

    for horizon in horizons:
        # Simple simulation projection logic
        ratio = horizon / 20.0
        predicted_density = min(100, max(0, int(current_density + (current_flow * 0.08) * ratio)))
        predicted_queue = min(500, max(0, int(current_queue + (current_flow * 0.2) * ratio)))
        predicted_flow = min(200, max(10, int(current_flow - 1.5 * ratio)))

        low_ci = max(0.0, predicted_density - 2.5 * ratio)
        high_ci = min(100.0, predicted_density + 2.5 * ratio)

        predictions.append(
            {
                "id": uuid4(),
                "zone_id": zone_id,
                "horizon_minutes": horizon,
                "predicted_density": predicted_density,
                "predicted_queue_length": predicted_queue,
                "predicted_flow_rate": predicted_flow,
                "confidence_interval_low": low_ci,
                "confidence_interval_high": high_ci,
                "generated_at": generated_at,
                "model_version": "prophet-mvp-v1.0",
            }
        )

    return predictions


def run_prediction_cycle(event_id: UUID) -> list[dict]:
    """Runs a forecast generation run over all zones in the active event."""
    generated_at = datetime.now(UTC)
    zones = database.get_zones_for_event(event_id)
    all_predictions = []

    # Get latest measurements for each zone
    measurements = database.get_all_measurements()

    for zone in zones:
        zone_id = zone["id"]
        # Find latest measurement
        zone_measurements = [m for m in measurements if m["zone_id"] == zone_id]
        if zone_measurements:
            latest = max(zone_measurements, key=lambda m: m["measured_at"])
            density = latest["density_count"]
            queue = latest["queue_length"]
            flow = latest["flow_rate_per_minute"]
        else:
            # Baseline fallbacks (approximate standard values based on zone capacity)
            density = 50
            queue = 80
            flow = 30

        predictions = generate_mock_predictions(
            zone_id=zone_id,
            current_density=density,
            current_queue=queue,
            current_flow=flow,
            generated_at=generated_at,
        )

        for p in predictions:
            database.add_prediction(p)
            all_predictions.append(p)

    return all_predictions
