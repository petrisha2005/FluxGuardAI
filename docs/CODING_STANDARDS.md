# Coding Standards

This document defines implementation standards for the future FluxGuard AI codebase. No source code is included here.

## Folder Structure

Recommended structure:

```text
frontend/
  src/
    components/
    features/
      alerts/
      crowd-map/
      fan-guidance/
      forecasts/
      operator-dashboard/
      volunteer-actions/
    hooks/
    services/
    types/
    utils/
backend/
  app/
    api/
    core/
    integrations/
    models/
    prompts/
    schemas/
    services/
      ai/
      alerts/
      forecasting/
      ingestion/
      risk/
    workers/
    tests/
ml/
  notebooks/
  pipelines/
  models/
  evaluation/
docs/
```

## Naming Conventions

- React components: PascalCase and named by operational intent, such as `RiskZoneCard`, `ForecastHorizonChart`, or `VolunteerActionPanel`.
- TypeScript files for components: PascalCase.
- Utility files: camelCase or kebab-case, consistently selected within each package.
- Python modules: snake_case.
- Database tables and columns: snake_case.
- API paths: kebab-case nouns that describe crowd operations, such as `risk-scores`, `crowd-measurements`, and `guidance-messages`.
- Environment variables: SCREAMING_SNAKE_CASE and prefixed by domain where useful, such as `CLAUDE_API_KEY`, `SUPABASE_URL`, and `FORECAST_MODEL_VERSION`.
- Prompt template files: include role and version, such as `operator_v1.md` or `fan_route_guidance_v2.md`.
- Forecast artifacts: include model family, event scope, and version.

## TypeScript Rules

- Enable strict mode.
- Avoid `any`; use explicit types for forecast horizons, severity, alert status, audience role, and guidance schema versions.
- Keep API types centralized and aligned with [API_SPECIFICATION.md](API_SPECIFICATION.md).
- Treat WebSocket payloads as untrusted until shape-checked on the client boundary.
- Keep components small and mapped to crowd-management concepts: zone status, forecast trend, alert action, route guidance, or assignment.
- Do not duplicate risk scoring rules in the frontend. The UI may display severity, but the backend owns risk calculation.
- Show stale-data and reconnect states whenever live measurements or predictions stop updating.
- Never render AI guidance until the backend marks it as schema-valid or deterministic fallback.

## Python Rules

- Use type hints for public functions.
- Use Pydantic schemas for request and response validation.
- Keep route handlers thin.
- Place business logic in services.
- Keep ML and AI providers behind interfaces.
- Use structured logging.
- Avoid global mutable state for request-specific data.
- AI providers must never be called directly from route handlers. Routes call a guidance service, and the guidance service calls the provider adapter.
- Risk scoring logic must remain deterministic and independent of the LLM.
- Forecast models cannot directly trigger notifications. They emit predictions; the risk service evaluates thresholds; the alert service controls notification eligibility.
- Every AI response must pass JSON schema validation before storage or delivery.
- Prompt templates must be version-controlled and referenced by prompt version in persisted guidance records.
- Simulation code must label generated data clearly so it cannot be mistaken for live venue measurements.
- Ingestion services must preserve source type, source confidence, and measurement timestamp.

## SOLID Principles

- Single Responsibility: separate ingestion, prediction, risk, guidance, and delivery.
- Open/Closed: add new data sources through adapters.
- Liskov Substitution: provider interfaces should support interchangeable implementations.
- Interface Segregation: avoid forcing services to depend on methods they do not use.
- Dependency Inversion: high-level workflows depend on abstractions, not concrete provider clients.
- Operational Determinism: any decision that changes alert severity or notification routing must be reproducible without an LLM.
- Human Override: operator decisions must be represented as explicit state transitions, not hidden side effects.

## Git Conventions

- Main branch should remain deployable.
- Use feature branches for work, grouped by operational domain where possible.
- Keep pull requests focused.
- Include tests with behavior changes.
- Do not commit secrets, generated caches, or local environment files.
- Treat prompt changes like code changes. They require review, fixtures, and prompt regression results.
- Database migrations that touch measurements, predictions, risk scores, alerts, or guidance require rollback notes.

## Commit Message Standards

Use concise conventional-style messages:

- feat: add gate surge prediction horizon
- fix: block unvalidated volunteer guidance
- docs: update match-day readiness checklist
- test: cover critical risk scoring bands
- chore: rotate staging simulation fixtures

## Code Review Checklist

- Does the change preserve role-based access rules?
- Are crowd measurements, integration payloads, and WebSocket messages validated at the boundary?
- Are errors structured and user-safe?
- Are AI outputs schema-validated?
- Is fallback behavior defined?
- Are accessibility states covered?
- Are tests proportionate to safety and operational risk?
- Are logs useful without exposing secrets or personal data?
- Does the change avoid unnecessary coupling?
- Does deterministic risk scoring remain independent of Claude output?
- Can the forecast, risk, alert, and guidance path be replayed from stored data?
- Does any notification-producing change include surge and degradation tests?
