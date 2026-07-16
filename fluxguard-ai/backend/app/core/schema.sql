-- Supabase Postgres Schema definition for FluxGuard AI

-- 1. Venues Table
CREATE TABLE IF NOT EXISTS venues (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    country TEXT NOT NULL,
    timezone TEXT NOT NULL,
    metadata_json JSONB DEFAULT '{}'::jsonb
);

-- 2. Events Table
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL,
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
    venue_id UUID REFERENCES venues(id) ON DELETE SET NULL
);

-- 3. Zones Table
CREATE TABLE IF NOT EXISTS zones (
    id UUID PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    zone_type TEXT NOT NULL,
    capacity INTEGER NOT NULL,
    parent_zone_id UUID REFERENCES zones(id) ON DELETE SET NULL,
    status TEXT NOT NULL
);

-- 4. Crowd Measurements Table
CREATE TABLE IF NOT EXISTS crowd_measurements (
    id UUID PRIMARY KEY,
    zone_id UUID NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
    measured_at TIMESTAMP WITH TIME ZONE NOT NULL,
    density_count INTEGER NOT NULL,
    flow_rate_per_minute INTEGER NOT NULL,
    queue_length INTEGER NOT NULL,
    source_type TEXT NOT NULL,
    confidence DOUBLE PRECISION NOT NULL,
    ingested_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- 5. Predictions Table
CREATE TABLE IF NOT EXISTS predictions (
    id UUID PRIMARY KEY,
    zone_id UUID NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
    horizon_minutes INTEGER NOT NULL,
    predicted_density INTEGER NOT NULL,
    predicted_queue_length INTEGER NOT NULL,
    predicted_flow_rate INTEGER NOT NULL,
    confidence_interval_low DOUBLE PRECISION NOT NULL,
    confidence_interval_high DOUBLE PRECISION NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    model_version TEXT NOT NULL
);

-- 6. Risk Scores Table
CREATE TABLE IF NOT EXISTS risk_scores (
    id UUID PRIMARY KEY,
    zone_id UUID NOT NULL UNIQUE REFERENCES zones(id) ON DELETE CASCADE,
    risk_score INTEGER NOT NULL,
    severity TEXT NOT NULL,
    drivers_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    prediction_horizon_minutes INTEGER NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- 7. Alerts Table
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY,
    zone_id UUID NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
    severity TEXT NOT NULL,
    status TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    assignee TEXT,
    notes TEXT
);

-- 8. Guidance Messages Table
CREATE TABLE IF NOT EXISTS guidance_messages (
    id UUID PRIMARY KEY,
    alert_id UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
    audience_role TEXT NOT NULL,
    severity TEXT NOT NULL,
    headline TEXT NOT NULL,
    actions_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    prompt_version TEXT NOT NULL,
    schema_version TEXT NOT NULL,
    model_provider TEXT NOT NULL,
    model_name TEXT NOT NULL,
    input_context_hash TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING_APPROVAL'
);

-- 9. Feedback Table
CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY,
    zone_id UUID NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL,
    comment VARCHAR(500) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_zones_event_id ON zones(event_id);
CREATE INDEX IF NOT EXISTS idx_crowd_measurements_zone_time ON crowd_measurements(zone_id, measured_at DESC);
CREATE INDEX IF NOT EXISTS idx_predictions_zone_time ON predictions(zone_id, generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_predictions_zone_horizon ON predictions(zone_id, horizon_minutes, generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_zone_status_severity ON alerts(zone_id, status, severity, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_guidance_alert_role ON guidance_messages(alert_id, audience_role);
CREATE INDEX IF NOT EXISTS idx_feedback_zone_time ON feedback(zone_id, created_at DESC);
