import random
from datetime import datetime


def get_ticket_scan_rates() -> dict:
    """Simulates active ticket turnstiles scan rates across stadium gates."""
    # Seed based on current minute/second to ensure deterministic but varying rates
    random.seed(datetime.now().second)  # noqa: S311

    total_scans = random.randint(80, 240)  # noqa: S311
    active_turnstiles = 16

    return {
        "total_scans_last_minute": total_scans,
        "active_turnstiles": active_turnstiles,
        "average_scans_per_turnstile": round(total_scans / active_turnstiles, 1),
        "status": "normal" if total_scans < 200 else "high_traffic",
    }
