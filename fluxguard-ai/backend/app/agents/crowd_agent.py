def get_crowd_decisions() -> list[dict]:
    """Generates crowd control autonomous recommendations based on zone pressure thresholds."""
    return [
        {
            "id": "dec_crowd_001",
            "agent": "Crowd Control Agent",
            "action": "OPEN_GATE",
            "target": "Gate B",
            "confidence": 94,
            "reason": "Gate C density exceeds safety threshold (87%)",
            "expectedImpact": "Queue duration reduced by 28%",
        }
    ]
