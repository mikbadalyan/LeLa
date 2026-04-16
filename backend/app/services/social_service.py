from __future__ import annotations

from typing import Optional

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models.editorial import EditorialObject
from app.models.friendship import Friendship
from app.models.share import Share
from app.models.user import User
from app.schemas.auth import UserRead
from app.schemas.social import FriendRead, ShareCreate, ShareRead, UserSearchResultRead
from app.services.auth_service import serialize_user
from app.services.message_service import create_editorial_message


def _serialize_friend(user: User, created_at=None) -> FriendRead:
    friend = serialize_user(user)
    return FriendRead(**friend.model_dump(), friendship_created_at=created_at)


def list_friends(db: Session, current_user: User) -> list[FriendRead]:
    friendships = db.scalars(
        select(Friendship)
        .where(Friendship.user_id == current_user.id)
        .order_by(Friendship.created_at.desc())
    ).all()

    if not friendships:
        return []

    friends = {
        user.id: user
        for user in db.scalars(
            select(User).where(User.id.in_([entry.friend_id for entry in friendships]))
        ).all()
    }

    return [
        _serialize_friend(friends[entry.friend_id], entry.created_at)
        for entry in friendships
        if entry.friend_id in friends
    ]


def search_users(db: Session, current_user: User, query: Optional[str]) -> list[UserSearchResultRead]:
    normalized_query = (query or "").strip()

    base_query = select(User).where(User.id != current_user.id).order_by(User.username.asc())
    if normalized_query:
        pattern = f"%{normalized_query}%"
        base_query = base_query.where(
            or_(User.username.ilike(pattern), User.email.ilike(pattern), User.city.ilike(pattern))
        )

    users = db.scalars(base_query.limit(20)).all()
    friend_ids = set(
        db.scalars(
            select(Friendship.friend_id).where(Friendship.user_id == current_user.id)
        ).all()
    )

    return [
        UserSearchResultRead(
            **serialize_user(user).model_dump(),
            is_friend=user.id in friend_ids,
        )
        for user in users
    ]


def add_friend(db: Session, current_user: User, friend_id: str) -> FriendRead:
    if friend_id == current_user.id:
        raise ValueError("Vous ne pouvez pas vous ajouter vous-meme.")

    friend = db.scalar(select(User).where(User.id == friend_id))
    if not friend:
        raise ValueError("Utilisateur introuvable.")

    existing = db.scalar(
        select(Friendship).where(
            Friendship.user_id == current_user.id, Friendship.friend_id == friend_id
        )
    )
    if existing:
        return _serialize_friend(friend, existing.created_at)

    forward = Friendship(user_id=current_user.id, friend_id=friend_id)
    reverse = Friendship(user_id=friend_id, friend_id=current_user.id)
    db.add_all([forward, reverse])
    db.commit()
    db.refresh(forward)

    return _serialize_friend(friend, forward.created_at)


def remove_friend(db: Session, current_user: User, friend_id: str) -> None:
    friendships = db.scalars(
        select(Friendship).where(
            or_(
                (Friendship.user_id == current_user.id) & (Friendship.friend_id == friend_id),
                (Friendship.user_id == friend_id) & (Friendship.friend_id == current_user.id),
            )
        )
    ).all()

    for friendship in friendships:
        db.delete(friendship)

    db.commit()


def create_share(db: Session, current_user: User, payload: ShareCreate) -> ShareRead:
    friend = db.scalar(select(User).where(User.id == payload.recipient_id))
    if not friend:
        raise ValueError("Ami introuvable.")

    is_friend = (
        db.scalar(
            select(Friendship.id).where(
                Friendship.user_id == current_user.id,
                Friendship.friend_id == payload.recipient_id,
            )
        )
        is not None
    )
    if not is_friend:
        raise ValueError("Vous pouvez partager une carte uniquement avec vos amis.")

    editorial = db.scalar(select(EditorialObject).where(EditorialObject.id == payload.editorial_id))
    if not editorial:
        raise ValueError("Carte editoriale introuvable.")

    share = Share(
        sender_id=current_user.id,
        recipient_id=payload.recipient_id,
        editorial_object_id=payload.editorial_id,
    )
    db.add(share)
    create_editorial_message(db, current_user, friend, editorial)
    db.commit()
    db.refresh(share)

    return ShareRead(
        id=share.id,
        editorial_id=share.editorial_object_id,
        recipient=UserRead(**serialize_user(friend).model_dump()),
        created_at=share.created_at,
    )
