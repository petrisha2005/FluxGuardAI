def assess_camera_feed(camera_id: str, zone: str, estimated_people: int, density: str) -> dict:
    """Simulates CCTV camera count and returns dynamic risk assessments."""
    d_level = density.lower()

    # Calculate a risk score based on density count
    if estimated_people >= 3000 or "high" in d_level:
        risk_level = "CRITICAL"
        risk_score = 88
        abnormal_movement = True
        recommendation = "Initialize secondary egress checkpoints and verify ticket scanners logs"
    elif estimated_people >= 1500 or "medium" in d_level:
        risk_level = "MEDIUM"
        risk_score = 54
        abnormal_movement = False
        recommendation = "Deploy roaming concourse security stewards"
    else:
        risk_level = "LOW"
        risk_score = 22
        abnormal_movement = False
        recommendation = "Routine gate ingress surveillance monitoring"

    return {
        "cameraId": camera_id,
        "zone": zone,
        "estimatedPeople": estimated_people,
        "density": density.upper(),
        "riskLevel": risk_level,
        "riskScore": risk_score,
        "abnormalMovementDetected": abnormal_movement,
        "operationalRecommendation": recommendation,
    }
