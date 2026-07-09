# Testing Strategy

## Unit Testing

Frontend:

- Component rendering for zone status, forecast horizons, alert cards, and guidance panels.
- Utility functions.
- API client validation for prediction, alert, and guidance response shapes.
- Accessibility states for live alerts, stale-data banners, route changes, and operator action controls.
- Chart data transformations that compare observed measurements against 20, 30, and 40 minute forecasts.
- WebSocket reducer behavior for out-of-order, duplicate, or delayed crowd updates.

Backend:

- Pydantic validation.
- Deterministic risk scoring independent of Claude output.
- Alert lifecycle transitions.
- Prompt schema validation and prompt version selection.
- Authorization rules.
- Simulator behavior.
- Guardrails that prevent forecast models from directly triggering notifications.
- Fallback guidance generation when Claude is unavailable or invalid.

ML:

- Feature generation.
- Forecast output shape.
- Risk band mapping.
- Backtesting helpers.
- Forecast accuracy evaluation by zone type and event phase.
- Confidence interval behavior under noisy or sparse sensor input.
- Drift checks comparing simulated scenarios to live or historical data when available.

AI:

- JSON schema validation for every role-specific guidance output.
- Prompt regression fixtures for fan, volunteer, operator, and organizer templates.
- Hallucination checks that reject unknown gates, routes, zones, or staff instructions.
- Prompt injection tests using malicious feedback and integration payloads.
- Fallback selection when Claude times out, fails, or returns malformed JSON.

## Integration Testing

- Authenticated API flows.
- Measurement ingestion to prediction creation.
- Prediction to risk score to alert.
- Alert to AI guidance generation.
- WebSocket event delivery.
- Supabase persistence and RLS policies.
- Fallback guidance when Claude API is unavailable.
- End-to-end simulation from pre-match arrival through post-match exit.
- Alert replay from stored measurements to confirm deterministic risk outcomes.
- Operator acknowledgement, volunteer action, fan guidance, and feedback loop across one scenario.
- Schema compatibility between [API_SPECIFICATION.md](API_SPECIFICATION.md), [DATABASE_DESIGN.md](DATABASE_DESIGN.md), and AI guidance records.

## Accessibility Testing

- Keyboard-only navigation.
- Screen reader labels.
- Focus order.
- Color contrast.
- Reduced motion behavior.
- Error announcement patterns.
- Responsive layout at mobile, tablet, and desktop widths.
- Screen reader summaries for maps, risk charts, and forecast trends.
- Fan guidance readability when alerts update while the user is navigating.
- Volunteer action workflows under noisy, mobile, one-handed use conditions.

## Performance Testing

- API response time during simulated gate-opening, halftime, and exit surges.
- WebSocket fan-out latency for operator, volunteer, and fan channels.
- Prediction job duration relative to the 20-40 minute forecast window.
- Database query performance for latest zone status, alert list, and forecast history.
- Chart rendering with high-volume zone time-series data.
- Rate limit behavior under burst feedback, reconnect storms, and repeated guidance-generation requests.
- Claude timeout behavior under provider latency and quota exhaustion.

## Forecast Evaluation

- Backtest predictions against simulated and historical scenarios.
- Report mean absolute error, false positive rate, false negative rate, and lead time by zone.
- Evaluate risk threshold calibration separately for gates, concourses, exits, and transit zones.
- Confirm interventions are not counted as forecast failures without annotation.
- Store evaluation results with model version as described in [ML_PIPELINE.md](ML_PIPELINE.md).

## Prompt Regression Testing

- Maintain fixtures for normal congestion, critical congestion, sensor uncertainty, and resolved alerts.
- Compare structured outputs across prompt versions.
- Reject prompt versions that increase hallucinated zones, missing expiration times, unsafe instructions, or schema failures.
- Test all audience roles defined in [AI_PROMPT_STRATEGY.md](AI_PROMPT_STRATEGY.md).

## Manual QA Checklist

- Users can sign in with correct role.
- Fans only see public-safe guidance.
- Volunteers see assigned zones only.
- Operators can acknowledge, update, resolve, and escalate alerts.
- Risk colors and labels remain consistent.
- AI guidance includes expiration and actions.
- Fallback guidance appears when AI is unavailable.
- Malformed AI output is rejected and never displayed.
- Prompt injection text in feedback does not alter guidance behavior.
- Forecast model output creates predictions but does not directly notify users.
- Critical alerts include replayable measurement, prediction, and risk-score records.
- Empty states are honest and useful.
- All critical actions are audit logged.
- UI remains usable on mobile.
- No keyboard traps exist.
- WebSocket reconnect works after network interruption.
