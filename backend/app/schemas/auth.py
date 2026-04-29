from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

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
    email: Optional[str] = None
    avatar_url: str
    city: Optional[str] = None
    bio: Optional[str] = None
    role: UserRole
    settings: Optional["UserSettingsRead"] = None


class UserUpdateRequest(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    avatar_url: Optional[str] = None
    city: Optional[str] = None
    bio: Optional[str] = None


class UserSettingsRead(BaseModel):
    interface_language: str = "fr"
    theme_preference: str = "system"
    compact_mode: bool = True
    autoplay_previews: bool = False
    reduce_motion: bool = False
    large_text: bool = False
    high_contrast: bool = False
    sound_effects: bool = True
    data_saver: bool = False
    profile_visibility: str = "public"
    show_email: bool = False
    show_city: bool = True
    show_activity_status: bool = True
    searchable_by_email: bool = True
    allow_friend_requests: bool = True
    allow_direct_messages: str = "friends"
    allow_tagging: bool = True
    profile_indexing_enabled: bool = True
    two_factor_enabled: bool = False
    login_alerts: bool = True
    security_reminders: bool = True
    marketing_emails: bool = False
    product_updates: bool = True
    weekly_digest: bool = False
    message_notifications: bool = True
    friend_request_notifications: bool = True
    moderation_notifications: bool = True
    last_password_changed_at: Optional[datetime] = None


class UserSettingsUpdateRequest(BaseModel):
    interface_language: Optional[str] = None
    theme_preference: Optional[str] = None
    compact_mode: Optional[bool] = None
    autoplay_previews: Optional[bool] = None
    reduce_motion: Optional[bool] = None
    large_text: Optional[bool] = None
    high_contrast: Optional[bool] = None
    sound_effects: Optional[bool] = None
    data_saver: Optional[bool] = None
    profile_visibility: Optional[str] = None
    show_email: Optional[bool] = None
    show_city: Optional[bool] = None
    show_activity_status: Optional[bool] = None
    searchable_by_email: Optional[bool] = None
    allow_friend_requests: Optional[bool] = None
    allow_direct_messages: Optional[str] = None
    allow_tagging: Optional[bool] = None
    profile_indexing_enabled: Optional[bool] = None
    two_factor_enabled: Optional[bool] = None
    login_alerts: Optional[bool] = None
    security_reminders: Optional[bool] = None
    marketing_emails: Optional[bool] = None
    product_updates: Optional[bool] = None
    weekly_digest: Optional[bool] = None
    message_notifications: Optional[bool] = None
    friend_request_notifications: Optional[bool] = None
    moderation_notifications: Optional[bool] = None


class PasswordChangeRequest(BaseModel):
    current_password: str = Field(min_length=1, max_length=255)
    new_password: str = Field(min_length=8, max_length=255)


class PasswordChangeResponse(BaseModel):
    message: str
    last_password_changed_at: datetime


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead


UserRead.model_rebuild()
