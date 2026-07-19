import logging
from datetime import UTC, datetime, timedelta
from typing import Any

import jwt
from fastapi import HTTPException, status

from app.core.config import get_settings

logger = logging.getLogger("fluxguard.auth.jwt")


def create_token(
    data: dict[str, Any],
    expires_delta: timedelta,
    token_type: str = "access",  # noqa: S107 - JWT token category, not a password.
) -> str:
    """Generates a secure signed JWT token containing custom user claims."""
    settings = get_settings()
    secret_key = settings.jwt_secret or "mock-secret-key-for-local-dev-12345"
    algorithm = settings.jwt_algorithm or "HS256"

    to_encode = data.copy()
    now = datetime.now(UTC)
    expire = now + expires_delta

    to_encode.update(
        {
            "exp": int(expire.timestamp()),
            "iat": int(now.timestamp()),
            "type": token_type,
        }
    )

    encoded_jwt = jwt.encode(to_encode, secret_key, algorithm=algorithm)
    return encoded_jwt


def create_access_token(data: dict[str, Any], expires_delta: timedelta | None = None) -> str:
    """Generates a short-lived access token (default: 15 mins)."""
    if expires_delta is None:
        expires_delta = timedelta(minutes=15)
    return create_token(data, expires_delta, "access")


def create_refresh_token(data: dict[str, Any], expires_delta: timedelta | None = None) -> str:
    """Generates a long-lived refresh token (default: 7 days)."""
    if expires_delta is None:
        expires_delta = timedelta(days=7)
    return create_token(data, expires_delta, "refresh")


def decode_token(
    token: str,
    secret: str | None = None,
    algorithm: str | None = None,
    audience: str | None = None,
) -> dict[str, Any]:
    """Decodes JWT payload, verifying signature and expiration claims."""
    settings = get_settings()
    secret_key = secret or settings.jwt_secret or "mock-secret-key-for-local-dev-12345"
    alg = algorithm or settings.jwt_algorithm or "HS256"
    aud = audience or settings.jwt_audience

    try:
        options = {"verify_aud": aud is not None}
        payload = jwt.decode(
            token,
            secret_key,
            algorithms=[alg],
            audience=aud,
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
