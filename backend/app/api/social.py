from __future__ import annotations

from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status, Response
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.social import (
    FriendRead,
    ShareCreate,
    ShareRead,
    UserSearchResultRead,
)
from app.services.social_service import (
    add_friend,
    create_share,
    list_friends,
    remove_friend,
    search_users,
)

router = APIRouter(prefix="/social", tags=["social"])


@router.get("/friends", response_model=list[FriendRead])
def read_friends(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> list[FriendRead]:
    return list_friends(db, current_user)


@router.get("/users/search", response_model=list[UserSearchResultRead])
def search_registered_users(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    q: Optional[str] = Query(default=None),
) -> list[UserSearchResultRead]:
    return search_users(db, current_user, q)


@router.post("/friends/{friend_id}", response_model=FriendRead)
def create_friendship(
    friend_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> FriendRead:
    try:
        return add_friend(db, current_user, friend_id)
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error


# ✅ FIXED DELETE ENDPOINT (safe 204 handling)
@router.delete("/friends/{friend_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_friendship(
    friend_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> Response:
    remove_friend(db, current_user, friend_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/shares", response_model=ShareRead)
def share_editorial_with_friend(
    payload: ShareCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> ShareRead:
    try:
        return create_share(db, current_user, payload)
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error
