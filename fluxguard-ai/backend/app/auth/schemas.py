from typing import Any

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.auth.roles import UserRole


class UserRegister(BaseModel):
    name: str = Field(..., min_length=1)
    email: EmailStr
    password: str = Field(..., min_length=12)
    role: UserRole = Field(default=UserRole.VIEWER)
    preferred_language: str = Field(default="en")


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: Any
    name: str
    email: EmailStr
    role: str
    preferred_language: str
    is_active: bool
    is_verified: bool


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    role: str
    user: UserProfileResponse


class TokenRefreshRequest(BaseModel):
    refresh_token: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=12)


class UpdateProfileRequest(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    preferred_language: str | None = None
