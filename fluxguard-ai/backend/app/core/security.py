import logging

from pydantic import BaseModel

logger = logging.getLogger("fluxguard.security")


class User(BaseModel):
    """Legacy Pydantic User model preserved for test schema compatibility."""

    id: str
    email: str
    role: str
    preferred_language: str = "en"
    name: str = "Mock User"
    is_active: bool = True
    is_verified: bool = True


def require_roles(allowed_roles: list[str]):
    """Redirects to the new centralized role dependency."""
    from app.auth.dependencies import require_role

    return require_role(*allowed_roles)
