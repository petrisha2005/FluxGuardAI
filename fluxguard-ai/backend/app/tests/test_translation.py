from datetime import UTC, datetime
from uuid import UUID, uuid4

import pytest

from app.core import database
from app.services.guidance import generate_guidance_for_alert

SEED_ZONE_ID = UUID("00000000-0000-0000-0000-000000000001")


@pytest.fixture(autouse=True)
def setup_mock_alert():
    database.clear_database()
    alert_record = {
        "id": uuid4(),
        "zone_id": SEED_ZONE_ID,
        "severity": "high",
        "status": "unacknowledged",
        "title": "North Gate congestion",
        "description": "High accumulation at North Gate",
        "timestamp": datetime.now(UTC),
        "assignee": None,
        "notes": None,
    }
    database.add_alert(alert_record)
    return alert_record


def test_guidance_translations_spanish(setup_mock_alert):
    alert = setup_mock_alert

    # Fan guidance translation test (triggers fallback block)
    record = generate_guidance_for_alert(
        alert_id=alert["id"],
        audience_role="fan",
        language="es",
        force_fallback=True,
    )

    assert "Precaución: congestión de ruta" in record["headline"]
    assert "Espere movimiento lento" in record["payload"]["shortMessage"]
    assert "Siga las señales" in record["payload"]["recommendedRoute"]


def test_guidance_translations_french(setup_mock_alert):
    alert = setup_mock_alert

    record = generate_guidance_for_alert(
        alert_id=alert["id"],
        audience_role="fan",
        language="fr",
        force_fallback=True,
    )

    assert "Attention : congestion des itinéraires" in record["headline"]
    assert "Attendez-vous à un mouvement lent" in record["payload"]["shortMessage"]
    assert "Suivre les panneaux" in record["payload"]["recommendedRoute"]


def test_guidance_translations_german(setup_mock_alert):
    alert = setup_mock_alert

    record = generate_guidance_for_alert(
        alert_id=alert["id"],
        audience_role="fan",
        language="de",
        force_fallback=True,
    )

    assert "Achtung: Routenüberlastung" in record["headline"]
    assert "Erwarten Sie langsame Bewegung" in record["payload"]["shortMessage"]
    assert "Folgen Sie den Schildern" in record["payload"]["recommendedRoute"]
