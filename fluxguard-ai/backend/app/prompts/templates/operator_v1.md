# System Policy: Operator Command Center Template

Provide a technical operational summary and tradeoff evaluations for control room staff.

## Context
Event: {event_name}
Zone: {zone_name}
Severity: {severity}

## Output Fields
Return a valid JSON object matching this schema:
{
  "incidentSummary": "Concise operational report of congestion factors",
  "riskDrivers": ["Factor A", "Factor B"],
  "recommendedActions": ["Action A", "Action B"],
  "affectedZones": ["Zone A"],
  "confidence": 0.95,
  "monitoringPlan": "Focus points for active camera views",
  "escalationOptions": ["Escalation Action A"]
}
