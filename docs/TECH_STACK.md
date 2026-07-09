# Tech Stack

## Frontend

### React

React enables modular visualization of independently updating crowd zones without forcing a full dashboard refresh during live prediction updates. Operator views can isolate map cells, alert panels, forecast cards, and WebSocket status indicators so a surge at Gate B does not degrade the entire command interface.

### TypeScript

TypeScript is required because FluxGuard AI moves safety-sensitive structured data between prediction, risk, alert, and guidance surfaces. Shared types should represent forecast horizons, severity bands, alert lifecycle states, and validated Claude JSON outputs so fan, volunteer, and operator experiences cannot silently misread a high-risk zone as a normal status.

### Vite

Vite supports fast scenario iteration during simulation-heavy development. The team can rapidly test match phases such as pre-kickoff arrival, halftime movement, and post-match exit while preserving a production build path for the live crowd dashboard.

### Tailwind

Tailwind should encode the visual language of crowd risk: severity colors, density badges, zone cards, operator action states, and mobile fan guidance layouts. Status styling must always pair color with text or icons so critical crowd warnings remain accessible under WCAG requirements described in [ACCESSIBILITY.md](ACCESSIBILITY.md).

### Framer Motion

Framer Motion should be used only for operationally useful transitions: newly elevated risk zones, alert acknowledgement, WebSocket reconnect status, and fan route updates. Motion must never obscure time-critical guidance, delay operator action, or violate reduced-motion preferences.

### Recharts

Recharts is used to compare actual crowd measurements against 20, 30, and 40 minute forecasts. The operator dashboard needs quick visual separation between current density, predicted density, capacity threshold, confidence interval, and post-intervention trend.

## Backend

### FastAPI

FastAPI fits the command-and-control backend because it combines Python ML proximity with strict request validation for ingestion, predictions, alerts, and guidance. Route handlers must stay thin: they authenticate, validate, and delegate to services so the deterministic risk engine and Claude guidance orchestration remain testable and auditable.

### Python

Python is the operating language for simulation, forecasting, risk scoring, and AI orchestration. It allows the same backend ecosystem to run match-phase simulators, Prophet or LSTM pipelines, confidence scoring, and Claude prompt assembly without converting operational data between multiple runtimes.

## AI

### Claude API

Claude generates role-specific language after the platform has already computed deterministic risk and selected the audience. It must not decide whether a zone is dangerous, open an alert, or trigger a notification. Claude output is useful for transforming validated operational facts into fan-safe route guidance, volunteer instructions, and operator summaries, following [AI_PROMPT_STRATEGY.md](AI_PROMPT_STRATEGY.md).

## ML

### Prophet

Prophet is a strong MVP forecasting baseline for event phases with predictable temporal structure: arrival waves, kickoff compression, halftime spikes, and post-match exits. Its interpretability helps operators understand why a zone is expected to exceed capacity, which improves trust during early deployments.

### LSTM

LSTM models become useful when the platform has enough historical and simulated sequence data to learn nonlinear interactions between neighboring zones, gate throughput, transit bursts, and route diversions. LSTM should be introduced only after forecast evaluation proves it improves over simpler baselines for the 20-40 minute prediction window.

Recommended approach: use Prophet or statistical baselines for MVP, then evaluate LSTM for Version 2 where data volume and operational explainability justify the complexity. See [ML_PIPELINE.md](ML_PIPELINE.md) for the training, prediction, and feedback workflow.

## Realtime

### WebSockets

WebSockets deliver low-latency changes in zone status, prediction updates, alert lifecycle events, and guidance availability. This matters because crowd conditions can change faster than polling intervals, especially near gates and transit exits. Clients must handle reconnects and stale-data indicators so operators know when a dashboard is no longer live.

## Database

### Supabase

Supabase provides Postgres-backed storage for event topology, zone capacity, measurements, predictions, risk scores, alerts, guidance, feedback, and audit logs. Row Level Security is important because fans, volunteers, operators, and organizers should see different operational detail. Database design and indexing requirements are defined in [DATABASE_DESIGN.md](DATABASE_DESIGN.md).
