def get_emergency_decisions() -> list[dict]:
    """Generates emergency response plans prioritizing medical and safety alarms."""
    return [
        {
            "id": "dec_emg_001",
            "agent": "Emergency Response Agent",
            "action": "DISPATCH_MEDICAL",
            "target": "Gate C Medical Incident",
            "confidence": 98,
            "reason": "Active unacknowledged medical warning",
            "expectedImpact": "Ambulance response time decreased by 5 minutes",
            "plan": [
                "Dispatch ambulance unit 3 to the zone perimeter",
                "Clear pedestrian egress corridor flow paths",
                "Deploy 4 volunteers to manage access boundaries",
                "Notify security operations supervisor",
            ],
        }
    ]
