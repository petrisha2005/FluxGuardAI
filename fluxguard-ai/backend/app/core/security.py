import logging
from typing import Any

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

from app.core.config import get_settings

logger = logging.getLogger("fluxguard.security")
bearer_scheme = HTTPBearer(auto_error=True)


class User(BaseModel):
    id: str
    email: str
    role: str  # fan, volunteer, operator, organizer, admin
    preferred_language: str = "en"


def decode_token(
    token: str, secret: str, algorithm: str, audience: str | None = None
) -> dict[str, Any]:
    """Decodes JWT payload, verifying signature and expiration claims."""
    try:
        options = {"verify_aud": audience is not None}
        payload = jwt.decode(
            token,
            secret,
            algorithms=[algorithm],
            audience=audience,
            options=options,
        )
        return payload
    except jwt.ExpiredSignatureError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": {
                    "code": "TOKEN_EXPIRED",
                    "message": "The authentication token has expired.",
                }
            },
        ) from e
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": {
                    "code": "INVALID_TOKEN",
                    "message": f"Invalid authentication token: {str(e)}",
                }
            },
        ) from e


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> User:
    """Dependency verifying bearer credentials and returning the authenticated user profile."""
    token = credentials.credentials
    settings = get_settings()

    # 1. Dev Mode / Local Mock Bypass: if JWT_SECRET is not configured, map mock tokens
    if not settings.jwt_secret:
        if token == "mock-operator":
            return User(
                id="mock-op-uuid",
                email="operator@stadiumops.org",
                role="operator",
            )
        elif token == "mock-volunteer":
            return User(
                id="mock-vol-uuid",
                email="volunteer@stadiumops.org",
                role="volunteer",
            )
        elif token == "mock-organizer":
            return User(
                id="mock-org-uuid",
                email="organizer@stadiumops.org",
                role="organizer",
            )
        elif token == "mock-fan":
            return User(
                id="mock-fan-uuid",
                email="fan@gmail.com",
                role="fan",
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={
                    "error": {
                        "code": "INVALID_MOCK_TOKEN",
                        "message": "Invalid development mock token. Supported: mock-operator, mock-volunteer, mock-organizer, mock-fan",
                    }
                },
            )

    # 2. Production JWT Decode Flow
    payload = decode_token(
        token,
        settings.jwt_secret,
        settings.jwt_algorithm,
        settings.jwt_audience,
    )

    # Supabase standard sub claim is user ID
    user_id = payload.get("sub")
    email = payload.get("email")

    if not user_id or not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": {
                    "code": "MALFORMED_CLAIMS",
                    "message": "Token claims are missing sub or email fields.",
                }
            },
        )

    # Resolve roles from claim mappings
    role = payload.get("role") or payload.get("app_metadata", {}).get("role") or "fan"
    pref_lang = payload.get("user_metadata", {}).get("preferred_language") or "en"

    return User(
        id=user_id,
        email=email,
        role=role,
        preferred_language=pref_lang,
    )


def require_roles(allowed_roles: list[str]):
    """Returns a dependency guarding endpoints against unauthorized user roles."""

    def role_dependency(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
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
