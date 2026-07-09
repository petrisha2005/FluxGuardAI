# FluxGuard AI Project Overview

Tagline: **Predict. Prevent. Protect.**

## Vision

FluxGuard AI is a predictive crowd orchestration platform for mega-events such as FIFA World Cup 2026. It turns live crowd signals into early warnings and coordinated action before congestion becomes dangerous.

## Mission

Help event teams protect attendees, reduce wait times, and improve crowd flow by predicting congestion 20-40 minutes in advance and generating clear, role-specific guidance for fans, volunteers, and operators.

## Problem Statement

Mega-events produce dense, fast-changing crowd movement across gates, concourses, transport hubs, fan zones, concessions, restrooms, and emergency routes. Traditional monitoring is reactive: teams often identify congestion only after queues have formed, routes are blocked, or safety risk has increased.

Common issues include:

- Late detection of congestion and unsafe crowd density.
- Fragmented data from sensors, ticketing, transport, weather, and manual reports.
- Generic communication that does not match each user's role or location.
- Slow operational response across volunteers, control rooms, and attendees.
- Limited post-event feedback loops for improving future plans.

## Solution

FluxGuard AI combines real-time data ingestion, time-series ML forecasting, risk scoring, and Generative AI guidance. The platform predicts future congestion by zone, explains risk drivers, and recommends proactive actions.

The system provides:

- Predictive zone-level congestion forecasts.
- Risk scores and alert severity levels.
- Live operational dashboards.
- Fan-facing guidance for safer route choices.
- Volunteer instructions tailored to their assignment and location.
- Operator summaries for rapid incident response.
- Feedback capture to improve future predictions.

## Key Features

- 20-40 minute crowd congestion prediction.
- Real-time crowd map and zone status.
- Risk scoring by zone, gate, corridor, and transit connection.
- Claude-powered role-specific guidance.
- WebSocket-based live updates.
- Supabase-backed event, zone, alert, and feedback data.
- Historical simulation for hackathon and demo readiness.
- Accessible, responsive operator and attendee experiences.
- Audit logs for alerts, recommendations, and operator decisions.

## Target Users

- Fans attending the event.
- Volunteers managing local crowd movement.
- Stadium operators in the control room.
- Event organizers responsible for safety, throughput, and experience.

## Success Metrics

- Prediction lead time: 20-40 minutes before congestion threshold breach.
- Forecast accuracy: target mean absolute percentage error below 15% for zone load forecasts in MVP simulations.
- Alert precision: reduce false critical alerts through severity calibration.
- Operational response time: reduce time from risk detection to recommended action below 60 seconds.
- Fan wait time: reduce average gate or concession wait time in simulated scenarios.
- Accessibility: WCAG 2.1 AA compliance for core workflows.
- Reliability: 99.9% uptime target for production event windows.
- Security: no unauthenticated access to protected operational APIs.
- Usability: operators can identify top risk zones within 10 seconds.

