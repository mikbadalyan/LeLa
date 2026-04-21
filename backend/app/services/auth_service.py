from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import create_access_token, get_password_hash, verify_password
from app.models.user import User
from app.models.friendship import Friendship
from app.schemas.auth import (
    AuthResponse,
    PasswordChangeRequest,
    PasswordChangeResponse,
    RegisterRequest,
    UserRead,
    UserSettingsRead,
    UserSettingsUpdateRequest,
    UserUpdateRequest,
)

LANGUAGE_OPTIONS = {"fr", "hy", "en", "de"}
THEME_OPTIONS = {"system", "light", "dark"}
PROFILE_VISIBILITY_OPTIONS = {"public", "private"}
DIRECT_MESSAGE_OPTIONS = {"everyone", "friends", "none"}


def serialize_user_settings(user: User) -> UserSettingsRead:
    return UserSettingsRead(
        interface_language=user.interface_language,
        theme_preference=user.theme_preference,
        compact_mode=user.compact_mode,
        autoplay_previews=user.autoplay_previews,
        reduce_motion=user.reduce_motion,
        large_text=user.large_text,
        high_contrast=user.high_contrast,
        sound_effects=user.sound_effects,
        data_saver=user.data_saver,
        profile_visibility=user.profile_visibility,
        show_email=user.show_email,
        show_city=user.show_city,
        show_activity_status=user.show_activity_status,
        searchable_by_email=user.searchable_by_email,
        allow_friend_requests=user.allow_friend_requests,
        allow_direct_messages=user.allow_direct_messages,
        allow_tagging=user.allow_tagging,
        profile_indexing_enabled=user.profile_indexing_enabled,
        two_factor_enabled=user.two_factor_enabled,
        login_alerts=user.login_alerts,
        security_reminders=user.security_reminders,
        marketing_emails=user.marketing_emails,
        product_updates=user.product_updates,
        weekly_digest=user.weekly_digest,
        message_notifications=user.message_notifications,
        friend_request_notifications=user.friend_request_notifications,
        moderation_notifications=user.moderation_notifications,
        last_password_changed_at=user.last_password_changed_at,
    )


def can_view_private_profile(viewer: User | None, user: User) -> bool:
    return viewer is not None and viewer.id == user.id


def can_user_receive_friend_request(user: User) -> bool:
    return user.allow_friend_requests


def can_user_receive_direct_message(db: Session, sender: User, recipient: User) -> bool:
    if sender.id == recipient.id:
        return False

    if recipient.allow_direct_messages == "everyone":
        return True

    if recipient.allow_direct_messages == "none":
        return False

    return (
        db.scalar(
            select(Friendship.id).where(
                Friendship.user_id == sender.id,
                Friendship.friend_id == recipient.id,
            )
        )
        is not None
    )


def serialize_user(
    user: User,
    viewer: User | None = None,
    *,
    include_private: bool = False,
) -> UserRead:
    can_view_private = include_private or can_view_private_profile(viewer, user)

    return UserRead(
        id=user.id,
        username=user.username,
        display_name=user.username,
        email=user.email if can_view_private or user.show_email else None,
        avatar_url=user.avatar_url,
        city=user.city if can_view_private or user.show_city else None,
        bio=user.bio if can_view_private or user.profile_visibility == "public" else None,
        role=user.role,
        settings=serialize_user_settings(user) if can_view_private else None,
    )


def get_user_by_id(db: Session, user_id: str, viewer: User | None = None) -> UserRead:
    user = db.scalar(select(User).where(User.id == user_id))
    if not user:
        raise ValueError("Utilisateur introuvable.")
    return serialize_user(user, viewer=viewer)


def register_user(db: Session, payload: RegisterRequest) -> AuthResponse:
    existing_user = db.scalar(
        select(User).where((User.email == payload.email) | (User.username == payload.username))
    )
    if existing_user:
        raise ValueError("Un compte existe deja avec cet email ou ce nom d'utilisateur.")

    settings = get_settings()
    user = User(
        username=payload.username,
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        city=payload.city,
        avatar_url=f"{settings.backend_public_url}/static/mock/avatar-generic.svg",
        role=payload.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return AuthResponse(
        access_token=create_access_token(user.id),
        user=serialize_user(user, viewer=user, include_private=True),
    )


def authenticate_user(db: Session, email: str, password: str) -> AuthResponse:
    user = db.scalar(select(User).where(User.email == email))
    if not user or not verify_password(password, user.hashed_password):
        raise ValueError("Email ou mot de passe invalide.")

    return AuthResponse(
        access_token=create_access_token(user.id),
        user=serialize_user(user, viewer=user, include_private=True),
    )


def update_user_profile(db: Session, user: User, payload: UserUpdateRequest) -> UserRead:
    if payload.username and payload.username != user.username:
        existing_username = db.scalar(select(User).where(User.username == payload.username))
        if existing_username and existing_username.id != user.id:
            raise ValueError("Ce nom d'utilisateur est deja utilise.")
        user.username = payload.username

    if payload.email and payload.email != user.email:
        existing_email = db.scalar(select(User).where(User.email == payload.email))
        if existing_email and existing_email.id != user.id:
            raise ValueError("Cet email est deja utilise.")
        user.email = payload.email

    if payload.city is not None:
        user.city = payload.city.strip() or None

    if payload.bio is not None:
        user.bio = payload.bio.strip() or None

    db.commit()
    db.refresh(user)
    return serialize_user(user, viewer=user, include_private=True)


def update_user_settings(
    db: Session,
    user: User,
    payload: UserSettingsUpdateRequest,
) -> UserSettingsRead:
    if payload.interface_language is not None:
        interface_language = payload.interface_language.strip().lower()
        if interface_language not in LANGUAGE_OPTIONS:
            raise ValueError("Langue invalide.")
        user.interface_language = interface_language

    if payload.theme_preference is not None:
        theme = payload.theme_preference.strip().lower()
        if theme not in THEME_OPTIONS:
            raise ValueError("Theme invalide.")
        user.theme_preference = theme

    if payload.profile_visibility is not None:
        visibility = payload.profile_visibility.strip().lower()
        if visibility not in PROFILE_VISIBILITY_OPTIONS:
            raise ValueError("Visibilite de profil invalide.")
        user.profile_visibility = visibility

    if payload.allow_direct_messages is not None:
        direct_messages = payload.allow_direct_messages.strip().lower()
        if direct_messages not in DIRECT_MESSAGE_OPTIONS:
            raise ValueError("Reglage de messages invalide.")
        user.allow_direct_messages = direct_messages

    for field_name in (
        "compact_mode",
        "autoplay_previews",
        "reduce_motion",
        "large_text",
        "high_contrast",
        "sound_effects",
        "data_saver",
        "show_email",
        "show_city",
        "show_activity_status",
        "searchable_by_email",
        "allow_friend_requests",
        "allow_tagging",
        "profile_indexing_enabled",
        "two_factor_enabled",
        "login_alerts",
        "security_reminders",
        "marketing_emails",
        "product_updates",
        "weekly_digest",
        "message_notifications",
        "friend_request_notifications",
        "moderation_notifications",
    ):
        value = getattr(payload, field_name)
        if value is not None:
            setattr(user, field_name, value)

    db.commit()
    db.refresh(user)
    return serialize_user_settings(user)


def change_user_password(
    db: Session,
    user: User,
    payload: PasswordChangeRequest,
) -> PasswordChangeResponse:
    if not verify_password(payload.current_password, user.hashed_password):
        raise ValueError("Mot de passe actuel invalide.")

    if payload.current_password == payload.new_password:
        raise ValueError("Le nouveau mot de passe doit etre different.")

    user.hashed_password = get_password_hash(payload.new_password)
    user.last_password_changed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)

    return PasswordChangeResponse(
        message="Mot de passe mis a jour.",
        last_password_changed_at=user.last_password_changed_at,
    )
