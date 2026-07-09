# System Architecture

## High-Level Architecture

FluxGuard AI uses a modular architecture with clear boundaries between ingestion, prediction, AI guidance, APIs, real-time delivery, and user interfaces. The design supports hackathon simulation first, while leaving a production path for live event integrations.

```mermaid
flowchart LR
    Sources["Crowd Data Sources"] --> Ingestion["Ingestion Layer"]
    Ingestion --> Store["Supabase Database"]
    Ingestion --> Stream["Realtime Event Bus"]
    Store --> ML["ML Forecasting Service"]
    Stream --> ML
    ML --> Risk["Risk Scoring Engine"]
    Risk --> AI["Claude Guidance Service"]
    Risk --> API["FastAPI Backend"]
    AI --> API
    API --> WS["WebSocket Gateway"]
    API --> REST["REST API"]
    REST --> Apps["React Applications"]
    WS --> Apps
    Apps --> Users["Fans, Volunteers, Operators, Organizers"]
```

## Component Diagram

```mermaid
flowchart TB
    subgraph Frontend["Frontend - React, TypeScript, Vite"]
        FanApp["Fan Experience"]
        VolunteerApp["Volunteer Console"]
        OperatorDash["Operator Dashboard"]
        OrganizerView["Organizer Analytics"]
    end

    subgraph Backend["Backend - FastAPI"]
        Auth["Auth Middleware"]
        EventsAPI["Events and Zones API"]
        AlertsAPI["Alerts API"]
        GuidanceAPI["AI Guidance API"]
        PredictionAPI["Predictions API"]
        WebSockets["WebSocket Manager"]
    end

    subgraph Intelligence["Intelligence Layer"]
        Simulator["Simulation Engine"]
        Forecast["Prophet/LSTM Forecasting"]
        RiskEngine["Risk Scoring"]
        PromptEngine["Prompt Orchestration"]
        Claude["Claude API"]
    end

    subgraph Data["Data Layer - Supabase"]
        Postgres["Postgres"]
        Realtime["Supabase Realtime"]
        Storage["Object Storage"]
        RLS["Row Level Security"]
    end

    Frontend --> Auth
    Frontend --> EventsAPI
    Frontend --> AlertsAPI
    Frontend --> GuidanceAPI
    Frontend --> PredictionAPI
    Frontend --> WebSockets
    Backend --> Data
    Backend --> Intelligence
    PromptEngine --> Claude
```

## Data Flow

```mermaid
sequenceDiagram
    participant Source as Crowd Source
    participant API as FastAPI
    participant DB as Supabase
    participant ML as Forecast Service
    participant Risk as Risk Engine
    participant AI as Claude Guidance
    participant UI as Client UI

    Source->>API: Send crowd measurement
    API->>DB: Store measurement
    API->>ML: Trigger forecast update
    ML->>DB: Read recent zone history
    ML->>Risk: Return 20-40 minute forecast
    Risk->>DB: Store risk score and alert
    Risk->>AI: Request role-specific guidance
    AI->>DB: Store guidance output
    API->>UI: Push update over WebSocket
```

## AI Workflow

1. Backend receives a risk event with zone, severity, forecast horizon, and context.
2. Prompt engine selects the correct role template.
3. Context is minimized to relevant facts only.
4. Claude API returns structured JSON guidance.
5. Backend validates schema, safety rules, and tone constraints.
6. Valid guidance is stored and pushed to the correct clients.
7. Invalid or unavailable AI output falls back to deterministic guidance templates.

## ML Workflow

1. Ingest or simulate time-series crowd measurements.
2. Normalize by zone capacity, time, event phase, gate assignment, weather, and transport pressure.
3. Train Prophet for interpretable baseline forecasting or LSTM for higher-volume temporal patterns.
4. Predict density, queue length, and flow rate 20, 30, and 40 minutes ahead.
5. Convert forecasts into risk scores.
6. Compare predictions to actual outcomes for continuous calibration.

## Backend Architecture

FastAPI exposes REST endpoints for configuration, dashboards, predictions, alerts, guidance, feedback, and admin operations. It also manages WebSocket channels for live zone updates and alert broadcasts.

Key backend principles:

- Separate routers by domain.
- Use service classes for business logic.
- Keep ML and AI orchestration behind interfaces.
- Validate all requests with Pydantic models.
- Enforce role-based authorization at route and data-access layers.
- Persist auditable state transitions for alerts and recommendations.

## Frontend Architecture

The frontend uses React, TypeScript, Vite, Tailwind, Framer Motion, and Recharts.

Primary surfaces:

- Fan mobile-first route guidance.
- Volunteer action console.
- Operator command dashboard.
- Organizer analytics and post-event insights.

Frontend principles:

- Component-driven architecture.
- Strict TypeScript types for API contracts.
- Accessible controls and keyboard navigation.
- State split between server state, WebSocket state, and local UI state.
- Charts for forecasts, risk trends, and zone comparisons.

## External Integrations

Potential integrations include:

- Ticket scanning systems.
- Turnstile and entry gate counters.
- CCTV or computer vision crowd density feeds.
- Wi-Fi and Bluetooth density analytics.
- Transit authority feeds.
- Weather APIs.
- Emergency notification systems.
- Stadium signage and public address systems.
- Claude API for guidance generation.

## Deployment Architecture

```mermaid
flowchart TB
    Dev["Developer Workstation"] --> CI["CI/CD Pipeline"]
    CI --> Staging["Staging Environment"]
    CI --> Prod["Production Environment"]

    subgraph Prod["Production"]
        CDN["Frontend CDN"]
        API["FastAPI Service"]
        Worker["ML/AI Worker"]
        Supabase["Supabase Project"]
        Monitor["Monitoring and Alerts"]
    end

    CDN --> API
    API --> Supabase
    API --> Worker
    Worker --> Supabase
    Monitor --> API
```

