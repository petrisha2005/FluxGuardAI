import uuid
from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy.orm import Session

from app.db.models import (
    Camera,
    CrowdMeasurement,
    Feedback,
    Prediction,
    RiskScore,
    Stadium,
    Zone,
)


def utc_now() -> datetime:
    return datetime.now(UTC)


class StadiumRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all_stadiums(self) -> list[dict]:
        stadiums = self.db.query(Stadium).all()
        return [
            {
                "id": s.id,
                "name": s.name,
                "city": s.city,
                "country": s.country,
                "capacity": s.capacity,
                "timezone": "UTC",
                "metadata": {"latitude": s.latitude, "longitude": s.longitude},
            }
            for s in stadiums
        ]

    def get_stadium_by_id(self, stadium_id: UUID) -> dict | None:
        s = self.db.query(Stadium).filter(Stadium.id == stadium_id).first()
        if not s:
            return None
        return {
            "id": s.id,
            "name": s.name,
            "city": s.city,
            "country": s.country,
            "capacity": s.capacity,
            "timezone": "UTC",
            "metadata": {"latitude": s.latitude, "longitude": s.longitude},
        }

    def get_zones_for_event(self, event_id: UUID, zone_type: str | None = None) -> list[dict]:
        query = self.db.query(Zone).filter(Zone.event_id == event_id)
        if zone_type:
            query = query.filter(Zone.zone_type == zone_type)
        zones = query.all()
        return [
            {
                "id": z.id,
                "event_id": z.event_id,
                "name": z.name,
                "type": z.zone_type,
                "capacity": z.capacity,
                "parent_zone_id": z.parent_zone_id,
                "status": z.status,
            }
            for z in zones
        ]

    def get_zone_by_id(self, zone_id: UUID) -> dict | None:
        z = self.db.query(Zone).filter(Zone.id == zone_id).first()
        if not z:
            return None
        return {
            "id": z.id,
            "event_id": z.event_id,
            "name": z.name,
            "type": z.zone_type,
            "capacity": z.capacity,
            "parent_zone_id": z.parent_zone_id,
            "status": z.status,
        }

    def add_measurement(self, measurement: dict) -> None:
        m = CrowdMeasurement(
            id=measurement.get("id") or UUID(int=0),  # Will auto-generate UUID if none provided
            zone_id=measurement["zone_id"],
            measured_at=measurement["measured_at"],
            density_count=measurement["density_count"],
            flow_rate_per_minute=measurement["flow_rate_per_minute"],
            queue_length=measurement["queue_length"],
            source_type=measurement["source_type"],
            confidence=measurement["confidence"],
            ingested_at=measurement.get("ingested_at") or utc_now(),
        )
        self.db.add(m)
        self.db.commit()

    def get_all_measurements(self) -> list[dict]:
        measurements = self.db.query(CrowdMeasurement).all()
        return [
            {
                "id": m.id,
                "zone_id": m.zone_id,
                "measured_at": m.measured_at,
                "density_count": m.density_count,
                "flow_rate_per_minute": m.flow_rate_per_minute,
                "queue_length": m.queue_length,
                "source_type": m.source_type,
                "confidence": m.confidence,
                "ingested_at": m.ingested_at,
            }
            for m in measurements
        ]

    def add_prediction(self, prediction: dict) -> None:
        p = Prediction(
            id=prediction.get("id") or UUID(int=0),
            zone_id=prediction["zone_id"],
            horizon_minutes=prediction["horizon_minutes"],
            predicted_density=prediction["predicted_density"],
            predicted_queue_length=prediction["predicted_queue_length"],
            predicted_flow_rate=prediction["predicted_flow_rate"],
            confidence_interval_low=prediction["confidence_interval_low"],
            confidence_interval_high=prediction["confidence_interval_high"],
            generated_at=prediction["generated_at"],
            model_version=prediction["model_version"],
        )
        self.db.add(p)
        self.db.commit()

    def get_predictions(
        self, event_id: UUID, zone_id: UUID | None = None, horizon_minutes: int | None = None
    ) -> list[dict]:
        query = (
            self.db.query(Prediction)
            .join(Zone, Prediction.zone_id == Zone.id)
            .filter(Zone.event_id == event_id)
        )
        if zone_id:
            query = query.filter(Prediction.zone_id == zone_id)
        if horizon_minutes is not None:
            query = query.filter(Prediction.horizon_minutes == horizon_minutes)

        predictions = query.order_by(Prediction.generated_at.desc()).all()
        return [
            {
                "id": p.id,
                "zone_id": p.zone_id,
                "horizon_minutes": p.horizon_minutes,
                "predicted_density": p.predicted_density,
                "predicted_queue_length": p.predicted_queue_length,
                "predicted_flow_rate": p.predicted_flow_rate,
                "confidence_interval_low": p.confidence_interval_low,
                "confidence_interval_high": p.confidence_interval_high,
                "generated_at": p.generated_at,
                "model_version": p.model_version,
            }
            for p in predictions
        ]

    def update_risk_score(self, zone_id: UUID, risk_score_data: dict) -> None:
        risk = self.db.query(RiskScore).filter(RiskScore.zone_id == zone_id).first()
        if not risk:
            risk = RiskScore(
                id=uuid.uuid4(),
                zone_id=zone_id,
                risk_score=risk_score_data["risk_score"],
                severity=risk_score_data["severity"],
                drivers_json=risk_score_data.get("drivers", []),
                prediction_horizon_minutes=risk_score_data["prediction_horizon_minutes"],
                generated_at=risk_score_data.get("generated_at") or utc_now(),
            )
            self.db.add(risk)
        else:
            risk.risk_score = risk_score_data["risk_score"]
            risk.severity = risk_score_data["severity"]
            risk.drivers_json = risk_score_data.get("drivers", [])
            risk.prediction_horizon_minutes = risk_score_data["prediction_horizon_minutes"]
            risk.generated_at = risk_score_data.get("generated_at") or utc_now()
        self.db.commit()

    def get_latest_risk_scores(self, event_id: UUID) -> list[dict]:
        scores = (
            self.db.query(RiskScore)
            .join(Zone, RiskScore.zone_id == Zone.id)
            .filter(Zone.event_id == event_id)
            .all()
        )
        return [
            {
                "zone_id": rs.zone_id,
                "risk_score": rs.risk_score,
                "severity": rs.severity,
                "drivers": rs.drivers_json,
                "prediction_horizon_minutes": rs.prediction_horizon_minutes,
                "generated_at": rs.generated_at,
            }
            for rs in scores
        ]

    def add_feedback(self, feedback_record: dict) -> None:
        f = Feedback(
            id=feedback_record.get("id") or uuid.uuid4(),
            zone_id=feedback_record["zone_id"],
            rating=feedback_record["rating"],
            comment=feedback_record["comment"],
            created_at=feedback_record.get("created_at") or utc_now(),
        )
        self.db.add(f)
        self.db.commit()

    def get_all_feedback(self) -> list[dict]:
        feedbacks = self.db.query(Feedback).order_by(Feedback.created_at.desc()).all()
        return [
            {
                "id": f.id,
                "zone_id": f.zone_id,
                "rating": f.rating,
                "comment": f.comment,
                "created_at": f.created_at,
            }
            for f in feedbacks
        ]

    def get_cameras_for_event(self, event_id: UUID) -> list[dict]:
        cameras = (
            self.db.query(Camera)
            .join(Zone, Camera.zone_id == Zone.id)
            .filter(Zone.event_id == event_id)
            .all()
        )
        return [
            {
                "id": str(c.id),
                "zone_id": c.zone_id,
                "name": c.name,
                "fps": c.fps,
                "accuracy": c.accuracy,
                "status": c.status,
            }
            for c in cameras
        ]

    def get_zone_links(self, event_id: UUID) -> list[dict]:
        all_links = [
            # Lucusa Stadium links
            {
                "source_id": UUID("00000000-0000-0000-0000-000000000001"),
                "target_id": UUID("00000000-0000-0000-0000-000000000002"),
                "capacity_flow": 80,
            },
            {
                "source_id": UUID("00000000-0000-0000-0000-000000000003"),
                "target_id": UUID("00000000-0000-0000-0000-000000000002"),
                "capacity_flow": 60,
            },
            {
                "source_id": UUID("00000000-0000-0000-0000-000000000004"),
                "target_id": UUID("00000000-0000-0000-0000-000000000002"),
                "capacity_flow": 70,
            },
            # City Arena links
            {
                "source_id": UUID("00000000-0000-0000-0000-000000000005"),
                "target_id": UUID("00000000-0000-0000-0000-000000000006"),
                "capacity_flow": 120,
            },
            {
                "source_id": UUID("00000000-0000-0000-0000-000000000007"),
                "target_id": UUID("00000000-0000-0000-0000-000000000006"),
                "capacity_flow": 100,
            },
            # Downtown Fan Zone links
            {
                "source_id": UUID("00000000-0000-0000-0000-000000000010"),
                "target_id": UUID("00000000-0000-0000-0000-000000000008"),
                "capacity_flow": 150,
            },
            {
                "source_id": UUID("00000000-0000-0000-0000-000000000008"),
                "target_id": UUID("00000000-0000-0000-0000-000000000009"),
                "capacity_flow": 140,
            },
        ]
        event_zones = {z.id for z in self.db.query(Zone).filter(Zone.event_id == event_id).all()}
        return [
            link
            for link in all_links
            if link["source_id"] in event_zones and link["target_id"] in event_zones
        ]
