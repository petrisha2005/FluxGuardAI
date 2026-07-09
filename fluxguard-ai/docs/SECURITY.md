# Security

## Threat Model

Key threats:

- Unauthorized access to operator dashboards that expose gates, density, staffing, or incident response posture.
- Prompt injection through user feedback, integration payloads, volunteer notes, or zone metadata later included in Claude context.
- Hallucinated operational guidance that invents gates, routes, commands, or escalation instructions.
- Adversarial sensor input designed to create false congestion, hide real congestion, or trigger unnecessary diversions.
- API abuse during event surges, including feedback spam, WebSocket connection floods, and repeated guidance-generation attempts.
- Sensitive operational information leakage to fans, including security routes, staffing gaps, internal thresholds, or incident notes.
- Claude API outage or latency during a live match window.
- Denial of service against real-time systems when dashboard traffic and crowd telemetry peak together.
- Exposure of API keys or Supabase credentials.
- Misuse of AI-generated guidance as an authoritative safety decision instead of an operator-reviewed recommendation.

## Input Validation

- Validate every request with Pydantic.
- Enforce strict enums for roles, status values, source types, and severity.
- Limit string lengths.
- Reject unknown zone or event identifiers.
- Sanitize user feedback, volunteer notes, and external integration fields before they enter AI context.
- Treat all integration data as untrusted until source identity, timestamp freshness, and value ranges are verified.
- Reject crowd measurements that violate physical constraints, such as impossible density jumps or negative queue lengths.
- Attach source confidence to ingestion records so risk scoring can down-weight noisy or suspicious feeds.
- Use allowlisted zone and route identifiers when building prompts; never let free text define an operational route.

## API Security

- Require JWT authentication for protected routes.
- Enforce role-based authorization.
- Use Supabase Row Level Security.
- Require service tokens only for trusted backend jobs.
- Apply CORS allowlists per environment.
- Use HTTPS only in staging and production.
- Do not expose internal model prompts, raw risk drivers, security-sensitive zone notes, or operator-only recommendations to public users.
- Separate fan-safe guidance endpoints from operator and volunteer operational endpoints.
- Require idempotency keys for ingestion and alert lifecycle mutation endpoints where duplicate calls could distort state.
- Prevent forecast services from directly sending notifications; only the alert service may publish audience-visible updates after authorization and policy checks.

## Secrets Management

- Store secrets in environment-specific secret managers.
- Never commit `.env` files.
- Rotate Claude and Supabase service keys regularly.
- Use least-privilege credentials.
- Separate development, staging, and production keys.
- Use separate Claude keys for staging simulation and production event windows.
- Revoke provider keys immediately if prompt logs, operational context, or service role credentials are exposed.

## Rate Limiting

- Apply stricter limits to public fan guidance and feedback endpoints because they are most exposed during crowd surges.
- Apply per-source limits to ingestion endpoints so one faulty sensor cannot overwhelm prediction jobs.
- Use burst protection for WebSocket connection attempts before gate opening, halftime, and post-match exit.
- Rate limit Claude guidance generation by alert, role, and event phase to prevent cost spikes and guidance churn.
- Log and alert on repeated validation failures, impossible measurement patterns, and sudden source confidence drops.

## AI Safety Controls

- Claude is never the source of truth for severity, routing eligibility, or notification targeting.
- Every Claude response must pass JSON schema validation as described in [AI_PROMPT_STRATEGY.md](AI_PROMPT_STRATEGY.md).
- Guidance must reference only known zones, gates, and actions supplied by the backend.
- If Claude is unavailable, slow, or returns invalid output, deterministic fallback templates must be used.
- Prompt inputs must exclude secrets, internal credentials, and unnecessary operational details.
- Prompt injection attempts should be stored as security events when detected.
- Critical or venue-wide guidance should require operator approval before public delivery.

## Logging

Log:

- Authentication failures.
- Authorization denials.
- Alert lifecycle changes.
- Guidance generation status.
- AI fallback usage.
- Integration failures.
- Rate limit events.
- Prompt validation failures.
- Suspicious sensor anomalies.
- Claude timeout, outage, or schema-repair events.

Do not log:

- Access tokens.
- API keys.
- Sensitive personal information.
- Full raw prompts if they contain user-identifiable data or sensitive operational context.
- Fan location traces beyond what is required for safety analytics and retention policy.
