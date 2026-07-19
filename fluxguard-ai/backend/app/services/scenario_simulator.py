def simulate_scenario(
    scenario_type: str, affected_zone: str | None = None, severity: str = "medium"
) -> dict:
    """Simulates what-if scenarios, returning impact assessments and operational recovery plans."""
    stype = scenario_type.lower()
    zone = affected_zone or "Gate C"

    if "close" in stype or "closure" in stype:
        return {
            "predictedImpact": f"Risk escalates to CRITICAL for {zone}; queue duration increases by +35% due to bottleneck compression.",
            "predicted_impact": f"Risk escalates to CRITICAL for {zone}; queue duration increases by +35% due to bottleneck compression.",
            "recoveryTime": "18 minutes",
            "recovery_time": "18 minutes",
            "recommendations": [
                "Open temporary auxiliary checkpoint at adjacent North Gate",
                f"Redeploy 8 security stewards from East Concourse to bypass {zone}",
            ],
        }

    elif "rain" in stype or "weather" in stype:
        return {
            "predictedImpact": "Heavy rain slows walkway egress speed by 12%; slip hazard risks in concourse sectors rise to HIGH.",
            "predicted_impact": "Heavy rain slows walkway egress speed by 12%; slip hazard risks in concourse sectors rise to HIGH.",
            "recoveryTime": "12 minutes",
            "recovery_time": "12 minutes",
            "recommendations": [
                "Enable slip-warning digital signs across all displays",
                "Deploy non-slip safety mats in primary concourse pathways",
            ],
        }

    elif "scanner" in stype or "capacity" in stype or "reduction" in stype:
        return {
            "predictedImpact": f"Scanner throughput drops by 30% at {zone}; local queue risk escalates from LOW to MEDIUM.",
            "predicted_impact": f"Scanner throughput drops by 30% at {zone}; local queue risk escalates from LOW to MEDIUM.",
            "recoveryTime": "10 minutes",
            "recovery_time": "10 minutes",
            "recommendations": [
                "Initialize fallback manual barcode ticket checks",
                f"Divert 15% of incoming queue streams away from {zone} turnstiles",
            ],
        }

    elif "evac" in stype or "emergency" in stype:
        return {
            "predictedImpact": "Emergency evacuation protocol activated. Zone density rises temporarily, queue delays surge +50% under egress pressure.",
            "predicted_impact": "Emergency evacuation protocol activated. Zone density rises temporarily, queue delays surge +50% under egress pressure.",
            "recoveryTime": "25 minutes",
            "recovery_time": "25 minutes",
            "recommendations": [
                "Open all emergency egress checkpoints immediately",
                "Broadcast audio exit guidance instructions through digital signage boards",
            ],
        }

    elif "staff" in stype or "availability" in stype:
        return {
            "predictedImpact": "Personnel count drops below threshold. Local monitoring response time scales up; overall risk climbs to HIGH.",
            "predicted_impact": "Personnel count drops below threshold. Local monitoring response time scales up; overall risk climbs to HIGH.",
            "recoveryTime": "15 minutes",
            "recovery_time": "15 minutes",
            "recommendations": [
                "Request immediate emergency standby volunteer support",
                "Concentrate remaining stewards at high density entry turnstiles",
            ],
        }

    # Default fallback scenario simulation
    return {
        "predictedImpact": f"Routine stress adjustment for {zone} simulated. Safe capacity limits maintained.",
        "predicted_impact": f"Routine stress adjustment for {zone} simulated. Safe capacity limits maintained.",
        "recoveryTime": "5 minutes",
        "recovery_time": "5 minutes",
        "recommendations": [
            "Monitor flow sensors",
            "Report metric changes on next simulator tick",
        ],
    }
