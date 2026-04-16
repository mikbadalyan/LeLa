from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import (
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    UserRead,
    UserUpdateRequest,
)
from app.services.auth_service import (
    authenticate_user,
    register_user,
    serialize_user,
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
    return serialize_user(current_user)


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
