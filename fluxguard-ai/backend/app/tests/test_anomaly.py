from datetime import UTC, datetime, timedelta
from uuid import UUID, uuid4

import pytest

from app.core import database
from app.services.risk import evaluate_and_score_risks

SEED_EVENT_ID = UUID("e0000000-0000-0000-0000-000000000000")
SEED_ZONE_ID = UUID("00000000-0000-0000-0000-000000000001")


@pytest.fixture(autouse=True)
def setup_mock_data():
    database.clear_database()
    # Create seed venue, event and zone if they don't exist
    # (database initialization seeds Lucusa Stadium and 4 zones by default)
    yield
    database.clear_database()


def test_surge_anomaly_triggers_alert():
    # Capacity for SEED_ZONE_ID is 2000
    # First measurement at 40% (800 visitors)
    m1 = {
        "id": uuid4(),
        "zone_id": SEED_ZONE_ID,
        "measured_at": datetime.now(UTC) - timedelta(minutes=5),
        "density_count": 800,
        "flow_rate_per_minute": 50,
        "queue_length": 30,
        "source_type": "simulator",
        "confidence": 0.9,
        "ingested_at": datetime.now(UTC) - timedelta(minutes=5),
    }
    database.add_measurement(m1)

    # Second measurement (spikes to 65% - 1300 visitors, a 25% surge)
    m2 = {
        "id": uuid4(),
        "zone_id": SEED_ZONE_ID,
        "measured_at": datetime.now(UTC),
        "density_count": 1300,
        "flow_rate_per_minute": 120,
        "queue_length": 60,
        "source_type": "simulator",
        "confidence": 0.95,
        "ingested_at": datetime.now(UTC),
    }
    database.add_measurement(m2)

    # Mock predictions list to pass to evaluate_and_score_risks
    predictions = [
        {
            "zone_id": SEED_ZONE_ID,
            "horizon_minutes": 20,
            "predicted_density": 65,
            "predicted_queue_length": 60,
            "predicted_flow_rate": 120,
            "confidence_interval_low": 60.0,
            "confidence_interval_high": 70.0,
            "generated_at": datetime.now(UTC),
            "model_version": "test",
        }
    ]

    # Run scoring cycle
    evaluate_and_score_risks(SEED_EVENT_ID, predictions)

    # Check alerts in database
    alerts = database.get_alerts(event_id=SEED_EVENT_ID)
    anomaly_alerts = [a for a in alerts if a["title"].startswith("Sudden crowd surge anomaly")]

    assert len(anomaly_alerts) == 1
    assert anomaly_alerts[0]["severity"] == "critical"
    assert "density spiked by 25%" in anomaly_alerts[0]["description"]
