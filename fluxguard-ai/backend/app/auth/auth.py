from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user, require_role
from app.auth.roles import UserRole
from app.auth.schemas import (
    ChangePasswordRequest,
    TokenRefreshRequest,
    TokenResponse,
    UpdateProfileRequest,
    UserLogin,
    UserProfileResponse,
    UserRegister,
)
from app.auth.services import (
    authenticate_user,
    change_user_password,
    log_audit_event,
    refresh_user_token,
    register_user,
    update_user_profile,
)
from app.db.models import User
from app.db.session import get_db

router = APIRouter(prefix="/api/auth", tags=["authentication"])


@router.post("/register", response_model=UserProfileResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserRegister, request: Request, db: Session = Depends(get_db)):
    """Registers a new operations user."""
    ip_addr = request.client.host if request.client else None
    return register_user(db, payload, ip_addr)


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, request: Request, db: Session = Depends(get_db)):
    """Authenticates credentials and returns a secure JWT access and refresh token pair."""
    ip_addr = request.client.host if request.client else None
    return authenticate_user(db, payload, ip_addr)


@router.post("/logout")
def logout(
    request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Logs out the user and registers a logout event in audit logs."""
    ip_addr = request.client.host if request.client else None
    log_audit_event(
        db=db,
        user=current_user.email,
        action="USER_LOGOUT",
        role=current_user.role,
        ip_address=ip_addr,
        result="success",
    )
    return {"status": "success", "message": "Successfully logged out."}


@router.post("/refresh", response_model=TokenResponse)
def refresh(payload: TokenRefreshRequest, request: Request, db: Session = Depends(get_db)):
    """Refreshes a short-lived access token using a valid refresh token."""
    ip_addr = request.client.host if request.client else None
    return refresh_user_token(db, payload.refresh_token, ip_addr)


@router.get("/me", response_model=UserProfileResponse)
def me(current_user: User = Depends(get_current_user)):
    """Retrieves current user identity profile."""
    return current_user


@router.put("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Changes the password after checking complexity policy."""
    ip_addr = request.client.host if request.client else None
    change_user_password(db, current_user, payload, ip_addr)
    return {"status": "success", "message": "Password changed successfully."}


@router.put("/profile", response_model=UserProfileResponse)
def update_profile(
    payload: UpdateProfileRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Updates profile attributes."""
    ip_addr = request.client.host if request.client else None
    return update_user_profile(db, current_user, payload, ip_addr)


class ToggleStatusRequest(BaseModel):
    is_active: bool


@router.get("/users", response_model=list[UserProfileResponse])
def list_users(
    current_user: User = Depends(
        require_role(UserRole.SUPER_ADMIN, UserRole.GLOBAL_OPERATIONS_DIRECTOR)
    ),
    db: Session = Depends(get_db),
):
    """Retrieves all registered enterprise users (admin only)."""
    return db.query(User).all()


@router.put("/users/{user_id}/status")
def toggle_user_active_status(
    user_id: str,
    payload: ToggleStatusRequest,
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN)),
    db: Session = Depends(get_db),
):
    """Toggles active/deactivated state of a user (Super Admin only)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    user.is_active = payload.is_active
    db.commit()
    return {"status": "success", "message": "User status updated."}
