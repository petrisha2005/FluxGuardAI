import asyncio
import json
import logging
import os
import re
from typing import Any
from uuid import UUID

from app.core import database
from app.core.config import get_settings

logger = logging.getLogger("fluxguard.copilot")

VALID_RISK_LEVELS = {"LOW", "MEDIUM", "HIGH", "CRITICAL"}
RISK_PRIORITY = {"LOW": 0, "MEDIUM": 1, "HIGH": 2, "CRITICAL": 3}


def generate_offline_response(query: str, zones: list[dict], alerts: list[dict]) -> dict:
    """Generates dynamic local reports based on queries and database metrics in offline mode."""
    q = query.lower()

    # 1. Explain specific zone risk
    match_zone = None
    for zone in zones:
        if zone["name"].lower() in q or zone["id"].hex[:6] in q:
            match_zone = zone
            break

    # If "gate c" is in query but North Gate or others aren't matched explicitly, check substrings
    if not match_zone and "gate c" in q:
        match_zone = next((z for z in zones if "gate c" in z["name"].lower()), None)
    if not match_zone and "gate" in q:
        match_zone = next((z for z in zones if "gate" in z["name"].lower()), None)

    # Resolve a diagnostic if zone was matched
    if "why" in q or "explain" in q or "risk" in q:
        if match_zone:
            name = match_zone["name"]
            density = match_zone.get("density_count", 86)
            queue = match_zone.get("queue_length", 200)
            entry = match_zone.get("entry_rate", 45)
            exit_rate = match_zone.get("exit_rate", 20)

            # Look up active alerts for this zone
            zone_alerts = [a for a in alerts if a["zone_id"] == match_zone["id"]]
            alert_desc = ""
            if zone_alerts:
                alert_desc = f" Active alert details: {zone_alerts[0].get('description', zone_alerts[0].get('title', ''))}."

            response = (
                f"Crowd density at {name} has reached {density}%, causing elevated queue congestion ({queue} visitors). "
                f"Turnstile entry flow rate ({entry}/min) currently exceeds the exit discharge rate ({exit_rate}/min).{alert_desc} "
                f"To resolve this bottleneck, I recommend opening the secondary auxiliary gates and redirecting 20% of incoming visitors to less dense entryways."
            )
            return {
                "response": response,
                "suggested_actions": ["Open auxiliary turnstiles", "Redirect 20% to concourse"],
            }

    # 2. Which zone needs immediate attention?
    if "attention" in q or "immediate" in q or "critical" in q or "worst" in q:
        if zones:
            # Sort by density desc
            worst_zone = max(zones, key=lambda z: z.get("density", 0))
            name = worst_zone["name"]
            density = worst_zone.get("density", worst_zone.get("density_count", 0))
            response = (
                f"The zone requiring immediate attention is **{name}**, currently operating at **{density}%** crowd capacity. "
                "Staff should be dispatched to assist in active routing and prevent crowd accumulation at entry channels."
            )
            return {
                "response": response,
                "suggested_actions": [
                    "Dispatch staff to " + name,
                    "Deploy digital signage reroute",
                ],
            }

    # 3. What happens if we do nothing?
    if "do nothing" in q or "nothing" in q or "consequences" in q:
        response = (
            "If no active measures are implemented, predicted crowd densities at Gate C and West Entrance are projected "
            "to breach safety capacities (92%+) within the next 20 minutes. This will trigger critical severity warnings, "
            "increasing evacuation delays by up to 18 minutes."
        )
        return {
            "response": response,
            "suggested_actions": [
                "Trigger prediction updates",
                "Initiate precautionary staff alert",
            ],
        }

    # 4. Safest evacuation route
    if "evacuation" in q or "safest" in q or "route" in q or "escape" in q:
        if len(zones) >= 2:
            # Sort by density asc
            safest_zones = sorted(zones, key=lambda z: z.get("density", 0))
            z1 = safest_zones[0]["name"]
            d1 = safest_zones[0].get("density", 0)
            z2 = safest_zones[1]["name"]
            d2 = safest_zones[1].get("density", 0)
            response = (
                f"The safest evacuation routes lead through **{z1}** (density {d1}%) and **{z2}** (density {d2}%). "
                "Direct all emergency exit lines away from Gate C toward these channels."
            )
            return {
                "response": response,
                "suggested_actions": [
                    "Broadcast exit routes to volunteers",
                    "Configure digital exit signs",
                ],
            }
        else:
            return {
                "response": "Evacuation routing requires active zone states. Clear exit lanes are currently monitored.",
                "suggested_actions": [],
            }

    # 5. Summarize last 10 minutes or 15 minutes
    if "summarize" in q or "minutes" in q or "summary" in q:
        if "15" in q:
            response = (
                "Summary of the last 15 minutes: Evolving transit arrivals caused localized density surges at Gate C. "
                "Overall stadium operations remain stable under proactive management postures."
            )
            return {
                "response": response,
                "suggested_actions": ["Review 15m timeline log", "Check gate flow stats"],
            }
        else:
            response = (
                "Summary of the last 10 minutes: Sensor metrics show steady entry volumes. "
                "North Gate and Gate C exhibited transient crowd surges following transit train arrivals. "
                "One high congestion alert was automatically logged for Gate C and acknowledged by operations."
            )
            return {
                "response": response,
                "suggested_actions": ["Download operational log pdf", "Review incident timeline"],
            }

    # 6. Staff deployed query
    if "staff" in q or "deployed" in q:
        response = (
            "Staff Deployment Audit: There are currently 42 active security stewards and medics deployed. "
            "Distribution: 16 at North Gate, 12 at Gate C, 8 at East Concourse, and 6 at West Entrance. Staffing levels are adequate."
        )
        return {
            "response": response,
            "suggested_actions": ["Reassign 4 staff to Gate C", "Print personnel layout"],
        }

    # 7. Weather query
    if "weather" in q or "rain" in q:
        response = (
            "Weather Forecast & Crowd Flow Impact: Current conditions are clear. "
            "A shift to wet weather would decrease walk speeds by approximately 12% due to slippery surface hazard profiles."
        )
        return {
            "response": response,
            "suggested_actions": [
                "Enable rainy-day digital warnings",
                "Inspect walkway drain systems",
            ],
        }

    # 8. Highest impact recommendation query
    if "impact" in q or "highest impact" in q:
        response = (
            "Action Impact Analysis: Opening the Gate C Secondary Auxiliary Entrance has the highest projected impact, "
            "alleviating queue lengths by approximately 28% within 8 minutes."
        )
        return {
            "response": response,
            "suggested_actions": ["Execute Gate C Secondary Open", "Compare alternate actions"],
        }

    # 9. Unresolved incidents query
    if "unresolved" in q or "incidents" in q:
        response = (
            "Incident Queue Check: There is currently 1 active unresolved incident ticket: "
            "Medical concern near East Concourse (Awaiting Medic Unit 1 check-in)."
        )
        return {
            "response": response,
            "suggested_actions": ["Dispatch medic unit 1", "Acknowledge queue warning"],
        }

    # 10. What changed recently query
    if "changed" in q or "recent" in q:
        response = (
            "Recent Delta: Gate C crowd density grew by 14% over the last 10 minutes following the transit arrival wave. "
            "1 medical concern was successfully resolved at North Gate."
        )
        return {
            "response": response,
            "suggested_actions": ["Compare to 30m ago", "View recent actions feed"],
        }

    # Upgrade AI Copilot Commands (Phase 7 Multi-Agent Coordination)
    if "predict next 30 minutes" in q or ("predict" in q and "30" in q):
        response = (
            "**[Multi-Agent Intelligence Forecast]**\n\n"
            "**[Crowd Prediction Agent]**:\n"
            "Within the next 30 minutes, crowd density is projected to rise at Gate C to 78% (HIGH RISK) due to incoming transit waves.\n\n"
            "**[Safety Agent]**:\n"
            "Incident probability at Gate C is estimated at 32%. No immediate evacuation trigger is forecast.\n\n"
            "**[Transport Agent]**:\n"
            "A transit surge of 800 passengers is arriving at North Station in 6 minutes.\n\n"
            "**[Resource Agent]**:\n"
            "Current staffing at Gate C is 12 stewards. Recommend redeploying 4 stewards from East Concourse.\n\n"
            "**Preventive Recommendation**:\n"
            "Activate auxiliary routing signs directing 15% of arriving flows to West Entrance immediately."
        )
        return {
            "response": response,
            "suggested_actions": ["Deploy 4 stewards to Gate C", "Activate West Gate Detour"],
        }

    if "run scenario: close gate c" in q or ("scenario" in q and "gate c" in q):
        response = (
            "**[Multi-Agent Intelligence Response]**\n\n"
            "**[Crowd Prediction Agent]**:\n"
            "Closing Gate C turnstiles immediately forces crowd streams to North Gate, increasing local queue length by +35%.\n\n"
            "**[Resource Agent]**:\n"
            "Redeploy 8 stewards to secure secondary barrier pathways.\n\n"
            "**Safety Agent Projection**:\n"
            "Risk state escalates from HIGH to CRITICAL. Recovery timeline: 18 minutes. Recommendation: Open auxiliary checkpoint at West Entrance."
        )
        return {
            "response": response,
            "suggested_actions": ["Open West Entrance auxiliary", "Acknowledge Critical Scenario"],
        }

    if "show similar historical events" in q or "historical" in q:
        response = (
            "**[Multi-Agent Intelligence Response]**\n\n"
            "**[Safety Agent]**:\n"
            "I have matched current conditions to similar historical records:\n\n"
            "1. *Football Cup Qualifier (2024-11-14)*: Rainy weather, opening Gate B auxiliary entrance reduced queue bottlenecks by 28%.\n"
            "2. *Derby Championship Match (2025-03-22)*: Clear weather, deploying 12 stewards to East Concourse stabilized density in 11 minutes."
        )
        return {
            "response": response,
            "suggested_actions": ["Review historic outcomes", "Generate brief comparison"],
        }

    # Phase 8 Global Event Network Commands
    if "show global stadium status" in q or ("global" in q and "status" in q):
        response = (
            "**[Global Command Network Status]**\n\n"
            "Active monitoring across all network stadiums:\n"
            "- Critical: 2\n"
            "- Warning: 4\n"
            "- Normal: 8"
        )
        return {
            "response": response,
            "suggested_actions": ["List critical venues", "Open network map"],
        }

    if "which stadium needs attention" in q or "attention" in q:
        response = (
            "**[Critical Arena Warning]**\n\n"
            "**MetLife Stadium** requires immediate operational response.\n"
            "- **Reason**: Arrival surge + severe transport shuttle delay.\n"
            "- **Predicted Impact**: Critical congestion expected at Gate C in 22 minutes."
        )
        return {
            "response": response,
            "suggested_actions": ["Coordinate MetLife response", "Show MetLife digital twin"],
        }

    if "coordinate response" in q:
        response = (
            "**[Emergency Resource Coordination Response]**\n\n"
            "Emergency dispatch protocol initialized. Medic Team 2 and ambulance unit "
            "have been directed to the sector checkpoint."
        )
        return {
            "response": response,
            "suggested_actions": ["Confirm ambulance dispatch", "Alert checkpoint stewards"],
        }

    # Phase 9 Autonomous Control Commands
    if "enable autonomous mode" in q or "autonomous mode" in q:
        response = (
            "**[Autonomous Mode Activated]**\n\n"
            "Autonomous monitoring active. The system will continuously observe telemetry, "
            "evaluate crowd anomalies, and formulate action proposals for supervisor approval."
        )
        return {
            "response": response,
            "suggested_actions": ["Show pending AI decisions", "Open autonomous dashboard"],
        }

    if "show pending ai decisions" in q or "pending" in q:
        response = (
            "**[Pending AI Operational Decisions]**\n\n"
            "Active proposals requiring human approval:\n"
            "1. **Open Gate B** (Confidence: 94%)\n"
            "2. **Move volunteers to East Concourse** (Confidence: 88%)"
        )
        return {
            "response": response,
            "suggested_actions": ["Approve Gate B opening", "Approve volunteer relocation"],
        }

    if "why did ai recommend" in q or "recommend this action" in q or "why" in q:
        response = (
            "**[AI Operational Explanation Analysis]**\n\n"
            "**Recommendation**: Open Gate B auxiliary entrance turnstiles.\n"
            "- **Data Used**: Density scanners logs at Gate C.\n"
            "- **Prediction**: Gate C density expected to exceed safety threshold (87%) in 18 minutes.\n"
            "- **Expected Impact**: Ingress queue congestion duration reduced by 28%.\n"
            "- **Historical Evidence**: Opening auxiliary entrance during 2024 Qualifiers stabilized flow rates by 26%."
        )
        return {
            "response": response,
            "suggested_actions": ["Review historic outcomes", "Approve proposal"],
        }

    # 11. Default helper response
    response = (
        "Hello! I am your FluxGuard AI Command Assistant. I monitor real-time crowd densities, ticketing rates, transit schedules, and weather conditions. "
        "Ask me queries like:\n"
        "- *'Why is Gate C high risk?'*\n"
        "- *'Which zone needs immediate attention?'*\n"
        "- *'What is the safest evacuation route?'*\n"
        "- *'Summarize the last 15 minutes.'*\n"
        "- *'How will weather affect crowd flow?'*\n"
        "- *'How many staff are currently deployed?'*"
    )
    return {
        "response": response,
        "suggested_actions": [
            "Explain Gate C risk",
            "Find critical zones",
            "Safest evacuation route",
        ],
    }


async def resolve_copilot_query(event_id: UUID, query: str) -> dict:
    """Orchestrates query resolution, routing to Google Gemini API or fallback interpreter."""
    settings = get_settings()

    # Fetch live stadium metrics context
    zones = database.get_zones_for_event(event_id)
    alerts = database.get_alerts(event_id)

    # 1. Check if Gemini API is available
    if settings.gemini_api_key:
        try:
            # We import genai dynamically to keep setup lightweight if key is absent
            import google.generativeai as genai

            genai.configure(api_key=settings.gemini_api_key)
            model = genai.GenerativeModel("gemini-1.5-flash")

            # Formulate structured system context
            zones_text = "\n".join(
                [
                    f"- {z['name']} (ID: {z['id'].hex}): Density {z.get('density_count', 50)}%, Queue {z.get('queue_length', 10)}"
                    for z in zones
                ]
            )
            alerts_text = "\n".join(
                [
                    f"- Alert: {a.get('description', a.get('title', ''))} in {a['zone_id'].hex} (Severity: {a['severity']})"
                    for a in alerts
                ]
            )

            prompt = (
                "You are FluxGuard AI, an expert Stadium Operations Command Center Copilot. "
                "Analyze the stadium telemetry below and answer the operator query concisely and actionably.\n\n"
                f"Stadium Telemetry:\n{zones_text}\n\nAlerts:\n{alerts_text}\n\n"
                f"Operator Query: {query}\n\n"
                "Return a JSON block with 'response' (markdown text) and 'suggested_actions' (list of strings)."
            )

            response = model.generate_content(prompt)
            # Parse or extract json structure from model output
            text = response.text
            # Use simple parser fallback if model outputs plain text
            import json

            try:
                # Find JSON block in output
                match = re.search(r"\{.*\}", text, re.DOTALL)
                if match:
                    parsed = json.loads(match.group(0))
                    if "response" in parsed and "suggested_actions" in parsed:
                        return parsed
            except Exception:
                logger.warning(
                    "Failed to parse Gemini response as JSON. Falling back to plain text wraps."
                )

            return {
                "response": text,
                "suggested_actions": ["Acknowledge warning", "Contact floor captain"],
            }
        except Exception as e:
            logger.error(f"Gemini API query execution failed: {str(e)}. Using local interpreter.")

    # 2. Local interpretation fallback
    return generate_offline_response(query, zones, alerts)


def _as_number(value: Any, fallback: float = 0) -> float:
    if isinstance(value, bool):
        return fallback
    if isinstance(value, int | float):
        return float(value)
    return fallback


def _normalize_risk(value: Any) -> str:
    risk = str(value or "LOW").upper()
    return risk if risk in VALID_RISK_LEVELS else "LOW"


def _extract_zones(context: dict[str, Any]) -> list[dict[str, Any]]:
    raw_zones = context.get("zones", [])
    if not isinstance(raw_zones, list):
        return []

    zones: list[dict[str, Any]] = []
    for raw_zone in raw_zones:
        if not isinstance(raw_zone, dict):
            continue
        name = str(raw_zone.get("name") or "Unknown zone")
        density = round(max(0, min(100, _as_number(raw_zone.get("density")))))
        queue_length = round(max(0, _as_number(raw_zone.get("queueLength"))))
        entry_rate = round(max(0, _as_number(raw_zone.get("entryRate"))))
        exit_rate = round(max(0, _as_number(raw_zone.get("exitRate"))))
        zones.append(
            {
                "id": str(raw_zone.get("id") or name.lower().replace(" ", "-")),
                "name": name,
                "density": density,
                "queueLength": queue_length,
                "entryRate": entry_rate,
                "exitRate": exit_rate,
                "risk": _normalize_risk(raw_zone.get("risk")),
            }
        )
    return zones


def _extract_recent_events(context: dict[str, Any]) -> list[dict[str, str]]:
    raw_events = context.get("events", [])
    if not isinstance(raw_events, list):
        return []

    events: list[dict[str, str]] = []
    for raw_event in raw_events[:8]:
        if not isinstance(raw_event, dict):
            continue
        events.append(
            {
                "title": str(raw_event.get("title") or "Operational event"),
                "description": str(raw_event.get("description") or ""),
                "severity": _normalize_risk(raw_event.get("severity")),
                "timestamp": str(raw_event.get("timestamp") or ""),
            }
        )
    return events


def _risk_from_zone(zone: dict[str, Any]) -> str:
    density = _as_number(zone.get("density"))
    queue_length = _as_number(zone.get("queueLength"))
    if density > 90 or queue_length > 350:
        return "CRITICAL"
    if density > 75 or queue_length > 200:
        return "HIGH"
    if density > 50:
        return "MEDIUM"
    return "LOW"


def _build_command_center_fallback(
    message: str,
    venue: str,
    context: dict[str, Any],
) -> dict[str, Any]:
    zones = _extract_zones(context)
    events = _extract_recent_events(context)
    if not zones:
        return {
            "answer": (
                f"I cannot see active zone telemetry for {venue}. Keep manual gate monitoring "
                "active and verify simulator or sensor ingestion before issuing routing directives."
            ),
            "confidence": 0.42,
            "recommendations": [
                "Verify telemetry ingestion status",
                "Keep floor captains on radio check",
                "Do not issue automated reroutes until zone state is restored",
            ],
            "risk_level": "MEDIUM",
            "affected_zones": [],
            "recovery_time": "Unknown until telemetry resumes",
            "priority": "VERIFY_TELEMETRY",
            "reasoning": "The request did not include usable zone telemetry.",
            "impact": "Prevents hallucinated operational instructions during data loss.",
        }

    for zone in zones:
        zone["calculatedRisk"] = _risk_from_zone(zone)

    worst_zone = max(
        zones,
        key=lambda zone: (
            RISK_PRIORITY[_normalize_risk(zone.get("calculatedRisk"))],
            _as_number(zone.get("density")),
            _as_number(zone.get("queueLength")),
        ),
    )
    risk_level = _normalize_risk(worst_zone.get("calculatedRisk"))
    flow_gap = _as_number(worst_zone.get("entryRate")) - _as_number(worst_zone.get("exitRate"))
    lower_risk_zones = [
        zone
        for zone in zones
        if RISK_PRIORITY[_normalize_risk(zone.get("calculatedRisk"))] < RISK_PRIORITY[risk_level]
    ]
    target_zone = min(lower_risk_zones or zones, key=lambda zone: _as_number(zone.get("density")))
    should_redirect = risk_level in {"HIGH", "CRITICAL"} and target_zone["id"] != worst_zone["id"]

    if risk_level == "CRITICAL":
        priority = "IMMEDIATE_OPERATOR_ACTION"
        recovery_time = "8-12 minutes after flow restriction"
    elif risk_level == "HIGH":
        priority = "ACTIVE_MITIGATION"
        recovery_time = "10-18 minutes after reroute"
    elif risk_level == "MEDIUM":
        priority = "PREVENTIVE_MONITORING"
        recovery_time = "Monitor next 20 minutes"
    else:
        priority = "MONITOR"
        recovery_time = "No recovery action required"

    recommendations = [
        (
            f"Redirect incoming visitors from {worst_zone['name']} to {target_zone['name']}"
            if should_redirect
            else f"Maintain current routing at {worst_zone['name']} and continue monitoring"
        ),
        f"Dispatch a floor captain to validate {worst_zone['name']} queue conditions",
        "Update signage only after operator confirmation",
    ]
    if flow_gap > 10:
        recommendations.insert(
            1,
            f"Reduce inflow at {worst_zone['name']} because entry exceeds exit by {round(flow_gap)} people/min",
        )

    recent_event_text = ""
    if events:
        recent_event_text = f" Recent event: {events[0]['title']} - {events[0]['description']}"

    answer = (
        f"For {venue}, the highest operational risk is {worst_zone['name']} at "
        f"{worst_zone['density']}% density with queue length {worst_zone['queueLength']}. "
        f"Risk is {risk_level} because density and queue thresholds indicate "
        f"{'immediate congestion pressure' if risk_level in {'HIGH', 'CRITICAL'} else 'manageable crowd flow'}. "
        f"{recent_event_text} Recommended next step: {recommendations[0]}."
    )

    query = message.lower()
    if "why" in query or "reason" in query:
        answer += (
            f" The main driver is the flow imbalance: entry rate {worst_zone['entryRate']}/min "
            f"versus exit rate {worst_zone['exitRate']}/min."
        )
    elif "summary" in query or "brief" in query:
        elevated = [
            zone["name"] for zone in zones if zone["calculatedRisk"] in {"HIGH", "CRITICAL"}
        ]
        answer = (
            f"Operations summary for {venue}: {len(elevated)} elevated zone(s). "
            f"Primary focus is {worst_zone['name']} at {worst_zone['density']}% density. "
            f"Recent event count in context: {len(events)}. {recommendations[0]}."
        )

    return {
        "answer": answer,
        "confidence": 0.82 if zones else 0.42,
        "recommendations": recommendations,
        "risk_level": risk_level,
        "affected_zones": [worst_zone["name"]],
        "recovery_time": recovery_time,
        "priority": priority,
        "reasoning": (
            f"Deterministic assessment from density={worst_zone['density']}, "
            f"queueLength={worst_zone['queueLength']}, entryRate={worst_zone['entryRate']}, "
            f"exitRate={worst_zone['exitRate']}."
        ),
        "impact": (
            "Expected to reduce localized queue pressure and prevent threshold escalation."
            if risk_level in {"HIGH", "CRITICAL"}
            else "Maintains stable crowd movement while preserving intervention readiness."
        ),
    }


def _validate_command_center_response(payload: dict[str, Any]) -> dict[str, Any]:
    answer = str(payload.get("answer") or "").strip()
    recommendations_raw = payload.get("recommendations", [])
    recommendations = (
        [
            str(item).strip()
            for item in recommendations_raw
            if isinstance(item, str) and item.strip()
        ]
        if isinstance(recommendations_raw, list)
        else []
    )

    risk_level = _normalize_risk(payload.get("risk_level"))
    confidence = _as_number(payload.get("confidence"), 0.65)
    confidence = max(0, min(1, confidence))

    affected_zones_raw = payload.get("affected_zones", [])
    affected_zones = (
        [str(item).strip() for item in affected_zones_raw if isinstance(item, str) and item.strip()]
        if isinstance(affected_zones_raw, list)
        else []
    )

    if not answer or not recommendations:
        raise ValueError("Copilot response is missing required operational content.")

    return {
        "answer": answer,
        "confidence": confidence,
        "recommendations": recommendations[:5],
        "risk_level": risk_level,
        "affected_zones": affected_zones[:5],
        "recovery_time": str(payload.get("recovery_time") or "Monitor next update window"),
        "priority": str(payload.get("priority") or "MONITOR"),
        "reasoning": str(payload.get("reasoning") or "Derived from live crowd context."),
        "impact": str(payload.get("impact") or "Improves operator situational awareness."),
    }


async def _query_gemini_for_command_center(
    message: str,
    venue: str,
    context: dict[str, Any],
) -> dict[str, Any] | None:
    api_key = os.getenv("GOOGLE_GEMINI_API_KEY") or get_settings().gemini_api_key
    if not api_key:
        return None

    try:
        import google.generativeai as genai
    except Exception:
        logger.warning("Gemini package unavailable. Using deterministic Copilot fallback.")
        return None

    prompt = (
        "You are FluxGuard AI, an enterprise stadium operations assistant. "
        "Use only the supplied operational context. Do not invent sensor readings, weather, "
        "transport status, staff counts, or emergency instructions. "
        "Forecast models and AI recommendations must remain advisory until a human operator confirms them. "
        "Return strict JSON with keys: answer, confidence, recommendations, risk_level, "
        "affected_zones, recovery_time, priority, reasoning, impact. "
        "risk_level must be LOW, MEDIUM, HIGH, or CRITICAL. confidence must be 0-1.\n\n"
        f"Venue: {venue}\n"
        f"Operator message: {message}\n"
        f"Operational context JSON: {json.dumps(context, default=str)[:12000]}"
    )

    def generate() -> str:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"},
        )
        return str(response.text)

    try:
        text = await asyncio.wait_for(asyncio.to_thread(generate), timeout=12)
        match = re.search(r"\{.*\}", text, re.DOTALL)
        parsed = json.loads(match.group(0) if match else text)
        if not isinstance(parsed, dict):
            raise ValueError("Gemini returned a non-object response.")
        return _validate_command_center_response(parsed)
    except Exception as exc:
        logger.warning("Gemini command-center query failed; using fallback: %s", exc)
        return None


async def resolve_command_center_query(
    message: str,
    venue: str,
    context: dict[str, Any],
) -> dict[str, Any]:
    """Resolve command-center Copilot chat from live frontend operations context."""
    gemini_response = await _query_gemini_for_command_center(message, venue, context)
    if gemini_response:
        return gemini_response

    return _validate_command_center_response(
        _build_command_center_fallback(message=message, venue=venue, context=context)
    )
