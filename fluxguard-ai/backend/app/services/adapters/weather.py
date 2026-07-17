import logging
from datetime import datetime

logger = logging.getLogger(__name__)


def get_current_weather() -> dict:
    """Simulates live weather checks cycling through Clear, Rainy, and Stormy states.

    Includes robust try/except safeguards to prevent system crashes during API issues.
    """
    try:
        minute = datetime.now().minute

        if minute % 3 == 0:
            return {
                "status": "rainy",
                "exit_rate_modifier": 0.6,
                "description": "Rainy - shelter behavior in concourses",
                "temperature_celsius": 17.5,
            }
        elif minute % 3 == 1:
            return {
                "status": "stormy",
                "exit_rate_modifier": 0.4,
                "description": "Storm warning - movement speed reduced by 60%",
                "temperature_celsius": 14.0,
            }
        else:
            return {
                "status": "clear",
                "exit_rate_modifier": 1.0,
                "description": "Clear sky - standard flow speeds apply",
                "temperature_celsius": 22.0,
            }
    except Exception as e:
        logger.error(f"Error resolving weather telemetry: {e}")
        return {
            "status": "clear",
            "exit_rate_modifier": 1.0,
            "description": "Clear sky (telemetry fallback)",
            "temperature_celsius": 20.0,
        }
