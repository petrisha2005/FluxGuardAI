import logging
from datetime import UTC, datetime
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.auth.jwt import create_access_token, create_refresh_token, decode_token
from app.auth.password import hash_password, validate_password_policy, verify_password
from app.auth.schemas import ChangePasswordRequest, UpdateProfileRequest, UserLogin, UserRegister
from app.db.models import AuditLog, User

logger = logging.getLogger("fluxguard.auth.services")


def log_audit_event(
    db: Session,
    user: str,
    action: str,
    role: str,
    ip_address: str | None,
    result: str,
    details: dict[str, Any] | None = None,
) -> AuditLog:
    """Creates a persistent security audit record in the database."""
    metadata = {
        "role": role,
        "ip_address": ip_address or "unknown",
        "result": result,
        "details": details or {},
    }
    log_entry = AuditLog(
        user=user,
        action=action,
        timestamp=datetime.now(UTC),
        metadata_json=metadata,
    )
    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)
    return log_entry


def register_user(db: Session, payload: UserRegister, ip_address: str | None = None) -> User:
    """Validates user constraints and registers a new User."""
    # 1. Password policy verification
    if not validate_password_policy(payload.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": {
                    "code": "WEAK_PASSWORD",
                    "message": "Password does not meet complexity requirements (minimum 12 chars, uppercase, lowercase, digit, special character).",
                }
            },
        )

    # 2. Check duplicate email
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": {
                    "code": "EMAIL_EXISTS",
                    "message": "A user with this email address already exists.",
                }
            },
        )

    # 3. Create user
    new_user = User(
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=payload.role.value,
        preferred_language=payload.preferred_language,
        is_active=True,
        is_verified=False,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Log audit event
    log_audit_event(
        db=db,
        user=new_user.email,
        action="USER_REGISTER",
        role=new_user.role,
        ip_address=ip_address,
        result="success",
    )

    return new_user


def authenticate_user(
    db: Session, payload: UserLogin, ip_address: str | None = None
) -> dict[str, Any]:
    """Authenticates credentials and returns a signed access and refresh token pair."""
    user = db.query(User).filter(User.email == payload.email).first()

    if not user or not verify_password(payload.password, user.password_hash):
        log_audit_event(
            db=db,
            user=payload.email,
            action="USER_LOGIN",
            role="unknown",
            ip_address=ip_address,
            result="failed",
            details={"reason": "Invalid credentials"},
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": {
                    "code": "UNAUTHORIZED",
                    "message": "Invalid email or password.",
                }
            },
        )

    if not user.is_active:
        log_audit_event(
            db=db,
            user=user.email,
            action="USER_LOGIN",
            role=user.role,
            ip_address=ip_address,
            result="failed",
            details={"reason": "Account inactive"},
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": {
                    "code": "INACTIVE_ACCOUNT",
                    "message": "This account has been deactivated.",
                }
            },
        )

    # Update last login
    user.last_login = datetime.now(UTC)
    db.commit()

    # Generate tokens
    token_claims = {"user_id": str(user.id), "email": user.email, "role": user.role}
    access_token = create_access_token(token_claims)
    refresh_token = create_refresh_token(token_claims)

    log_audit_event(
        db=db,
        user=user.email,
        action="USER_LOGIN",
        role=user.role,
        ip_address=ip_address,
        result="success",
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "role": user.role,
        "user": user,
    }


def refresh_user_token(
    db: Session, refresh_token: str, ip_address: str | None = None
) -> dict[str, Any]:
    """Validates refresh token and returns a fresh short-lived access token."""
    payload = decode_token(refresh_token)

    # Verify type
    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": {
                    "code": "INVALID_REFRESH_TOKEN",
                    "message": "Expected a refresh token type.",
                }
            },
        )

    user_id = payload.get("user_id") or payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": {
                    "code": "INVALID_REFRESH_TOKEN",
                    "message": "User not found or account is deactivated.",
                }
            },
        )

    # Generate fresh tokens
    token_claims = {"user_id": str(user.id), "email": user.email, "role": user.role}
    new_access_token = create_access_token(token_claims)
    new_refresh_token = create_refresh_token(token_claims)

    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
        "role": user.role,
        "user": user,
    }


def change_user_password(
    db: Session,
    user: User,
    payload: ChangePasswordRequest,
    ip_address: str | None = None,
) -> None:
    """Updates user password after verifying current credentials and complexity policy."""
    if not verify_password(payload.current_password, user.password_hash):
        log_audit_event(
            db=db,
            user=user.email,
            action="PASSWORD_CHANGE",
            role=user.role,
            ip_address=ip_address,
            result="failed",
            details={"reason": "Incorrect current password"},
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": {
                    "code": "INCORRECT_PASSWORD",
                    "message": "Incorrect current password.",
                }
            },
        )

    if not validate_password_policy(payload.new_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": {
                    "code": "WEAK_PASSWORD",
                    "message": "New password does not meet complexity requirements.",
                }
            },
        )

    # Apply update
    user.password_hash = hash_password(payload.new_password)
    db.commit()

    log_audit_event(
        db=db,
        user=user.email,
        action="PASSWORD_CHANGE",
        role=user.role,
        ip_address=ip_address,
        result="success",
    )


def update_user_profile(
    db: Session,
    user: User,
    payload: UpdateProfileRequest,
    ip_address: str | None = None,
) -> User:
    """Updates non-sensitive user profile field choices."""
    if payload.name is not None:
        user.name = payload.name
    if payload.preferred_language is not None:
        user.preferred_language = payload.preferred_language
    if payload.email is not None and payload.email != user.email:
        # Check duplicate
        existing = db.query(User).filter(User.email == payload.email).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "error": {
                        "code": "EMAIL_EXISTS",
                        "message": "A user with this email address already exists.",
                    }
                },
            )
        user.email = payload.email

    db.commit()
    db.refresh(user)

    log_audit_event(
        db=db,
        user=user.email,
        action="PROFILE_UPDATE",
        role=user.role,
        ip_address=ip_address,
        result="success",
    )

    return user
