import logging

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.auth.jwt import decode_token
from app.db.models import User
from app.db.session import get_db

logger = logging.getLogger("fluxguard.auth.dependencies")
bearer_scheme = HTTPBearer(auto_error=True)

# Legacy compatibility mapping groups
ROLE_GROUPS = {
    "admin": {"SUPER_ADMIN", "admin"},
    "operator": {
        "SECURITY_SUPERVISOR",
        "MEDICAL_COORDINATOR",
        "GLOBAL_OPERATIONS_DIRECTOR",
        "STADIUM_MANAGER",
        "SUPER_ADMIN",
        "operator",
    },
    "organizer": {
        "GLOBAL_OPERATIONS_DIRECTOR",
        "STADIUM_MANAGER",
        "SUPER_ADMIN",
        "organizer",
    },
    "volunteer": {"VOLUNTEER_COORDINATOR", "volunteer"},
    "fan": {"VIEWER", "fan"},
}


def check_role_access(user_role: str, allowed_roles: list[str]) -> bool:
    """Evaluates whether the user's role satisfies any allowed roles, including legacy groupings."""
    for allowed in allowed_roles:
        if user_role == allowed:
            return True
        # If allowed is a legacy category, check if user's role is in its group
        if allowed in ROLE_GROUPS and user_role in ROLE_GROUPS[allowed]:
            return True
        # If user's role is a legacy category, check if allowed role is in its group
        if user_role in ROLE_GROUPS and allowed in ROLE_GROUPS[user_role]:
            return True
    return False


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Dependency verifying bearer credentials, decoding JWT, and returning database User."""
    token = credentials.credentials
    # 1. Dev Mode / Legacy Mock Bypass
    if token == "mock-operator":
        user = db.query(User).filter(User.email == "operator@stadiumops.org").first()
        if user:
            return user
        return User(
            id="mock-op-uuid",
            email="operator@stadiumops.org",
            role="operator",
            name="Mock Operator",
        )
    elif token == "mock-volunteer":
        user = db.query(User).filter(User.email == "volunteer@stadiumops.org").first()
        if user:
            return user
        return User(
            id="mock-vol-uuid",
            email="volunteer@stadiumops.org",
            role="volunteer",
            name="Mock Volunteer",
        )
    elif token == "mock-organizer":
        user = db.query(User).filter(User.email == "organizer@stadiumops.org").first()
        if user:
            return user
        return User(
            id="mock-org-uuid",
            email="organizer@stadiumops.org",
            role="organizer",
            name="Mock Organizer",
        )
    elif token == "mock-fan":
        user = db.query(User).filter(User.email == "fan@gmail.com").first()
        if user:
            return user
        return User(id="mock-fan-uuid", email="fan@gmail.com", role="fan", name="Mock Fan")

    # 2. Decode Token
    payload = decode_token(token)
    user_id = payload.get("user_id") or payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": {
                    "code": "MALFORMED_CLAIMS",
                    "message": "Token claims are missing user identifier.",
                }
            },
        )

    # 3. Fetch User
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": {
                    "code": "USER_NOT_FOUND",
                    "message": "The user associated with this token could not be found.",
                }
            },
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": {
                    "code": "USER_INACTIVE",
                    "message": "This user account is inactive.",
                }
            },
        )

    return user


def require_role(*allowed_roles: str):
    """Factory creating dependency guarding endpoints by checking roles (supporting legacy fallback)."""

    def role_dependency(current_user: User = Depends(get_current_user)) -> User:
        if not check_role_access(current_user.role, list(allowed_roles)):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "error": {
                        "code": "FORBIDDEN",
                        "message": f"User role '{current_user.role}' is not authorized to access this resource. Allowed: {', '.join(allowed_roles)}",
                    }
                },
            )
        return current_user

    return role_dependency
