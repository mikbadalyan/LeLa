from __future__ import annotations

from collections import defaultdict
from typing import Optional

from sqlalchemy import and_, or_, select
from sqlalchemy.orm import Session

from app.models.editorial import EditorialObject
from app.models.friendship import Friendship
from app.models.share import Share
from app.models.user import User
from app.schemas.auth import UserRead
from app.schemas.social import (
    FriendGraphEdgeRead,
    FriendGraphNodeRead,
    FriendGraphRead,
    FriendRead,
    ShareCreate,
    ShareRead,
    UserSearchResultRead,
)
from app.services.auth_service import (
    can_user_receive_direct_message,
    can_user_receive_friend_request,
    serialize_user,
)
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


def read_friend_graph(
    db: Session,
    current_user: User,
    *,
    max_depth: int = 3,
    max_nodes: int = 140,
) -> FriendGraphRead:
    depth_limit = max(1, min(max_depth, 4))
    node_limit = max(12, min(max_nodes, 240))

    visited_depth = {current_user.id: 0}
    parent_by_node: dict[str, str | None] = {current_user.id: None}
    direct_friend_ids = set(
        db.scalars(
            select(Friendship.friend_id).where(Friendship.user_id == current_user.id)
        ).all()
    )
    adjacency: dict[str, set[str]] = defaultdict(set)
    frontier = {current_user.id}
    truncated = False
    current_depth = 0

    while frontier and current_depth < depth_limit:
        friendships = db.scalars(
            select(Friendship).where(Friendship.user_id.in_(frontier))
        ).all()
        next_frontier: set[str] = set()

        for friendship in friendships:
            adjacency[friendship.user_id].add(friendship.friend_id)
            adjacency[friendship.friend_id].add(friendship.user_id)

            if friendship.friend_id in visited_depth:
                continue

            if len(visited_depth) >= node_limit:
                truncated = True
                continue

            visited_depth[friendship.friend_id] = current_depth + 1
            parent_by_node[friendship.friend_id] = friendship.user_id
            next_frontier.add(friendship.friend_id)

        frontier = next_frontier
        current_depth += 1

    included_ids = set(visited_depth)
    if not included_ids:
        included_ids = {current_user.id}

    friendships = db.scalars(
        select(Friendship).where(
            Friendship.user_id.in_(included_ids),
            Friendship.friend_id.in_(included_ids),
        )
    ).all()

    edge_keys: set[tuple[str, str]] = set()
    for friendship in friendships:
        adjacency[friendship.user_id].add(friendship.friend_id)
        adjacency[friendship.friend_id].add(friendship.user_id)
        edge_keys.add(tuple(sorted((friendship.user_id, friendship.friend_id))))

    users = {
        user.id: user
        for user in db.scalars(select(User).where(User.id.in_(included_ids))).all()
    }

    nodes: list[FriendGraphNodeRead] = []
    for user_id, depth in sorted(
        visited_depth.items(),
        key=lambda item: (item[1], item[0] != current_user.id, item[0]),
    ):
        user = users.get(user_id)
        if not user:
            continue

        serialized_user = serialize_user(user)
        mutual_count = (
            0
            if user_id == current_user.id
            else len((adjacency[user_id] & direct_friend_ids) - {current_user.id})
        )
        connection_count = len(adjacency[user_id] & included_ids)

        nodes.append(
            FriendGraphNodeRead(
                **serialized_user.model_dump(),
                depth=depth,
                is_self=user_id == current_user.id,
                is_direct_friend=user_id in direct_friend_ids,
                mutual_count=mutual_count,
                connection_count=connection_count,
                path_parent_id=parent_by_node.get(user_id),
            )
        )

    edges = [
        FriendGraphEdgeRead(source_id=source_id, target_id=target_id, weight=1)
        for source_id, target_id in sorted(edge_keys)
    ]

    return FriendGraphRead(
        nodes=nodes,
        edges=edges,
        total_nodes=len(nodes),
        truncated=truncated,
    )


def search_users(db: Session, current_user: User, query: Optional[str]) -> list[UserSearchResultRead]:
    normalized_query = (query or "").strip()
    friend_ids = set(
        db.scalars(
            select(Friendship.friend_id).where(Friendship.user_id == current_user.id)
        ).all()
    )

    base_query = select(User).where(User.id != current_user.id)
    if friend_ids:
        base_query = base_query.where(
            or_(User.profile_indexing_enabled.is_(True), User.id.in_(friend_ids))
        )
    else:
        base_query = base_query.where(User.profile_indexing_enabled.is_(True))

    if normalized_query:
        pattern = f"%{normalized_query}%"
        base_query = base_query.where(
            or_(
                User.username.ilike(pattern),
                User.city.ilike(pattern),
                and_(User.searchable_by_email.is_(True), User.email.ilike(pattern)),
            )
        )

    base_query = base_query.order_by(User.username.asc())
    users = db.scalars(base_query.limit(20)).all()

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
    if not can_user_receive_friend_request(friend):
        raise ValueError("Cet utilisateur n'accepte pas de nouvelles demandes d'amis.")

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
    if not can_user_receive_direct_message(db, current_user, friend):
        raise ValueError("Cet utilisateur n'accepte pas ce type de partages.")

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
