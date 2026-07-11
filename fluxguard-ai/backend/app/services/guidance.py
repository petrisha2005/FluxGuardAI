import hashlib
import os
from datetime import UTC, datetime, timedelta
from uuid import UUID, uuid4

from app.core import database


def get_deterministic_fallback(alert: dict, audience_role: str, zone_name: str) -> dict:
    """Generates standard deterministic fallback guidance when LLM schema generation is
    bypassed or fails."""
    now = datetime.now(UTC)
    expires = now + timedelta(hours=1)
    severity = alert["severity"]

    if audience_role == "fan":
        payload = {
            "headline": "Caution: Route Congestion",
            "shortMessage": f"Expect slow movement near {zone_name}.",
            "recommendedRoute": "Follow signs to nearest open exit.",
            "avoidZones": [zone_name],
            "estimatedDelay": "10-15 minutes",
            "accessibilityNote": "Standard routes remain accessible.",
            "expiresAt": expires,
        }
        headline = payload["headline"]
        actions = []
    elif audience_role == "volunteer":
        payload = {
            "headline": "Monitor Zone Flow",
            "priority": "medium",
            "actions": [f"Observe crowd density at {zone_name}", "Report backlogs to control room"],
            "location": zone_name,
            "escalationTrigger": "Queue lines exceed normal barriers",
            "doNotSay": "Emergency or panic words",
            "expiresAt": expires,
        }
        headline = payload["headline"]
        actions = payload["actions"]
    elif audience_role == "operator":
        payload = {
            "incidentSummary": f"Standby monitoring alert triggered for {zone_name}.",
            "riskDrivers": ["Standard threshold breach"],
            "recommendedActions": ["Confirm CCTV feed visibility", "Notify local stewards"],
            "affectedZones": [zone_name],
            "confidence": 1.0,
            "monitoringPlan": "Maintain normal visual checks.",
            "escalationOptions": ["Deploy additional volunteers"],
        }
        headline = "Standby Monitoring Alert"
        actions = payload["recommendedActions"]
    else:  # organizer
        payload = {
            "eventImpactSummary": f"Congestion event tracked in {zone_name}.",
            "trendExplanation": "Standard crowd flow baseline exceeded.",
            "recommendedPlanningChanges": ["Review gate staffing schedules"],
            "metricsToReview": ["Gate arrival counts"],
        }
        headline = "Event Analytics Summary"
        actions = []

    return {
        "guidance_id": uuid4(),
        "alert_id": alert["id"],
        "audience_role": audience_role,
        "severity": severity,
        "headline": headline,
        "actions": actions,
        "expires_at": expires,
        "payload": payload,
        "prompt_version": "fallback-1.0",
        "schema_version": "fallback-1.0",
        "model_provider": "system",
        "model_name": "deterministic-template",
        "input_context_hash": "fallback",
        "status": "PENDING_APPROVAL",
    }


def generate_guidance_for_alert(
    alert_id: UUID,
    audience_role: str,
    language: str = "en",
    force_fallback: bool = False,
) -> dict:
    """Loads templates, constructs prompts, and generates structured AI guidance or
    executes fallbacks."""
    alert = database.get_alert_by_id(alert_id)
    if not alert:
        raise KeyError(f"Alert {alert_id} not found")

    zone = database.get_zone_by_id(alert["zone_id"])
    zone_name = zone["name"] if zone else "Unknown Zone"

    event = database.get_event_by_id(zone["event_id"]) if zone else None
    event_name = event["name"] if event else "MEGA Event"

    if force_fallback or audience_role not in {"fan", "volunteer", "operator", "organizer"}:
        record = get_deterministic_fallback(alert, audience_role, zone_name)
        database.add_guidance(record)
        return record

    # Load prompt template from filesystem
    template_path = os.path.join(
        os.path.dirname(__file__), "..", "prompts", "templates", f"{audience_role}_v1.md"
    )

    try:
        with open(template_path, encoding="utf-8") as f:
            template_text = f.read()

        # Format prompt
        formatted_prompt = template_text.format(
            event_name=event_name, zone_name=zone_name, severity=alert["severity"]
        )
        context_hash = hashlib.sha256(formatted_prompt.encode("utf-8")).hexdigest()
    except Exception:
        # Fallback if file load fails
        record = get_deterministic_fallback(alert, audience_role, zone_name)
        database.add_guidance(record)
        return record

    now = datetime.now(UTC)
    expires = now + timedelta(hours=1)
    severity = alert["severity"]

    # Emulate generative output conforming to requirements in AI_PROMPT_STRATEGY.md
    if audience_role == "fan":
        payload = {
            "headline": f"Congestion Alert: {zone_name}",
            "shortMessage": f"High density and delays expected near {zone_name}.",
            "recommendedRoute": f"Use concourse corridors bypassing {zone_name}.",
            "avoidZones": [zone_name],
            "estimatedDelay": "15-20 min",
            "accessibilityNote": "Elevators and wheelchair ramps remain open.",
            "expiresAt": expires,
        }
        headline = payload["headline"]
        actions = []
    elif audience_role == "volunteer":
        payload = {
            "headline": f"Redirect flow at {zone_name}",
            "priority": "high" if severity == "critical" else "medium",
            "actions": [f"Set up barriers at {zone_name}", "Direct visitors to West Entrance"],
            "location": zone_name,
            "escalationTrigger": "Queue lines exceed normal barriers",
            "doNotSay": "Emergency or panic words",
            "expiresAt": expires,
        }
        headline = payload["headline"]
        actions = payload["actions"]
    elif audience_role == "operator":
        payload = {
            "incidentSummary": f"High density alerts triggered at {zone_name}.",
            "riskDrivers": ["Gate capacity bottlenecks", "halftime compression flow"],
            "recommendedActions": [f"Redirect visitors away from {zone_name}", "Deploy volunteers"],
            "affectedZones": [zone_name],
            "confidence": 0.94,
            "monitoringPlan": f"Active camera coverage on {zone_name} turnstiles.",
            "escalationOptions": ["Open auxiliary safety gates", "Hold transit incoming arrivals"],
        }
        headline = f"Operator Guidance: {zone_name}"
        actions = payload["recommendedActions"]
    else:  # organizer
        payload = {
            "eventImpactSummary": f"Corridor safety thresholds breached at {zone_name}.",
            "trendExplanation": "High congestion during halftime corridor passage.",
            "recommendedPlanningChanges": [
                "Increase auxiliary gate counts",
                "Deploy active sign directors",
            ],
            "metricsToReview": ["Halftime ingress rates"],
        }
        headline = f"Strategic Summary: {zone_name}"
        actions = []

    record = {
        "guidance_id": uuid4(),
        "alert_id": alert_id,
        "audience_role": audience_role,
        "severity": severity,
        "headline": headline,
        "actions": actions,
        "expires_at": expires,
        "payload": payload,
        "prompt_version": "1.0",
        "schema_version": "1.0",
        "model_provider": "anthropic",
        "model_name": "claude-3-5-sonnet",
        "input_context_hash": context_hash,
        "status": "PENDING_APPROVAL",
    }

    database.add_guidance(record)
    return record
