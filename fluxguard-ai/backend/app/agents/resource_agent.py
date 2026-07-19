def get_resource_decisions() -> list[dict]:
    """Generates staffing reallocation recommendations based on density stresses."""
    return [
        {
            "id": "dec_res_001",
            "agent": "Resource Agent",
            "action": "ASSIGN_STAFF",
            "target": "Gate C Concourse",
            "confidence": 91,
            "reason": "Staff count below safe threshold for density projection",
            "expectedImpact": "Relocate 5 security stewards from West Entrance",
        }
    ]
