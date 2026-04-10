from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import create_access_token, get_password_hash, verify_password
from app.models.user import User
from app.schemas.auth import AuthResponse, RegisterRequest, UserRead


def serialize_user(user: User) -> UserRead:
    return UserRead(
        id=user.id,
        username=user.username,
        display_name=user.username,
        avatar_url=user.avatar_url,
        city=user.city,
    )


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
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return AuthResponse(access_token=create_access_token(user.id), user=serialize_user(user))


def authenticate_user(db: Session, email: str, password: str) -> AuthResponse:
    user = db.scalar(select(User).where(User.email == email))
    if not user or not verify_password(password, user.hashed_password):
        raise ValueError("Email ou mot de passe invalide.")

    return AuthResponse(access_token=create_access_token(user.id), user=serialize_user(user))
