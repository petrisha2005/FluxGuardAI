# Deployment

## Development

Development environment includes:

- Local Vite frontend.
- Local FastAPI backend.
- Supabase development project.
- Optional local simulation worker.
- Claude API key stored in local environment only.

Development goals:

- Rapid iteration on crowd scenarios such as gate surge, halftime movement, and post-match exit.
- Clear separation between simulated measurements and live integration payloads.
- Safe local testing of AI guidance with non-production Claude and Supabase credentials.
- Reproducible replay of measurement-to-prediction-to-alert flows.

## Staging

Staging should mirror production as closely as practical.

Staging responsibilities:

- Validate migrations.
- Test RLS policies.
- Run load and WebSocket tests.
- Test AI fallback behavior.
- Review accessibility and performance.
- Run end-to-end demo scenarios.
- Backtest forecast models against approved simulation fixtures.
- Run prompt regression tests for all audience roles.
- Confirm operator approval and alert lifecycle workflows.
- Verify stale-data indicators when ingestion, WebSocket, or Claude dependencies degrade.

## Production

Production should use:

- Managed frontend hosting or CDN.
- FastAPI service hosted on a scalable container platform.
- Separate worker process for ML and AI jobs.
- Supabase production project.
- Centralized monitoring and alerting.
- Strict CORS and HTTPS.
- Dedicated production simulation controls disabled or clearly separated from live integrations.
- Operational health dashboard visible to the event technology team.
- Capacity planning for gate-opening, halftime, and post-match traffic spikes.

## Environment Variables

Required categories:

- Supabase URL.
- Supabase anon key.
- Supabase service role key.
- Claude API key.
- JWT issuer and audience.
- CORS allowed origins.
- Environment name.
- Logging level.
- Rate limit settings.
- Model configuration.
- Prompt version.
- Guidance fallback mode.
- Simulation mode flag.
- WebSocket heartbeat interval.
- Alert threshold configuration.

Secrets must be provided through the deployment platform, not committed files.

## CI/CD

Recommended pipeline:

1. Install dependencies.
2. Run linting.
3. Run type checks.
4. Run unit tests.
5. Run integration tests where available.
6. Run accessibility checks.
7. Run forecast backtests.
8. Run prompt regression fixtures and JSON schema validation.
9. Build frontend.
10. Build backend container.
11. Apply database migrations to staging.
12. Deploy staging.
13. Run end-to-end simulation smoke tests.
14. Promote to production with approval.

## Pre-Match Readiness Checklist

- Confirm event, venue, zone capacity, and zone geometry records.
- Verify sensor or simulator source status and timestamp freshness.
- Run latest forecast backtest report for the active model version.
- Confirm prompt version, schema version, and deterministic fallback templates.
- Validate Supabase RLS policies for fan, volunteer, operator, and organizer roles.
- Confirm WebSocket health and reconnect behavior.
- Confirm Claude API quota, latency, and outage fallback mode.
- Review operator escalation contacts and incident response channel.
- Freeze non-critical deployments before the match-day window.

## Match-Day Operational Workflow

1. Enable event monitoring before gates open.
2. Confirm live ingestion or approved simulation feed.
3. Run scheduled prediction cycles for 20, 30, and 40 minute horizons.
4. Convert predictions to deterministic risk scores.
5. Generate alerts only through the alert service.
6. Generate role-specific guidance through the guidance service.
7. Require operator approval for critical public or venue-wide guidance.
8. Monitor intervention outcomes and field feedback.
9. Keep audit logs for every alert, acknowledgement, recommendation, and resolution.

## AI Provider Degradation Strategy

- If Claude latency exceeds the event threshold, switch to deterministic fallback templates.
- If Claude returns invalid JSON, attempt one schema repair, then fallback.
- If Claude is unavailable, continue prediction, risk scoring, alerts, and operator workflows without AI-generated prose.
- Surface AI degradation clearly to operators while hiding provider details from fans.
- Track fallback rate as an operational metric, as referenced in [SECURITY.md](SECURITY.md).

## Incident Response

- Classify incidents as platform, data source, AI provider, security, or operational safety.
- Preserve measurement, prediction, risk, alert, guidance, and audit records for replay.
- Disable public guidance generation if AI output integrity is in doubt.
- Prefer operator-controlled static guidance over uncertain generated guidance.
- Notify the event technical lead and safety lead for critical production incidents.

## Rollback Strategy

- Keep the previous frontend build available for immediate rollback.
- Version backend containers and database migrations.
- Do not run destructive migrations during match-day windows.
- Maintain previous prompt versions and fallback templates.
- Roll back model versions independently from application deployments when possible.
- After rollback, replay the last critical alert path to verify prediction, risk, and guidance behavior.

## Post-Event Analytics Pipeline

- Archive raw measurements, predictions, risk scores, alerts, guidance, feedback, and audit logs.
- Compare predicted congestion against observed density and queue outcomes.
- Measure intervention impact by zone and event phase.
- Review AI guidance validation failures, fallback usage, and operator edits.
- Feed approved learnings into model calibration and prompt version planning.
- Produce organizer reports aligned with [USER_JOURNEYS.md](USER_JOURNEYS.md) and [ML_PIPELINE.md](ML_PIPELINE.md).

## Monitoring

Monitor:

- API latency and error rate.
- WebSocket connections and reconnects.
- Prediction job duration.
- AI provider latency and failure rate.
- Fallback guidance rate.
- Database query performance.
- Alert volume by severity.
- Authentication failures.
- Rate limit events.
- Sensor freshness and source confidence.
- Forecast error once actual measurements arrive.
- Guidance schema failure rate.
- Operator acknowledgement and resolution time.

Production event windows should have elevated alerting and an operator-facing health page.
