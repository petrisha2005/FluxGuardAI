from uuid import UUID

from app.core import database


def generate_routing_recommendations(event_id: UUID) -> list[dict]:
    """
    Simulates a reinforcement learning agent calculating optimal crowd detour routes.
    It identifies congested gate areas and matches them with underutilized gates.
    """
    zones = database.get_zones_for_event(event_id)
    gates = [z for z in zones if z["type"] == "gate"]

    if len(gates) < 2:
        return []

    # Find the gate with highest queue length
    congested_gate = max(gates, key=lambda g: g.get("queue_length", 0) or 0)
    congested_queue = congested_gate.get("queue_length", 0) or 0

    # Find the gate with lowest queue length/density
    available_gates = [g for g in gates if g["id"] != congested_gate["id"]]
    if not available_gates:
        return []

    target_gate = min(available_gates, key=lambda g: g.get("queue_length", 0) or 0)

    # Generate recommendation if queue backlog exceeds a warning threshold
    if congested_queue > 120:
        return [
            {
                "source_zone_id": congested_gate["id"],
                "target_zone_id": target_gate["id"],
                "reason": f"High queue backlog ({congested_queue} people) detected at {congested_gate['name']}. Reroute incoming pedestrian flow to {target_gate['name']} to balance transit pressure.",
                "delay_reduction_minutes": max(4, round(congested_queue / 18)),
                "confidence": 0.92,
                "relief_time_minutes": max(5, round(congested_queue / 24)),
            }
        ]

    return []
