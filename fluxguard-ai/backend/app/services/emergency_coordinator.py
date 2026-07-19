def dispatch_resources(incident_description: str) -> dict:
    """Coordinates and returns structured response actions across police, medical, fire, and operations staff."""
    desc = incident_description.lower()

    if "medical" in desc or "ambulance" in desc or "injury" in desc:
        return {
            "incident": incident_description,
            "priority": "HIGH",
            "actions": [
                "Dispatch ambulance unit 3 to Gate C perimeter checkpoint",
                "Redirect pedestrian egress flow to bypass corridor",
                "Deploy 4 nearby volunteers to manage perimeter access",
                "Notify security operations supervisor",
            ],
            "assignedResources": {
                "medical": ["Ambulance Unit 3"],
                "operationsStaff": ["4 Volunteers"],
                "security": ["Supervisor Alerted"],
            },
        }

    elif "fire" in desc or "smoke" in desc or "alarm" in desc:
        return {
            "incident": incident_description,
            "priority": "CRITICAL",
            "actions": [
                "Dispatch local stadium fire response team 1 to source",
                "Initialize egress emergency alarm digital signage warnings",
                "Direct stewards to clear evacuation paths immediately",
                "Coordinate police traffic control blocks for emergency vehicle routes",
            ],
            "assignedResources": {
                "fire": ["Response Team 1"],
                "operationsStaff": ["Egress Stewards"],
                "police": ["Traffic Blocks Unit"],
            },
        }

    elif "fight" in desc or "crowd" in desc or "altercation" in desc or "security" in desc:
        return {
            "incident": incident_description,
            "priority": "HIGH",
            "actions": [
                "Deploy 6 tactical security stewards to resolve altercation",
                "Initialize CCTV tracking feed centering on incident zone",
                "Coordinate stadium exit gates flow to mitigate crowd pressure",
            ],
            "assignedResources": {
                "security": ["6 Stewards", "CCTV Monitor"],
                "police": ["Standby Notification"],
            },
        }

    # Fallback default coordination
    return {
        "incident": incident_description,
        "priority": "MEDIUM",
        "actions": [
            "Log incident parameters in operations log database",
            "Instruct nearest roaming steward patrol unit to verify situation",
            "Monitor live camera feeds of the zone",
        ],
        "assignedResources": {
            "operationsStaff": ["1 Roaming Steward"],
        },
    }
