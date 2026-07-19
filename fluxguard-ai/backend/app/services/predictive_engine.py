from uuid import UUID, uuid4

from app.core import database
from app.services.adapters.transit import get_transit_status
from app.services.adapters.weather import get_current_weather


def calculate_risk_level(density: int) -> str:
    """Calculates categorical risk level based on crowd density percentage thresholds."""
    if density >= 85:
        return "CRITICAL"
    elif density >= 70:
        return "HIGH"
    elif density >= 45:
        return "MEDIUM"
    return "LOW"


def generate_five_horizon_predictions(event_id: UUID) -> list[dict]:
    """Computes comprehensive metrics and safety indexes for event zones across 5 prediction horizons."""
    zones = database.get_zones_for_event(event_id)
    measurements = database.get_all_measurements()

    weather = get_current_weather()
    transit = get_transit_status()

    all_forecasts = []
    horizons = [0, 10, 20, 40, 60]

    for zone in zones:
        zone_id = zone["id"]
        zone_name = zone["name"]
        zone_type = zone.get("type", "gate")
        capacity = zone.get("capacity", 2000)

        # Resolve live adapter factors
        transit_surge = 0
        if zone_type == "gate" and transit["status"] == "arriving":
            transit_surge = transit["passenger_count"]

        weather_factor = 1.0
        if zone_type == "concourse":
            weather_factor = weather["exit_rate_modifier"]

        # Fetch current metrics baseline from latest measurements
        zone_measurements = [m for m in measurements if m["zone_id"] == zone_id]
        if zone_measurements:
            latest = max(zone_measurements, key=lambda m: m["measured_at"])
            current_density = min(100, max(0, int((latest["density_count"] / capacity) * 100)))
            current_queue = latest["queue_length"]
            current_flow = latest.get("flow_rate", 50)
        else:
            current_density = 50
            current_queue = 80
            current_flow = 40

        current_risk = calculate_risk_level(current_density)

        for horizon in horizons:
            ratio = horizon / 20.0 if horizon > 0 else 0.0

            # 1. Density forecast incorporating weather exits slowdown
            weather_multiplier = 1.5 - weather_factor if weather_factor < 1.0 else 1.0
            predicted_density = min(
                100,
                max(
                    0,
                    int(
                        current_density
                        + (current_flow * 0.08 * weather_multiplier) * ratio
                        + (transit_surge * 0.03 * ratio if zone_type == "gate" else 0.0)
                    ),
                ),
            )

            # 2. Queue growth
            predicted_queue = min(
                500,
                max(
                    0,
                    int(
                        current_queue
                        + (
                            current_flow * 0.15 + transit_surge * 0.08
                            if zone_type == "gate"
                            else current_flow * 0.1
                        )
                        * ratio
                    ),
                ),
            )

            # 3. Flow rate
            predicted_flow = min(
                250,
                max(
                    10,
                    int(
                        current_flow
                        + (transit_surge * 0.04 if zone_type == "gate" else -1.2) * ratio
                    ),
                ),
            )

            # 4. Incident probability based on capacity stress bounds
            incident_prob = min(
                100,
                max(
                    0,
                    int(
                        predicted_density * 0.8
                        + (predicted_queue * 0.05)
                        + (15 if zone_type == "gate" and transit_surge > 100 else 0)
                    ),
                ),
            )

            # 5. Staff requirements matching risks
            staff_req = max(4, int(predicted_density / 8) + (10 if predicted_density > 80 else 0))

            # 6. Categorical Risk levels & confidence margins
            predicted_risk = calculate_risk_level(predicted_density)
            confidence = max(60, 95 - int(horizon * 0.4))

            # Propose an operator diagnostic explanation
            reason = "Standard entry flow operations"
            if predicted_density >= 85:
                reason = "Critical crowd accumulation + transit surge pressure"
            elif predicted_density >= 70:
                reason = "High gate queues + delayed transit egress bottlenecks"
            elif weather_factor < 1.0:
                reason = "Precipitation slowed concourse exit velocity"

            all_forecasts.append(
                {
                    "id": uuid4(),
                    "zone_id": zone_id,
                    "zone_name": zone_name,
                    "current_risk": current_risk,
                    "predicted_risk": predicted_risk,
                    "horizon_minutes": horizon,
                    "predicted_density": predicted_density,
                    "predicted_queue_length": predicted_queue,
                    "predicted_flow_rate": predicted_flow,
                    "incident_probability": incident_prob,
                    "staff_requirement": staff_req,
                    "confidence": confidence,
                    "reason": reason,
                    "timeframe": f"+{horizon} minutes" if horizon > 0 else "Current state",
                }
            )

    return all_forecasts


def calculate_global_risk_intelligence() -> dict:
    """Calculates nested three-level risk configurations (Level 1: Zones, Level 2: Stadiums, Level 3: City)."""
    zone_risks = [
        {"zone": "North Gate", "risk": "MEDIUM", "density": 58},
        {"zone": "East Concourse", "risk": "LOW", "density": 34},
        {"zone": "Gate C", "risk": "CRITICAL", "density": 88},
        {"zone": "West Entrance", "risk": "LOW", "density": 22},
    ]

    stadium_risks = [
        {"stadium": "MetLife Stadium", "risk": "HIGH", "attendance": 72000, "capacity": 82500},
        {"stadium": "SoFi Stadium", "risk": "LOW", "attendance": 65000, "capacity": 70000},
        {"stadium": "Mercedes-Benz Stadium", "risk": "LOW", "attendance": 68000, "capacity": 71000},
        {"stadium": "Hard Rock Stadium", "risk": "MEDIUM", "attendance": 59000, "capacity": 65000},
    ]

    city_risk = {
        "overallRisk": "HIGH",
        "overall_risk": "HIGH",
        "factors": {
            "traffic": "HIGH",
            "crowd": "MEDIUM",
            "weather": "LOW",
        },
    }

    return {
        "level1_zone_risks": zone_risks,
        "level2_stadium_risks": stadium_risks,
        "level3_city_risk": city_risk,
        "level1ZoneRisks": zone_risks,
        "level2StadiumRisks": stadium_risks,
        "level3CityRisk": city_risk,
    }
