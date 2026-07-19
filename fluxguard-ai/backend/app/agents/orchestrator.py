from app.agents import crowd_agent, emergency_agent, resource_agent, safety_agent, transport_agent


def get_all_pending_decisions() -> list[dict]:
    """Coordinates and aggregates pending recommendations from all autonomous agent instances."""
    return (
        crowd_agent.get_crowd_decisions()
        + emergency_agent.get_emergency_decisions()
        + transport_agent.get_transport_decisions()
        + resource_agent.get_resource_decisions()
        + safety_agent.get_safety_decisions()
    )


def create_unified_action_plan() -> dict:
    """Consolidates cross-agent metrics into a single high-priority operations directive."""
    decisions = get_all_pending_decisions()

    actions_list = []
    highest_priority = "LOW"

    for d in decisions:
        actions_list.append(f"{d['action']} target {d['target']}: {d['reason']}")
        if d["confidence"] >= 95:
            highest_priority = "HIGH"
        elif d["confidence"] >= 90 and highest_priority != "HIGH":
            highest_priority = "MEDIUM"

    return {
        "priority": highest_priority,
        "actions": actions_list,
        "confidenceAvg": (
            sum(d["confidence"] for d in decisions) // len(decisions) if decisions else 90
        ),
    }
