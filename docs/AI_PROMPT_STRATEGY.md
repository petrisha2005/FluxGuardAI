# AI Prompt Strategy

## Prompt Architecture

FluxGuard AI uses a layered prompt architecture:

- System policy: defines safety, accuracy, tone, and refusal boundaries.
- Role template: fan, volunteer, operator, or organizer.
- Event context: event, venue, zone, severity, forecast horizon, and known constraints.
- Action schema: required JSON output fields.
- Guardrails: prohibited claims, escalation requirements, and fallback rules.

The backend, not the model, decides who receives each message.

## Prompt Templates

### Fan Template

Goal: clear, calm, location-aware guidance.

Required output fields:

- headline.
- shortMessage.
- recommendedRoute.
- avoidZones.
- estimatedDelay.
- accessibilityNote.
- expiresAt.

### Volunteer Template

Goal: specific field action with escalation cues.

Required output fields:

- headline.
- priority.
- actions.
- location.
- escalationTrigger.
- doNotSay.
- expiresAt.

### Operator Template

Goal: operational synthesis and decision support.

Required output fields:

- incidentSummary.
- riskDrivers.
- recommendedActions.
- affectedZones.
- confidence.
- monitoringPlan.
- escalationOptions.

### Organizer Template

Goal: strategic summary and performance insight.

Required output fields:

- eventImpactSummary.
- trendExplanation.
- recommendedPlanningChanges.
- metricsToReview.

## Role-Based Prompting

Prompts must tailor language and detail:

- Fans receive simple instructions without operational complexity.
- Volunteers receive short, directive, local tasks.
- Operators receive risk drivers, tradeoffs, and action plans.
- Organizers receive aggregate summaries and planning implications.

## Structured JSON Outputs

AI output must be valid JSON matching a versioned schema. The backend validates:

- Required fields.
- Allowed enum values.
- Maximum text lengths.
- No unsupported routes or zones.
- No emergency claims unless the alert severity and policy permit them.

Invalid outputs are rejected and replaced with fallback templates.

## Guardrails

- Never instruct users to enter restricted areas.
- Never contradict official emergency procedures.
- Never invent zones, gates, or staff roles.
- Never overstate certainty.
- Never expose internal risk calculations to fans.
- Always include an expiration or review time for operational guidance.
- Use calm language and avoid panic-inducing wording.

## Fallback Strategy

Fallback order:

1. Retry once with a stricter repair prompt.
2. Use deterministic template based on severity, role, and zone type.
3. Notify operator that AI guidance used fallback.
4. Log provider failure and fallback reason.

## Prompt Versioning

Every guidance message stores:

- prompt_version.
- schema_version.
- model_provider.
- model_name.
- input_context_hash.
- output_validation_status.

Prompt changes must be reviewed like application code and tested against scenario fixtures before release.

