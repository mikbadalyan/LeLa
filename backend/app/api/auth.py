from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_optional_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import (
    AuthResponse,
    LoginRequest,
    PasswordChangeRequest,
    PasswordChangeResponse,
    RegisterRequest,
    UserRead,
    UserSettingsRead,
    UserSettingsUpdateRequest,
    UserUpdateRequest,
)
from app.services.auth_service import (
    authenticate_user,
    change_user_password,
    get_user_by_id,
    register_user,
    serialize_user,
    serialize_user_settings,
    update_user_settings,
    update_user_profile,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse)
def register(
    payload: RegisterRequest, db: Annotated[Session, Depends(get_db)]
) -> AuthResponse:
    try:
        return register_user(db, payload)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Annotated[Session, Depends(get_db)]) -> AuthResponse:
    try:
        return authenticate_user(db, payload.email, payload.password)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(error)) from error


@router.get("/me", response_model=UserRead)
def me(current_user: Annotated[User, Depends(get_current_user)]) -> UserRead:
    return serialize_user(current_user, viewer=current_user, include_private=True)


@router.patch("/me", response_model=UserRead)
def update_me(
    payload: UserUpdateRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> UserRead:
    try:
        return update_user_profile(db, current_user, payload)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error


@router.get("/settings", response_model=UserSettingsRead)
def read_settings(current_user: Annotated[User, Depends(get_current_user)]) -> UserSettingsRead:
    return serialize_user_settings(current_user)


@router.patch("/settings", response_model=UserSettingsRead)
def patch_settings(
    payload: UserSettingsUpdateRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> UserSettingsRead:
    try:
        return update_user_settings(db, current_user, payload)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error


@router.post("/password", response_model=PasswordChangeResponse)
def update_password(
    payload: PasswordChangeRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> PasswordChangeResponse:
    try:
        return change_user_password(db, current_user, payload)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error


@router.get("/users/{user_id}", response_model=UserRead)
def read_user_by_id(
    user_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User | None, Depends(get_optional_user)],
) -> UserRead:
    try:
        return get_user_by_id(db, user_id, current_user)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
