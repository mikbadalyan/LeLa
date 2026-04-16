from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.models.user import UserRole


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str
    city: Optional[str] = None
    role: UserRole = UserRole.CONTRIBUTOR


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    username: str
    display_name: str
    email: str
    avatar_url: str 
    city: Optional[str] = None
    bio: Optional[str] = None
    role: UserRole


class UserUpdateRequest(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    city: Optional[str] = None
    bio: Optional[str] = None


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead
