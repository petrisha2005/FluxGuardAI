from datetime import datetime
from uuid import uuid4

_execution_history = []


def execute_approved_action(decision_id: str, operator_name: str = "mock-operator") -> dict:
    """Executes an approved autonomous command, logging timestamp and outcomes details."""
    timestamp = datetime.now().isoformat()

    # Check decision type and formulate response outcomes
    if "crowd" in decision_id:
        action_type = "OPEN_GATE"
        target = "Gate B"
        result = "Success: Secondary entry gates motor lock bypassed"
        impact = "Density decreased by 14% at adjacent bottleneck gates"
    elif "emg" in decision_id:
        action_type = "DISPATCH_MEDICAL"
        target = "Gate C Ambulance Checkpoint"
        result = "Success: Ambulance Unit 3 coordinates dispatched"
        impact = "Medics arrived within 4.2 minutes"
    elif "trans" in decision_id:
        action_type = "INCREASE_SHUTTLE_FREQUENCY"
        target = "North Station"
        result = "Success: Dispatch instruction broadcasted to bus hub"
        impact = "Shuttle capacity scaled by 20% in the sector"
    elif "res" in decision_id:
        action_type = "ASSIGN_STAFF"
        target = "Gate C Concourse"
        result = "Success: Stewards relocations log broadcasted"
        impact = "5 stewards successfully relocated to high density queues"
    else:
        action_type = "UPDATE_SIGNAGE"
        target = "Digital Displays"
        result = "Success: Detour sign vector graphic loaded to display"
        impact = "Flow direction shifted: 15% diverted to bypass concourse"

    execution_record = {
        "id": str(uuid4()),
        "decisionId": decision_id,
        "actionType": action_type,
        "target": target,
        "timestamp": timestamp,
        "operator": operator_name,
        "result": result,
        "impact": impact,
    }

    _execution_history.append(execution_record)
    return execution_record


def get_execution_history() -> list[dict]:
    """Retrieves list of all executed actions."""
    return _execution_history
