def get_safety_decisions() -> list[dict]:
    """Generates safety signage routing alerts for exit bottleneck regions."""
    return [
        {
            "id": "dec_safe_001",
            "agent": "Safety Agent",
            "action": "UPDATE_SIGNAGE",
            "target": "All Exit Signage Displays",
            "confidence": 95,
            "reason": "Egress pathways congestion forecast",
            "expectedImpact": "Displays detour exit pathways vectors",
        }
    ]
