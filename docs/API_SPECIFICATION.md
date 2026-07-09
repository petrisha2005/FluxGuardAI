# API Specification

Base path: `/api/v1`

## Authentication Strategy

- Use Supabase Auth JWTs for user authentication.
- FastAPI validates JWT signature, issuer, expiry, and role claims.
- Role-based access control applies to every protected endpoint.
- Operators and organizers access event-wide data.
- Volunteers access assigned zones.
- Fans access only public-safe guidance and their own feedback.

## Common Response Shape

Successful responses should include domain data and optional metadata.

```json
{
  "data": {},
  "meta": {
    "requestId": "uuid",
    "generatedAt": "2026-07-09T10:00:00Z"
  }
}
```

Error responses should be structured.

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request payload.",
    "details": []
  }
}
```

## Events

### GET /events

Purpose: list events visible to the authenticated user.

Status codes:

- 200: success.
- 401: missing or invalid token.
- 403: user cannot access event list.

### GET /events/{eventId}

Purpose: fetch event details.

Validation:

- eventId must be a UUID.

Status codes:

- 200: success.
- 404: event not found.

## Zones

### GET /events/{eventId}/zones

Purpose: list zones for an event.

Query parameters:

- zoneType: optional.
- includeGeometry: optional boolean.

Response includes zone id, name, type, capacity, parent zone, and current status.

## Crowd Measurements

### POST /events/{eventId}/measurements

Purpose: ingest crowd measurement from simulator or trusted integration.

Request:

```json
{
  "zoneId": "uuid",
  "measuredAt": "2026-07-09T10:00:00Z",
  "densityCount": 1200,
  "flowRatePerMinute": 340,
  "queueLength": 180,
  "sourceType": "simulator",
  "confidence": 0.92
}
```

Validation:

- densityCount, flowRatePerMinute, and queueLength must be non-negative.
- confidence must be between 0 and 1.
- sourceType must be from an allowed list.

Status codes:

- 201: measurement accepted.
- 400: malformed payload.
- 422: validation error.
- 403: source not authorized.

## Predictions

### GET /events/{eventId}/predictions

Purpose: return recent predictions.

Query parameters:

- zoneId: optional UUID.
- horizonMinutes: optional 20, 30, or 40.
- since: optional ISO datetime.

Status codes:

- 200: success.
- 422: invalid query.

### POST /events/{eventId}/predictions/run

Purpose: trigger prediction cycle. Restricted to operator, organizer, admin, or system integration.

Status codes:

- 202: prediction job accepted.
- 409: prediction job already running.

## Risk Scores

### GET /events/{eventId}/risk-scores

Purpose: fetch latest risk scores by zone.

Response includes riskScore, severity, drivers, prediction horizon, and generatedAt.

## Alerts

### GET /events/{eventId}/alerts

Query parameters:

- status.
- severity.
- zoneId.

### POST /events/{eventId}/alerts/{alertId}/acknowledge

Purpose: mark alert acknowledged by operator.

Status codes:

- 200: acknowledged.
- 409: alert already resolved.

### PATCH /events/{eventId}/alerts/{alertId}

Purpose: update status, notes, or assignment.

Validation:

- status transitions must follow allowed lifecycle.
- only authorized roles can resolve or escalate alerts.

## Guidance

### POST /events/{eventId}/guidance/generate

Purpose: generate role-specific AI guidance for an alert.

Request:

```json
{
  "alertId": "uuid",
  "audienceRole": "volunteer",
  "language": "en"
}
```

Response:

```json
{
  "data": {
    "guidanceId": "uuid",
    "audienceRole": "volunteer",
    "severity": "high",
    "headline": "Redirect fans from Gate B to Gate C.",
    "actions": [],
    "expiresAt": "2026-07-09T10:30:00Z"
  }
}
```

Status codes:

- 201: guidance generated.
- 202: fallback generated.
- 422: invalid audience role.
- 503: AI provider unavailable and fallback failed.

## Feedback

### POST /events/{eventId}/feedback

Purpose: capture user or field feedback.

Validation:

- rating must be within configured range.
- comment length must be limited.
- anonymous fan feedback must not include sensitive personal data.

Status codes:

- 201: feedback stored.
- 429: rate limit exceeded.

## WebSocket Channels

### /ws/events/{eventId}

Message types:

- zone_status_updated.
- prediction_updated.
- risk_score_updated.
- alert_created.
- alert_updated.
- guidance_created.

Authentication:

- JWT required during connection.
- Server authorizes channel subscription by role and event access.

