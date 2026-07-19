def get_transport_decisions() -> list[dict]:
    """Generates transportation optimization plans matching passenger arrival waves."""
    return [
        {
            "id": "dec_trans_001",
            "agent": "Transport Agent",
            "action": "INCREASE_SHUTTLE_FREQUENCY",
            "target": "North Metro Station",
            "confidence": 89,
            "reason": "Arrival wave of 800 passengers predicted in 15 minutes",
            "expectedImpact": "Metro station queue transit delay reduced by 14 minutes",
        }
    ]
