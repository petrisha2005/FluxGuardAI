# Risk Register

## Technical Risks

| Risk | Impact | Likelihood | Mitigation |
| --- | --- | --- | --- |
| Forecasts are inaccurate during unusual crowd behavior | High | Medium | Use confidence intervals, field feedback, conservative thresholds, and operator approval. |
| AI guidance is invalid or unsafe | High | Medium | Use structured JSON validation, strict guardrails, deterministic fallbacks, and human oversight. |
| WebSocket delivery fails during peak usage | High | Medium | Implement reconnect, backoff, polling fallback, and load testing. |
| Database queries slow under time-series load | Medium | Medium | Add indexes, materialized views, partitioning, and archival strategy. |
| External integrations provide delayed or noisy data | High | Medium | Track source confidence, use smoothing, and expose data freshness. |
| Model complexity slows hackathon delivery | Medium | High | Start with Prophet or baseline model, add LSTM only if time allows. |

## Operational Risks

| Risk | Impact | Likelihood | Mitigation |
| --- | --- | --- | --- |
| Volunteers ignore or misunderstand instructions | High | Medium | Keep guidance short, role-specific, and confirmable. |
| Fans receive too many alerts | Medium | Medium | Use alert throttling and relevance filtering. |
| Operators distrust predictions | High | Medium | Show drivers, confidence, and historical performance. |
| Guidance conflicts with official emergency protocols | High | Low | Encode protocol hierarchy and require operator approval for critical actions. |
| Network connectivity is degraded at venue | High | Medium | Support cached assignments, reconnect behavior, and SMS/signage integration in future versions. |

## Hackathon Risks

| Risk | Impact | Likelihood | Mitigation |
| --- | --- | --- | --- |
| Scope becomes too large | High | High | Focus MVP on simulation, forecasting, risk scoring, and AI guidance. |
| Demo data feels unrealistic | Medium | Medium | Build scenario-based simulation with event phases and incidents. |
| AI provider fails during demo | High | Medium | Prepare deterministic fallback outputs. |
| UI polish takes time from core logic | Medium | Medium | Prioritize the operator story and one fan/volunteer flow. |
| Team integration issues | Medium | Medium | Define API contracts early and use mocked responses during parallel work. |

## Mitigation Strategy

- Build the demo around a small number of strong, realistic scenarios.
- Keep architecture modular so simulation can later be replaced by live integrations.
- Treat AI as assistive, not authoritative.
- Keep operators in control of critical actions.
- Validate all model and AI outputs before user delivery.
- Maintain clear audit logs for decisions and recommendations.

