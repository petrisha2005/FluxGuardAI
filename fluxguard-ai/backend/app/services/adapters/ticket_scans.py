import logging
import random
from datetime import datetime

logger = logging.getLogger(__name__)


def get_ticket_scan_rates() -> dict:
    """Simulates active ticket turnstiles scan rates across stadium gates.

    Includes robust try/except safeguards to prevent divide-by-zero or system crashes.
    """
    try:
        # Seed based on current minute/second to ensure deterministic but varying rates
        random.seed(datetime.now().second)  # noqa: S311

        total_scans = random.randint(80, 240)  # noqa: S311
        active_turnstiles = 16

        avg_scans = round(total_scans / active_turnstiles, 1) if active_turnstiles > 0 else 0.0

        return {
            "total_scans_last_minute": total_scans,
            "active_turnstiles": active_turnstiles,
            "average_scans_per_turnstile": avg_scans,
            "status": "normal" if total_scans < 200 else "high_traffic",
        }
    except Exception as e:
        logger.error(f"Error resolving ticketing telemetry: {e}")
        return {
            "total_scans_last_minute": 0,
            "active_turnstiles": 0,
            "average_scans_per_turnstile": 0.0,
            "status": "normal",
        }
