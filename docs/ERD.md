# Entity Relationship Diagram (ERD)

This document contains a visual entity relationship diagram of the database models in **FluxGuard AI v1.1**.

## Mermaid Diagram

```mermaid
erDiagram
    stadiums ||--o{ events : hosts
    events ||--o{ zones : contains
    zones ||--o{ zones : parent_child
    events ||--o{ crowd_measurements : logs
    zones ||--o{ crowd_measurements : tracks
    zones ||--o{ predictions : maps
    zones ||--o{ risk_scores : assesses
    zones ||--o{ alerts : generates
    alerts ||--o{ guidance_messages : guides
    events ||--o{ incidents : reports
    zones ||--o{ incidents : locates
    agent_decisions ||--o{ action_executions : triggers
    events ||--o{ zone_staffing : deploys
    zones ||--o{ zone_staffing : mans
    events ||--o{ interventions : activates
    zones ||--o{ interventions : targets
    zones ||--o{ cameras : registers
    zones ||--o{ feedback : receives
```

## Description of Key Relationships

1. **Stadium & Events**: A stadium hosts multiple events. Primary configurations (such as capacity and geolocation) are defined at the stadium level.
2. **Events & Zones**: Each event instantiates a set of zones. Zones can be nested using the `parent_zone_id` relationship (for hierarchy modeling).
3. **Telemetry Ingestion (Measurements)**: Sensor telemetry (`crowd_measurements`) binds directly to the specific zone instance.
4. **Predictive Analytics (Predictions & Risk Scores)**: Predictions are associated with zones to identify potential crowding, feeding into unique real-time `risk_scores`.
5. **Directives Flow (Alerts -> Guidance)**: Crossed risk score thresholds trigger `alerts`, which compile role-scoped instructions inside `guidance_messages`.
6. **Incident Tickets**: Operational teams dispatch personnel to physical tickets registered under `incidents` mapped to events and zones.
7. **Autonomous Logic (Decisions -> Executions)**: The operations agent proposes a directive `agent_decisions` which generates concrete log actions under `action_executions` once approved.
8. **Topological Resource Allocation (Staffing & Interventions)**: Deployment rosters (`zone_staffing`) and active countermeasures (`interventions`) are traced at the event-zone boundary.
