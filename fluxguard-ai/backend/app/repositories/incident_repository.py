from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy.orm import Session

from app.db.models import Alert, GuidanceMessage, Incident, Zone


def utc_now() -> datetime:
    return datetime.now(UTC)


class IncidentRepository:
    def __init__(self, db: Session):
        self.db = db

    def add_incident(self, incident: dict) -> None:
        inc = Incident(
            id=incident.get("id") or UUID(int=0),
            event_id=incident["event_id"],
            zone_id=incident.get("zone_id"),
            type=incident["type"],
            severity=incident["severity"],
            status=incident["status"],
            location=incident.get("location") or "Main Plaza",
            description=incident.get("description"),
            responder_name=incident.get("responder_name"),
            created_at=incident.get("created_at") or utc_now(),
        )
        self.db.add(inc)
        self.db.commit()

    def get_incidents(self, event_id: UUID) -> list[dict]:
        incidents = (
            self.db.query(Incident)
            .filter(Incident.event_id == event_id)
            .order_by(Incident.created_at.desc())
            .all()
        )
        return [
            {
                "id": inc.id,
                "event_id": inc.event_id,
                "zone_id": inc.zone_id or inc.event_id,  # Use zone_id when present
                "type": inc.type,
                "severity": inc.severity,
                "status": inc.status,
                "description": inc.description or "",
                "responder_name": inc.responder_name,
                "createdAt": inc.created_at.isoformat(),
                "resolvedAt": None,
            }
            for inc in incidents
        ]

    def update_incident_status(
        self, incident_id: UUID, status: str, responder_name: str | None = None
    ) -> dict | None:
        inc = self.db.query(Incident).filter(Incident.id == incident_id).first()
        if not inc:
            return None
        inc.status = status
        if responder_name is not None:
            inc.responder_name = responder_name
        if status.upper() == "RESOLVED":
            inc.resolved_at = utc_now()
        self.db.commit()
        return {
            "id": inc.id,
            "event_id": inc.event_id,
            "zone_id": inc.zone_id or inc.event_id,
            "type": inc.type,
            "severity": inc.severity,
            "status": inc.status,
            "description": inc.description or "",
            "responder_name": inc.responder_name,
            "created_at": inc.created_at,
            "resolved_at": inc.resolved_at,
        }

    def add_alert(self, alert_data: dict) -> None:
        alt = Alert(
            id=alert_data.get("id") or UUID(int=0),
            zone_id=alert_data["zone_id"],
            severity=alert_data["severity"],
            status=alert_data["status"],
            title=alert_data["title"],
            description=alert_data["description"],
            timestamp=alert_data.get("timestamp") or utc_now(),
            assignee=alert_data.get("assignee"),
            notes=alert_data.get("notes"),
        )
        self.db.add(alt)
        self.db.commit()

    def get_alert_by_id(self, alert_id: UUID) -> dict | None:
        alt = self.db.query(Alert).filter(Alert.id == alert_id).first()
        if not alt:
            return None
        return {
            "id": alt.id,
            "zone_id": alt.zone_id,
            "severity": alt.severity,
            "status": alt.status,
            "title": alt.title,
            "description": alt.description,
            "timestamp": alt.timestamp,
            "assignee": alt.assignee,
            "notes": alt.notes,
        }

    def update_alert(
        self,
        alert_id: UUID,
        assignee: str | None = None,
        status: str | None = None,
        notes: str | None = None,
    ) -> dict | None:
        alt = self.db.query(Alert).filter(Alert.id == alert_id).first()
        if not alt:
            return None
        if assignee is not None:
            alt.assignee = assignee
        if status is not None:
            alt.status = status
        if notes is not None:
            alt.notes = notes
        self.db.commit()
        return {
            "id": alt.id,
            "zone_id": alt.zone_id,
            "severity": alt.severity,
            "status": alt.status,
            "title": alt.title,
            "description": alt.description,
            "timestamp": alt.timestamp,
            "assignee": alt.assignee,
            "notes": alt.notes,
        }

    def get_alerts(self, event_id: UUID, status: str | None = None) -> list[dict]:
        query = (
            self.db.query(Alert)
            .join(Zone, Alert.zone_id == Zone.id)
            .filter(Zone.event_id == event_id)
        )
        if status:
            query = query.filter(Alert.status == status)
        alerts = query.order_by(Alert.timestamp.desc()).all()
        return [
            {
                "id": alt.id,
                "zone_id": alt.zone_id,
                "severity": alt.severity,
                "status": alt.status,
                "title": alt.title,
                "description": alt.description,
                "timestamp": alt.timestamp,
                "assignee": alt.assignee,
                "notes": alt.notes,
            }
            for alt in alerts
        ]

    def add_guidance(self, guidance_record: dict) -> None:
        gm = GuidanceMessage(
            id=guidance_record.get("guidance_id") or UUID(int=0),
            alert_id=guidance_record["alert_id"],
            audience_role=guidance_record["audience_role"],
            severity=guidance_record["severity"],
            headline=guidance_record["headline"],
            actions_json=guidance_record.get("actions", []),
            expires_at=guidance_record["expires_at"],
            payload_json=guidance_record.get("payload", {}),
            prompt_version=guidance_record.get("prompt_version") or "1.0",
            schema_version=guidance_record.get("schema_version") or "1.0",
            model_provider=guidance_record.get("model_provider") or "gemini",
            model_name=guidance_record.get("model_name") or "flash",
            input_context_hash=guidance_record.get("input_context_hash") or "hash",
            status=guidance_record.get("status") or "PENDING_APPROVAL",
        )
        self.db.add(gm)
        self.db.commit()

    def get_guidance_for_alert(self, alert_id: UUID, audience_role: str) -> dict | None:
        gm = (
            self.db.query(GuidanceMessage)
            .filter(
                GuidanceMessage.alert_id == alert_id, GuidanceMessage.audience_role == audience_role
            )
            .first()
        )
        if not gm:
            return None
        return {
            "guidance_id": gm.id,
            "alert_id": gm.alert_id,
            "audience_role": gm.audience_role,
            "severity": gm.severity,
            "headline": gm.headline,
            "actions": gm.actions_json,
            "expires_at": gm.expires_at,
            "payload": gm.payload_json,
            "status": gm.status,
            "prompt_version": gm.prompt_version,
            "schema_version": gm.schema_version,
            "model_provider": gm.model_provider,
            "model_name": gm.model_name,
            "input_context_hash": gm.input_context_hash,
        }

    def get_guidance_by_id(self, guidance_id: UUID) -> dict | None:
        gm = self.db.query(GuidanceMessage).filter(GuidanceMessage.id == guidance_id).first()
        if not gm:
            return None
        return {
            "guidance_id": gm.id,
            "alert_id": gm.alert_id,
            "audience_role": gm.audience_role,
            "severity": gm.severity,
            "headline": gm.headline,
            "actions": gm.actions_json,
            "expires_at": gm.expires_at,
            "payload": gm.payload_json,
            "status": gm.status,
            "prompt_version": gm.prompt_version,
            "schema_version": gm.schema_version,
            "model_provider": gm.model_provider,
            "model_name": gm.model_name,
            "input_context_hash": gm.input_context_hash,
        }

    def update_guidance_status(self, guidance_id: UUID, status: str) -> dict | None:
        gm = self.db.query(GuidanceMessage).filter(GuidanceMessage.id == guidance_id).first()
        if not gm:
            return None
        gm.status = status
        self.db.commit()
        return {
            "guidance_id": gm.id,
            "alert_id": gm.alert_id,
            "audience_role": gm.audience_role,
            "severity": gm.severity,
            "headline": gm.headline,
            "actions": gm.actions_json,
            "expires_at": gm.expires_at,
            "payload": gm.payload_json,
            "status": gm.status,
            "prompt_version": gm.prompt_version,
            "schema_version": gm.schema_version,
            "model_provider": gm.model_provider,
            "model_name": gm.model_name,
            "input_context_hash": gm.input_context_hash,
        }

    def get_active_approved_guidance(self, event_id: UUID) -> list[dict]:
        records = (
            self.db.query(GuidanceMessage)
            .join(Alert, GuidanceMessage.alert_id == Alert.id)
            .join(Zone, Alert.zone_id == Zone.id)
            .filter(
                Zone.event_id == event_id,
                GuidanceMessage.status == "APPROVED",
                GuidanceMessage.expires_at > utc_now(),
            )
            .all()
        )
        return [
            {
                "guidance_id": r.id,
                "alert_id": r.alert_id,
                "audience_role": r.audience_role,
                "severity": r.severity,
                "headline": r.headline,
                "actions": r.actions_json,
                "expires_at": r.expires_at,
                "payload": r.payload_json,
                "status": r.status,
                "prompt_version": r.prompt_version,
                "schema_version": r.schema_version,
                "model_provider": r.model_provider,
                "model_name": r.model_name,
                "input_context_hash": r.input_context_hash,
            }
            for r in records
        ]
