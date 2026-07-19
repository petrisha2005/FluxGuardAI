# In-memory learning outcomes database
_learning_records = [
    {
        "action": "OPEN_GATE (Gate B)",
        "outcome": "Queue length reduced by 31% within 9 minutes",
        "effectivenessScore": 94,
        "historicalSuccessRate": "92%",
    },
    {
        "action": "ASSIGN_STAFF (Gate C)",
        "outcome": "Crowd stress resolved; queue stabilized in 7 minutes",
        "effectivenessScore": 89,
        "historicalSuccessRate": "87%",
    },
    {
        "action": "INCREASE_SHUTTLE_FREQUENCY (North Station)",
        "outcome": "Train terminal egress cleared 11 minutes faster than average",
        "effectivenessScore": 91,
        "historicalSuccessRate": "89%",
    },
]


def get_learning_records() -> list[dict]:
    """Returns lists of historical reinforcement learning outcome records."""
    return _learning_records


def log_learning_record(action: str, outcome: str, score: int) -> dict:
    """Inserts a new learning feedback trace, modifying future confidence indexes."""
    record = {
        "action": action,
        "outcome": outcome,
        "effectivenessScore": score,
        "historicalSuccessRate": f"{score - 2}%",
    }
    _learning_records.append(record)
    return record
