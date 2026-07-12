import asyncio
import json
import logging
import os
import threading
from datetime import UTC, datetime
from uuid import UUID

import asyncpg

from app.core.config import get_settings

logger = logging.getLogger("fluxguard.database")

# Mock database tables using thread-safe structures for local offline fallback
_lock = threading.Lock()

# Seed Event
_events = {
    UUID("e0000000-0000-0000-0000-000000000000"): {
        "id": UUID("e0000000-0000-0000-0000-000000000000"),
        "name": "FIFA World Cup 2026 - Opening Match",
        "description": "Opening match at the stadium",
        "status": "active",
        "starts_at": datetime(2026, 6, 11, 18, 0, 0),
        "ends_at": datetime(2026, 6, 11, 22, 0, 0),
    }
}

# Seed Zones mapped to the Event ID
_zones = {
    UUID("00000000-0000-0000-0000-000000000001"): {
        "id": UUID("00000000-0000-0000-0000-000000000001"),
        "event_id": UUID("e0000000-0000-0000-0000-000000000000"),
        "name": "North Gate",
        "type": "gate",
        "capacity": 2000,
        "parent_zone_id": None,
        "status": "open",
    },
    UUID("00000000-0000-0000-0000-000000000002"): {
        "id": UUID("00000000-0000-0000-0000-000000000002"),
        "event_id": UUID("e0000000-0000-0000-0000-000000000000"),
        "name": "East Concourse",
        "type": "concourse",
        "capacity": 5000,
        "parent_zone_id": None,
        "status": "open",
    },
    UUID("00000000-0000-0000-0000-000000000003"): {
        "id": UUID("00000000-0000-0000-0000-000000000003"),
        "event_id": UUID("e0000000-0000-0000-0000-000000000000"),
        "name": "Gate C",
        "type": "gate",
        "capacity": 1500,
        "parent_zone_id": None,
        "status": "open",
    },
    UUID("00000000-0000-0000-0000-000000000004"): {
        "id": UUID("00000000-0000-0000-0000-000000000004"),
        "event_id": UUID("e0000000-0000-0000-0000-000000000000"),
        "name": "West Entrance",
        "type": "gate",
        "capacity": 1800,
        "parent_zone_id": None,
        "status": "open",
    },
}

_measurements = []
_predictions = []
_risk_scores = {}
_alerts = {}
_guidance = []
_feedback = []


# Async bridge helper to run async queries in sync database context safely
def run_async(coro):
    try:
        asyncio.get_running_loop()
    except RuntimeError:
        return asyncio.run(coro)

    # If active event loop is running, delegate execution to a safe background thread
    result = None
    exception = None

    def worker():
        nonlocal result, exception
        try:
            result = asyncio.run(coro)
        except Exception as e:
            exception = e

    thread = threading.Thread(target=worker)
    thread.start()
    thread.join()

    if exception:
        raise exception
    return result


# Connection Pool Setup
_pool: asyncpg.Pool | None = None
_pool_lock = threading.Lock()
_init_attempted = False


async def _seed_database_if_empty() -> None:
    global _pool
    if not _pool:
        return
    async with _pool.acquire() as conn:
        # Load schema.sql to initialize tables
        schema_path = os.path.join(os.path.dirname(__file__), "schema.sql")  # noqa: ASYNC240
        if os.path.exists(schema_path):  # noqa: ASYNC240
            with open(schema_path) as f:  # noqa: ASYNC230
                schema_sql = f.read()
            await conn.execute(schema_sql)
            await conn.execute(
                "ALTER TABLE guidance_messages ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'PENDING_APPROVAL'"
            )

        count = await conn.fetchval("SELECT COUNT(*) FROM venues")
        if count == 0:
            logger.info("Database is empty. Seeding initial event and zones...")
            venue_id = UUID("v0000000-0000-0000-0000-000000000000")
            await conn.execute(
                "INSERT INTO venues (id, name, city, country, timezone) VALUES ($1, $2, $3, $4, $5)",
                venue_id,
                "Lucusa Stadium",
                "Lucusa",
                "Lusaka",
                "UTC",
            )

            event_id = UUID("e0000000-0000-0000-0000-000000000000")
            await conn.execute(
                "INSERT INTO events (id, name, description, status, starts_at, ends_at, venue_id) VALUES ($1, $2, $3, $4, $5, $6, $7)",
                event_id,
                "FIFA World Cup 2026 - Opening Match",
                "Opening match at the stadium",
                "active",
                datetime(2026, 6, 11, 18, 0, 0),
                datetime(2026, 6, 11, 22, 0, 0),
                venue_id,
            )

            zones_data = [
                (
                    UUID("00000000-0000-0000-0000-000000000001"),
                    event_id,
                    "North Gate",
                    "gate",
                    2000,
                    "open",
                ),
                (
                    UUID("00000000-0000-0000-0000-000000000002"),
                    event_id,
                    "East Concourse",
                    "concourse",
                    5000,
                    "open",
                ),
                (
                    UUID("00000000-0000-0000-0000-000000000003"),
                    event_id,
                    "Gate C",
                    "gate",
                    1500,
                    "open",
                ),
                (
                    UUID("00000000-0000-0000-0000-000000000004"),
                    event_id,
                    "West Entrance",
                    "gate",
                    1800,
                    "open",
                ),
            ]
            for z_id, ev_id, name, z_type, cap, status in zones_data:
                await conn.execute(
                    "INSERT INTO zones (id, event_id, name, zone_type, capacity, status) VALUES ($1, $2, $3, $4, $5, $6)",
                    z_id,
                    ev_id,
                    name,
                    z_type,
                    cap,
                    status,
                )


def get_db_pool() -> asyncpg.Pool | None:
    global _pool, _init_attempted
    settings = get_settings()
    if not settings.database_url:
        return None

    if _pool is not None:
        return _pool

    with _pool_lock:
        if _pool is not None or _init_attempted:
            return _pool
        _init_attempted = True
        try:
            logger.info("Initializing Supabase database connection pool...")
            _pool = run_async(
                asyncpg.create_pool(
                    dsn=settings.database_url,
                    min_size=1,
                    max_size=5,
                )
            )
            run_async(_seed_database_if_empty())
            logger.info("Supabase database connection initialized successfully.")
        except Exception as e:
            logger.warning(
                f"Failed to connect to Supabase database. Falling back to in-memory: {e}"
            )
            _pool = None

    return _pool


# --- Database Queries mapping to PostgreSQL or local fallbacks ---


# Events
async def _get_all_events() -> list[dict]:
    pool = get_db_pool()
    if not pool:
        return []
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT id, name, description, status, starts_at, ends_at FROM events"
        )
        return [dict(row) for row in rows]


def get_all_events() -> list[dict]:
    pool = get_db_pool()
    if pool:
        try:
            return run_async(_get_all_events())
        except Exception as e:
            logger.warning(f"Postgres query failed: {e}. Falling back to in-memory.")
    with _lock:
        return list(_events.values())


async def _get_event_by_id(event_id: UUID) -> dict | None:
    pool = get_db_pool()
    if not pool:
        return None
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id, name, description, status, starts_at, ends_at FROM events WHERE id = $1",
            event_id,
        )
        return dict(row) if row else None


def get_event_by_id(event_id: UUID) -> dict | None:
    pool = get_db_pool()
    if pool:
        try:
            return run_async(_get_event_by_id(event_id))
        except Exception as e:
            logger.warning(f"Postgres query failed: {e}. Falling back to in-memory.")
    with _lock:
        return _events.get(event_id)


# Zones
async def _get_zones_for_event(event_id: UUID, zone_type: str | None = None) -> list[dict]:
    pool = get_db_pool()
    if not pool:
        return []
    async with pool.acquire() as conn:
        if zone_type:
            rows = await conn.fetch(
                "SELECT id, event_id, name, zone_type as type, capacity, parent_zone_id, status FROM zones WHERE event_id = $1 AND zone_type = $2",
                event_id,
                zone_type,
            )
        else:
            rows = await conn.fetch(
                "SELECT id, event_id, name, zone_type as type, capacity, parent_zone_id, status FROM zones WHERE event_id = $1",
                event_id,
            )
        return [dict(row) for row in rows]


def get_zones_for_event(event_id: UUID, zone_type: str | None = None) -> list[dict]:
    pool = get_db_pool()
    if pool:
        try:
            return run_async(_get_zones_for_event(event_id, zone_type))
        except Exception as e:
            logger.warning(f"Postgres query failed: {e}. Falling back to in-memory.")
    with _lock:
        results = [z for z in _zones.values() if z["event_id"] == event_id]
        if zone_type:
            results = [z for z in results if z["type"] == zone_type]
        return results


async def _get_zone_by_id(zone_id: UUID) -> dict | None:
    pool = get_db_pool()
    if not pool:
        return None
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id, event_id, name, zone_type as type, capacity, parent_zone_id, status FROM zones WHERE id = $1",
            zone_id,
        )
        return dict(row) if row else None


def get_zone_by_id(zone_id: UUID) -> dict | None:
    pool = get_db_pool()
    if pool:
        try:
            return run_async(_get_zone_by_id(zone_id))
        except Exception as e:
            logger.warning(f"Postgres query failed: {e}. Falling back to in-memory.")
    with _lock:
        return _zones.get(zone_id)


# Measurements
async def _add_measurement(m: dict) -> None:
    pool = get_db_pool()
    if not pool:
        return
    async with pool.acquire() as conn:
        await conn.execute(
            "INSERT INTO crowd_measurements (id, zone_id, measured_at, density_count, flow_rate_per_minute, queue_length, source_type, confidence, ingested_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
            m["id"],
            m["zone_id"],
            m["measured_at"],
            m["density_count"],
            m["flow_rate_per_minute"],
            m["queue_length"],
            m["source_type"],
            m["confidence"],
            m["ingested_at"],
        )


def add_measurement(measurement: dict) -> None:
    pool = get_db_pool()
    if pool:
        try:
            run_async(_add_measurement(measurement))
            return
        except Exception as e:
            logger.warning(f"Postgres query failed: {e}. Falling back to in-memory.")
    with _lock:
        _measurements.append(measurement)


async def _get_all_measurements() -> list[dict]:
    pool = get_db_pool()
    if not pool:
        return []
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT id, zone_id, measured_at, density_count, flow_rate_per_minute, queue_length, source_type, confidence, ingested_at FROM crowd_measurements"
        )
        return [dict(row) for row in rows]


def get_all_measurements() -> list[dict]:
    pool = get_db_pool()
    if pool:
        try:
            return run_async(_get_all_measurements())
        except Exception as e:
            logger.warning(f"Postgres query failed: {e}. Falling back to in-memory.")
    with _lock:
        return list(_measurements)


# Predictions
async def _add_prediction(p: dict) -> None:
    pool = get_db_pool()
    if not pool:
        return
    async with pool.acquire() as conn:
        await conn.execute(
            "INSERT INTO predictions (id, zone_id, horizon_minutes, predicted_density, predicted_queue_length, predicted_flow_rate, confidence_interval_low, confidence_interval_high, generated_at, model_version) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)",
            p["id"],
            p["zone_id"],
            p["horizon_minutes"],
            p["predicted_density"],
            p["predicted_queue_length"],
            p["predicted_flow_rate"],
            p["confidence_interval_low"],
            p["confidence_interval_high"],
            p["generated_at"],
            p["model_version"],
        )


def add_prediction(prediction: dict) -> None:
    pool = get_db_pool()
    if pool:
        try:
            run_async(_add_prediction(prediction))
            return
        except Exception as e:
            logger.warning(f"Postgres query failed: {e}. Falling back to in-memory.")
    with _lock:
        _predictions.append(prediction)


async def _get_predictions(
    event_id: UUID,
    zone_id: UUID | None = None,
    horizon_minutes: int | None = None,
    since: datetime | None = None,
) -> list[dict]:
    pool = get_db_pool()
    if not pool:
        return []
    async with pool.acquire() as conn:
        query = """
            SELECT p.id, p.zone_id, p.horizon_minutes, p.predicted_density, p.predicted_queue_length, p.predicted_flow_rate, p.confidence_interval_low, p.confidence_interval_high, p.generated_at, p.model_version
            FROM predictions p
            JOIN zones z ON p.zone_id = z.id
            WHERE z.event_id = $1
        """
        params = [event_id]
        if zone_id:
            params.append(zone_id)
            query += f" AND p.zone_id = ${len(params)}"
        if horizon_minutes is not None:
            params.append(horizon_minutes)
            query += f" AND p.horizon_minutes = ${len(params)}"
        if since:
            params.append(since)
            query += f" AND p.generated_at >= ${len(params)}"

        rows = await conn.fetch(query, *params)
        return [dict(row) for row in rows]


def get_predictions(
    event_id: UUID,
    zone_id: UUID | None = None,
    horizon_minutes: int | None = None,
    since: datetime | None = None,
) -> list[dict]:
    pool = get_db_pool()
    if pool:
        try:
            return run_async(_get_predictions(event_id, zone_id, horizon_minutes, since))
        except Exception as e:
            logger.warning(f"Postgres query failed: {e}. Falling back to in-memory.")
    with _lock:
        event_zone_ids = {z["id"] for z in _zones.values() if z["event_id"] == event_id}
        results = [p for p in _predictions if p["zone_id"] in event_zone_ids]

        if zone_id:
            results = [p for p in results if p["zone_id"] == zone_id]
        if horizon_minutes is not None:
            results = [p for p in results if p["horizon_minutes"] == horizon_minutes]
        if since:
            results = [p for p in results if p["generated_at"] >= since]

        return results


# Risk Scores
async def _update_risk_score(zone_id: UUID, rs: dict) -> None:
    pool = get_db_pool()
    if not pool:
        return
    async with pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO risk_scores (id, zone_id, risk_score, severity, drivers_json, prediction_horizon_minutes, generated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (zone_id) DO UPDATE SET
                risk_score = EXCLUDED.risk_score,
                severity = EXCLUDED.severity,
                drivers_json = EXCLUDED.drivers_json,
                prediction_horizon_minutes = EXCLUDED.prediction_horizon_minutes,
                generated_at = EXCLUDED.generated_at
            """,
            rs["id"],
            rs["zone_id"],
            rs["risk_score"],
            rs["severity"],
            json.dumps(rs["drivers"]),
            rs["prediction_horizon_minutes"],
            rs["generated_at"],
        )


def update_risk_score(zone_id: UUID, risk_score: dict) -> None:
    pool = get_db_pool()
    if pool:
        try:
            run_async(_update_risk_score(zone_id, risk_score))
            return
        except Exception as e:
            logger.warning(f"Postgres query failed: {e}. Falling back to in-memory.")
    with _lock:
        _risk_scores[zone_id] = risk_score


async def _get_latest_risk_scores(event_id: UUID) -> list[dict]:
    pool = get_db_pool()
    if not pool:
        return []
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT r.id, r.zone_id, r.risk_score, r.severity, r.drivers_json, r.prediction_horizon_minutes, r.generated_at
            FROM risk_scores r
            JOIN zones z ON r.zone_id = z.id
            WHERE z.event_id = $1
            """,
            event_id,
        )
        results = []
        for row in rows:
            d = dict(row)
            d["drivers"] = json.loads(d.pop("drivers_json"))
            results.append(d)
        return results


def get_latest_risk_scores(event_id: UUID) -> list[dict]:
    pool = get_db_pool()
    if pool:
        try:
            return run_async(_get_latest_risk_scores(event_id))
        except Exception as e:
            logger.warning(f"Postgres query failed: {e}. Falling back to in-memory.")
    with _lock:
        event_zone_ids = {z["id"] for z in _zones.values() if z["event_id"] == event_id}
        return [score for zone_id, score in _risk_scores.items() if zone_id in event_zone_ids]


# Alerts
async def _add_alert(a: dict) -> None:
    pool = get_db_pool()
    if not pool:
        return
    async with pool.acquire() as conn:
        await conn.execute(
            "INSERT INTO alerts (id, zone_id, severity, status, title, description, timestamp, assignee, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
            a["id"],
            a["zone_id"],
            a["severity"],
            a["status"],
            a["title"],
            a["description"],
            a["timestamp"],
            a.get("assignee"),
            a.get("notes"),
        )


def add_alert(alert: dict) -> None:
    pool = get_db_pool()
    if pool:
        try:
            run_async(_add_alert(alert))
            return
        except Exception as e:
            logger.warning(f"Postgres query failed: {e}. Falling back to in-memory.")
    with _lock:
        _alerts[alert["id"]] = alert


async def _get_alert_by_id(alert_id: UUID) -> dict | None:
    pool = get_db_pool()
    if not pool:
        return None
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id, zone_id, severity, status, title, description, timestamp, assignee, notes FROM alerts WHERE id = $1",
            alert_id,
        )
        return dict(row) if row else None


def get_alert_by_id(alert_id: UUID) -> dict | None:
    pool = get_db_pool()
    if pool:
        try:
            return run_async(_get_alert_by_id(alert_id))
        except Exception as e:
            logger.warning(f"Postgres query failed: {e}. Falling back to in-memory.")
    with _lock:
        return _alerts.get(alert_id)


async def _update_alert(
    alert_id: UUID, status: str, notes: str | None = None, assignee: str | None = None
) -> dict | None:
    pool = get_db_pool()
    if not pool:
        return None
    async with pool.acquire() as conn:
        query = "UPDATE alerts SET status = $1"
        params = [status]
        if notes is not None:
            params.append(notes)
            query += f", notes = ${len(params)}"
        if assignee is not None:
            params.append(assignee)
            query += f", assignee = ${len(params)}"
        params.append(alert_id)
        query += f" WHERE id = ${len(params)} RETURNING id, zone_id, severity, status, title, description, timestamp, assignee, notes"

        row = await conn.fetchrow(query, *params)
        return dict(row) if row else None


def update_alert(
    alert_id: UUID, status: str, notes: str | None = None, assignee: str | None = None
) -> dict | None:
    pool = get_db_pool()
    if pool:
        try:
            return run_async(_update_alert(alert_id, status, notes, assignee))
        except Exception as e:
            logger.warning(f"Postgres query failed: {e}. Falling back to in-memory.")
    with _lock:
        if alert_id in _alerts:
            _alerts[alert_id]["status"] = status
            if notes is not None:
                _alerts[alert_id]["notes"] = notes
            if assignee is not None:
                _alerts[alert_id]["assignee"] = assignee
            return _alerts[alert_id]
        return None


async def _get_alerts(
    event_id: UUID,
    status: str | None = None,
    severity: str | None = None,
    zone_id: UUID | None = None,
) -> list[dict]:
    pool = get_db_pool()
    if not pool:
        return []
    async with pool.acquire() as conn:
        query = """
            SELECT a.id, a.zone_id, a.severity, a.status, a.title, a.description, a.timestamp, a.assignee, a.notes
            FROM alerts a
            JOIN zones z ON a.zone_id = z.id
            WHERE z.event_id = $1
        """
        params = [event_id]
        if status:
            params.append(status)
            query += f" AND a.status = ${len(params)}"
        if severity:
            params.append(severity)
            query += f" AND a.severity = ${len(params)}"
        if zone_id:
            params.append(zone_id)
            query += f" AND a.zone_id = ${len(params)}"

        rows = await conn.fetch(query, *params)
        return [dict(row) for row in rows]


def get_alerts(
    event_id: UUID,
    status: str | None = None,
    severity: str | None = None,
    zone_id: UUID | None = None,
) -> list[dict]:
    pool = get_db_pool()
    if pool:
        try:
            return run_async(_get_alerts(event_id, status, severity, zone_id))
        except Exception as e:
            logger.warning(f"Postgres query failed: {e}. Falling back to in-memory.")
    with _lock:
        event_zone_ids = {z["id"] for z in _zones.values() if z["event_id"] == event_id}
        results = [a for a in _alerts.values() if a["zone_id"] in event_zone_ids]

        if status:
            results = [a for a in results if a["status"] == status]
        if severity:
            results = [a for a in results if a["severity"] == severity]
        if zone_id:
            results = [a for a in results if a["zone_id"] == zone_id]

        return results


# Guidance
async def _add_guidance(g: dict) -> None:
    pool = get_db_pool()
    if not pool:
        return
    async with pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO guidance_messages (
                id, alert_id, audience_role, severity, headline, actions_json, expires_at, payload_json,
                prompt_version, schema_version, model_provider, model_name, input_context_hash, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            """,
            g.get("id", g.get("guidance_id")),
            g["alert_id"],
            g["audience_role"],
            g["severity"],
            g["headline"],
            json.dumps(g["actions"]),
            g["expires_at"],
            json.dumps(g["payload"]),
            g["prompt_version"],
            g["schema_version"],
            g["model_provider"],
            g["model_name"],
            g["input_context_hash"],
            g.get("status", "PENDING_APPROVAL"),
        )


def add_guidance(guidance_record: dict) -> None:
    pool = get_db_pool()
    if pool:
        try:
            run_async(_add_guidance(guidance_record))
            return
        except Exception as e:
            logger.warning(f"Postgres query failed: {e}. Falling back to in-memory.")
    with _lock:
        _guidance.append(guidance_record)


async def _get_guidance_for_alert(alert_id: UUID, audience_role: str) -> dict | None:
    pool = get_db_pool()
    if not pool:
        return None
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT id, alert_id, audience_role, severity, headline, actions_json, expires_at, payload_json,
                   prompt_version, schema_version, model_provider, model_name, input_context_hash, status
            FROM guidance_messages
            WHERE alert_id = $1 AND audience_role = $2
            """,
            alert_id,
            audience_role,
        )
        if row:
            d = dict(row)
            d["guidance_id"] = d.pop("id")
            d["actions"] = json.loads(d.pop("actions_json"))
            d["payload"] = json.loads(d.pop("payload_json"))
            return d
        return None


def get_guidance_for_alert(alert_id: UUID, audience_role: str) -> dict | None:
    pool = get_db_pool()
    if pool:
        try:
            return run_async(_get_guidance_for_alert(alert_id, audience_role))
        except Exception as e:
            logger.warning(f"Postgres query failed: {e}. Falling back to in-memory.")
    with _lock:
        for g in _guidance:
            if g["alert_id"] == alert_id and g["audience_role"] == audience_role:
                return g
        return None


async def _get_guidance_by_id(guidance_id: UUID) -> dict | None:
    pool = get_db_pool()
    if not pool:
        return None
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT id, alert_id, audience_role, severity, headline, actions_json, expires_at, payload_json,
                   prompt_version, schema_version, model_provider, model_name, input_context_hash, status
            FROM guidance_messages
            WHERE id = $1
            """,
            guidance_id,
        )
        if row:
            d = dict(row)
            d["guidance_id"] = d.pop("id")
            d["actions"] = json.loads(d.pop("actions_json"))
            d["payload"] = json.loads(d.pop("payload_json"))
            return d
        return None


def get_guidance_by_id(guidance_id: UUID) -> dict | None:
    pool = get_db_pool()
    if pool:
        try:
            return run_async(_get_guidance_by_id(guidance_id))
        except Exception as e:
            logger.warning(f"Postgres query failed: {e}. Falling back to in-memory.")
    with _lock:
        for g in _guidance:
            g_id = g.get("id", g.get("guidance_id"))
            if g_id == guidance_id:
                return g
        return None


async def _update_guidance_status(guidance_id: UUID, status: str) -> dict | None:
    pool = get_db_pool()
    if not pool:
        return None
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            UPDATE guidance_messages
            SET status = $2
            WHERE id = $1
            RETURNING id, alert_id, audience_role, severity, headline, actions_json, expires_at, payload_json,
                      prompt_version, schema_version, model_provider, model_name, input_context_hash, status
            """,
            guidance_id,
            status,
        )
        if row:
            d = dict(row)
            d["guidance_id"] = d.pop("id")
            d["actions"] = json.loads(d.pop("actions_json"))
            d["payload"] = json.loads(d.pop("payload_json"))
            return d
        return None


def update_guidance_status(guidance_id: UUID, status: str) -> dict | None:
    pool = get_db_pool()
    if pool:
        try:
            return run_async(_update_guidance_status(guidance_id, status))
        except Exception as e:
            logger.warning(f"Postgres query failed: {e}. Falling back to in-memory.")
    with _lock:
        for g in _guidance:
            g_id = g.get("id", g.get("guidance_id"))
            if g_id == guidance_id:
                g["status"] = status
                return g
        return None


# Feedback
async def _add_feedback(f: dict) -> None:
    pool = get_db_pool()
    if not pool:
        return
    async with pool.acquire() as conn:
        await conn.execute(
            "INSERT INTO feedback (id, zone_id, rating, comment, created_at) VALUES ($1, $2, $3, $4, $5)",
            f["id"],
            f["zone_id"],
            f["rating"],
            f["comment"],
            f["created_at"],
        )


def add_feedback(feedback_record: dict) -> None:
    pool = get_db_pool()
    if pool:
        try:
            run_async(_add_feedback(feedback_record))
            return
        except Exception as e:
            logger.warning(f"Postgres query failed: {e}. Falling back to in-memory.")
    with _lock:
        _feedback.append(feedback_record)


async def _get_all_feedback() -> list[dict]:
    pool = get_db_pool()
    if not pool:
        return []
    async with pool.acquire() as conn:
        rows = await conn.fetch("SELECT id, zone_id, rating, comment, created_at FROM feedback")
        return [dict(row) for row in rows]


def get_all_feedback() -> list[dict]:
    pool = get_db_pool()
    if pool:
        try:
            return run_async(_get_all_feedback())
        except Exception as e:
            logger.warning(f"Postgres query failed: {e}. Falling back to in-memory.")
    with _lock:
        return list(_feedback)


async def _get_active_approved_guidance(event_id: UUID) -> list[dict]:
    pool = get_db_pool()
    if not pool:
        return []
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT gm.id, gm.alert_id, gm.audience_role, gm.severity, gm.headline, gm.actions_json, gm.expires_at, gm.payload_json,
                   gm.prompt_version, gm.schema_version, gm.model_provider, gm.model_name, gm.input_context_hash, gm.status
            FROM guidance_messages gm
            JOIN alerts a ON gm.alert_id = a.id
            JOIN zones z ON a.zone_id = z.id
            WHERE z.event_id = $1 AND gm.status = 'APPROVED' AND gm.expires_at > $2
            """,
            event_id,
            datetime.now(UTC),
        )
        results = []
        for row in rows:
            d = dict(row)
            d["guidance_id"] = d.pop("id")
            d["actions"] = json.loads(d.pop("actions_json"))
            d["payload"] = json.loads(d.pop("payload_json"))
            results.append(d)
        return results


def get_active_approved_guidance(event_id: UUID) -> list[dict]:
    pool = get_db_pool()
    if pool:
        try:
            return run_async(_get_active_approved_guidance(event_id))
        except Exception as e:
            logger.warning(f"Postgres query failed: {e}. Falling back to in-memory.")
    with _lock:
        now = datetime.now(UTC)
        results = []
        for g in _guidance:
            alert = _alerts.get(g["alert_id"])
            if not alert:
                continue
            zone = _zones.get(alert["zone_id"])
            if not zone or zone["event_id"] != event_id:
                continue
            expires = g["expires_at"]
            if expires.tzinfo is None:
                expires = expires.replace(tzinfo=UTC)
            if g.get("status") == "APPROVED" and expires > now:
                results.append(g)
        return results


# DB Reset Utility
async def _clear_database() -> None:
    pool = get_db_pool()
    if not pool:
        return
    async with pool.acquire() as conn:
        await conn.execute(
            "TRUNCATE TABLE crowd_measurements, predictions, risk_scores, alerts, guidance_messages, feedback CASCADE"
        )


def clear_database() -> None:
    pool = get_db_pool()
    if pool:
        try:
            run_async(_clear_database())
        except Exception as e:
            logger.warning(f"Postgres query failed: {e}. Falling back to in-memory.")
    with _lock:
        _measurements.clear()
        _predictions.clear()
        _risk_scores.clear()
        _alerts.clear()
        _guidance.clear()
        _feedback.clear()
