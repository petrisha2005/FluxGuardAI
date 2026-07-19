from datetime import UTC, datetime
from uuid import UUID, uuid4

from sqlalchemy.orm import Session

from app.db.models import ActionExecution, AgentDecision, HistoricalRecord


def utc_now() -> datetime:
    return datetime.now(UTC)


class DecisionRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all_pending_decisions(self) -> list[dict]:
        decisions = (
            self.db.query(AgentDecision).filter(AgentDecision.status == "PENDING_APPROVAL").all()
        )
        return [
            {
                "id": str(d.id),
                "agent": d.agent_name,
                "action": d.recommendation,
                "target": d.target or "",
                "confidence": d.confidence,
                "reason": d.reason or "",
                "expectedImpact": d.expected_impact or "",
            }
            for d in decisions
        ]

    def add_decision(self, data: dict) -> AgentDecision:
        d = AgentDecision(
            id=UUID(data["id"]) if isinstance(data.get("id"), str) else (data.get("id") or uuid4()),
            agent_name=data["agent"],
            recommendation=data["action"],
            target=data["target"],
            confidence=data["confidence"],
            reason=data["reason"],
            expected_impact=data["expectedImpact"],
            status="PENDING_APPROVAL",
        )
        self.db.add(d)
        self.db.commit()
        return d

    def update_decision_status(self, decision_id: str, status: str) -> None:
        try:
            d_id = UUID(decision_id)
        except ValueError:
            return
        d = self.db.query(AgentDecision).filter(AgentDecision.id == d_id).first()
        if d:
            d.status = status
            self.db.commit()

    def get_execution_history(self) -> list[dict]:
        records = (
            self.db.query(ActionExecution).order_by(ActionExecution.execution_time.desc()).all()
        )
        return [
            {
                "id": str(r.id),
                "decisionId": str(r.decision_id),
                "actionType": r.action,
                "target": r.decision.target if r.decision else "",
                "timestamp": r.execution_time.isoformat(),
                "operator": r.operator or "mock-operator",
                "result": r.result,
                "impact": r.impact or "",
            }
            for r in records
        ]

    def add_execution_record(self, data: dict) -> ActionExecution:
        rec = ActionExecution(
            id=UUID(data["id"]) if isinstance(data.get("id"), str) else (data.get("id") or uuid4()),
            decision_id=(
                UUID(data["decisionId"])
                if isinstance(data.get("decisionId"), str)
                else data["decisionId"]
            ),
            action=data["actionType"],
            result=data["result"],
            operator=data.get("operator", "mock-operator"),
            impact=data.get("impact", ""),
            execution_time=utc_now(),
        )
        self.db.add(rec)
        self.db.commit()
        return rec

    def get_learning_records(self) -> list[dict]:
        records = self.db.query(HistoricalRecord).all()
        return [
            {
                "action": r.action,
                "outcome": r.outcome,
                "effectivenessScore": r.effectiveness,
                "historicalSuccessRate": r.historical_success_rate or f"{r.effectiveness - 2}%",
            }
            for r in records
        ]

    def add_learning_record(
        self, action: str, outcome: str, effectiveness_score: int
    ) -> HistoricalRecord:
        rec = HistoricalRecord(
            action=action,
            event_name="Reinforcement Learning Sync",
            outcome=outcome,
            effectiveness=effectiveness_score,
            historical_success_rate=f"{effectiveness_score - 2}%",
        )
        self.db.add(rec)
        self.db.commit()
        return rec
