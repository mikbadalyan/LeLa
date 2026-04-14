from __future__ import annotations

from collections import OrderedDict
from datetime import date, datetime
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.editorial import EditorialObject, EditorialRelation, EditorialType, Event
from app.models.like import Like
from app.models.user import User
from app.schemas.editorial import (
    ContributorRead,
    EditorialCardRead,
    EditorialDetailRead,
    EditorialMetadata,
    EditorialRelationRead,
    FeedResponse,
    RelatedEntitySummary,
)
from app.schemas.social import MapMarkerRead

LOAD_OPTIONS = (
    selectinload(EditorialObject.contributor),
    selectinload(EditorialObject.place),
    selectinload(EditorialObject.person),
    selectinload(EditorialObject.event)
    .selectinload(Event.location)
    .selectinload(EditorialObject.place),
)


def _serialize_contributor(user: User) -> ContributorRead:
    return ContributorRead(
        id=user.id,
        username=user.username,
        display_name=user.username,
        avatar_url=user.avatar_url,
        city=user.city,
        role=user.role,
    )


def _serialize_metadata(item: EditorialObject) -> EditorialMetadata:
    if item.place:
        return EditorialMetadata(
            city=item.place.city,
            address=item.place.address,
            opening_hours=item.place.opening_hours,
        )

    if item.person:
        return EditorialMetadata(role=item.person.role)

    if item.event:
        address = None
        city = None
        if item.event.location and item.event.location.place:
            address = item.event.location.place.address
            city = item.event.location.place.city

        return EditorialMetadata(
            date=item.event.event_date,
            price=item.event.price,
            address=address,
            city=city,
        )

    return EditorialMetadata()


def _linked_entity(db: Session, item_id: str) -> Optional[RelatedEntitySummary]:
    relation = db.scalar(
        select(EditorialRelation).where(EditorialRelation.source_id == item_id).limit(1)
    )
    if not relation:
        relation = db.scalar(
            select(EditorialRelation).where(EditorialRelation.target_id == item_id).limit(1)
        )
    if not relation:
        return None

    related_id = relation.target_id if relation.source_id == item_id else relation.source_id
    target = db.scalar(select(EditorialObject).where(EditorialObject.id == related_id))
    if not target:
        return None

    return RelatedEntitySummary(
        id=target.id,
        type=target.type,
        title=target.title,
        subtitle=target.subtitle,
    )


def _serialize_card(
    db: Session, item: EditorialObject, current_user: Optional[User] = None
) -> EditorialCardRead:
    like_count = db.scalar(
        select(func.count(Like.id)).where(Like.editorial_object_id == item.id)
    ) or 0
    is_liked = False

    if current_user:
        is_liked = (
            db.scalar(
                select(Like.id).where(
                    Like.editorial_object_id == item.id, Like.user_id == current_user.id
                )
            )
            is not None
        )

    return EditorialCardRead(
        id=item.id,
        type=item.type,
        title=item.title,
        subtitle=item.subtitle,
        description=item.description,
        narrative_text=item.narrative_text,
        media_url=item.media_url,
        created_at=item.created_at,
        contributor=_serialize_contributor(item.contributor),
        linked_entity=_linked_entity(db, item.id),
        like_count=like_count,
        is_liked=is_liked,
        metadata=_serialize_metadata(item),
    )


def _normalize_city(value: Optional[str]) -> Optional[str]:
    if not value:
        return None

    normalized = value.strip().lower()
    return normalized or None


def _parse_selected_date(value: Optional[str]) -> Optional[date]:
    if not value:
        return None

    try:
        return datetime.fromisoformat(value).date()
    except ValueError:
        try:
            return date.fromisoformat(value)
        except ValueError:
            return None


def _matches_city(item: EditorialObject, city: Optional[str]) -> bool:
    normalized_city = _normalize_city(city)
    if not normalized_city:
        return True

    candidates = [
        item.contributor.city,
        item.place.city if item.place else None,
        item.event.location.place.city
        if item.event and item.event.location and item.event.location.place
        else None,
    ]

    return any(candidate and candidate.strip().lower() == normalized_city for candidate in candidates)


def _matches_selected_date(item: EditorialObject, selected_date: Optional[str]) -> bool:
    target_date = _parse_selected_date(selected_date)
    if not target_date or not item.event:
        return True

    return item.event.event_date.date() == target_date


def _apply_filters(
    items: list[EditorialObject],
    city: Optional[str] = None,
    selected_date: Optional[str] = None,
) -> list[EditorialObject]:
    return [
        item
        for item in items
        if _matches_city(item, city) and _matches_selected_date(item, selected_date)
    ]


def get_feed(
    db: Session,
    editorial_type: Optional[str],
    cursor: Optional[str],
    limit: int,
    current_user: Optional[User] = None,
    city: Optional[str] = None,
    selected_date: Optional[str] = None,
) -> FeedResponse:
    offset = int(cursor or 0)
    query = select(EditorialObject).options(*LOAD_OPTIONS).order_by(
        EditorialObject.created_at.desc()
    )

    if editorial_type:
        query = query.where(EditorialObject.type == editorial_type)

    filtered_items = _apply_filters(db.scalars(query).all(), city, selected_date)
    total = len(filtered_items)
    items = filtered_items[offset : offset + limit]

    next_cursor = str(offset + limit) if offset + limit < total else None

    return FeedResponse(
        items=[_serialize_card(db, item, current_user) for item in items],
        next_cursor=next_cursor,
        total=total,
    )


def get_editorial_detail(
    db: Session, editorial_id: str, current_user: Optional[User] = None
) -> Optional[EditorialDetailRead]:
    item = db.scalar(
        select(EditorialObject)
        .options(*LOAD_OPTIONS)
        .where(EditorialObject.id == editorial_id)
    )
    if not item:
        return None

    relations = db.scalars(
        select(EditorialRelation).where(
            (EditorialRelation.source_id == editorial_id)
            | (EditorialRelation.target_id == editorial_id)
        )
    ).all()

    related_ids = OrderedDict()
    for relation in relations:
        candidate_id = (
            relation.target_id if relation.source_id == editorial_id else relation.source_id
        )
        related_ids[candidate_id] = True

    related_items: list[EditorialCardRead] = []
    if related_ids:
        linked_objects = db.scalars(
            select(EditorialObject)
            .options(*LOAD_OPTIONS)
            .where(EditorialObject.id.in_(list(related_ids.keys())))
        ).all()
        ordered_objects = {
            entry.id: _serialize_card(db, entry, current_user) for entry in linked_objects
        }
        related_items = [ordered_objects[item_id] for item_id in related_ids if item_id in ordered_objects]

    card = _serialize_card(db, item, current_user)

    return EditorialDetailRead(
        **card.model_dump(),
        related=related_items,
        relations=[
            EditorialRelationRead(
                id=relation.id,
                source_id=relation.source_id,
                target_id=relation.target_id,
                relation_type=relation.relation_type,
            )
            for relation in relations
        ],
    )


def toggle_like(db: Session, editorial_id: str, current_user: User) -> tuple[bool, int]:
    existing_like = db.scalar(
        select(Like).where(
            Like.editorial_object_id == editorial_id, Like.user_id == current_user.id
        )
    )
    if existing_like:
        db.delete(existing_like)
        liked = False
    else:
        db.add(Like(user_id=current_user.id, editorial_object_id=editorial_id))
        liked = True

    db.commit()

    like_count = db.scalar(
        select(func.count(Like.id)).where(Like.editorial_object_id == editorial_id)
    ) or 0
    return liked, like_count


def get_liked_editorials(
    db: Session,
    current_user: User,
    city: Optional[str] = None,
    selected_date: Optional[str] = None,
) -> list[EditorialCardRead]:
    liked_items = db.scalars(
        select(EditorialObject)
        .join(Like, Like.editorial_object_id == EditorialObject.id)
        .options(*LOAD_OPTIONS)
        .where(Like.user_id == current_user.id)
        .order_by(EditorialObject.created_at.desc())
    ).all()

    filtered_items = _apply_filters(liked_items, city, selected_date)
    return [_serialize_card(db, item, current_user) for item in filtered_items]


def list_map_markers(
    db: Session,
    city: Optional[str] = None,
    selected_date: Optional[str] = None,
) -> list[MapMarkerRead]:
    items = _apply_filters(
        db.scalars(
            select(EditorialObject)
            .options(*LOAD_OPTIONS)
            .where(EditorialObject.type.in_([EditorialType.PLACE, EditorialType.EVENT]))
            .order_by(EditorialObject.created_at.desc())
        ).all(),
        city,
        selected_date,
    )
    markers: list[MapMarkerRead] = []

    for item in items:
        if item.place:
            markers.append(
                MapMarkerRead(
                    editorial_id=item.id,
                    type=item.type.value,
                    title=item.title,
                    subtitle=item.subtitle,
                    latitude=item.place.latitude,
                    longitude=item.place.longitude,
                    href=f"/editorial/{item.id}",
                    city=item.place.city,
                    date=item.event.event_date if item.event else None,
                )
            )
            continue

        if item.event and item.event.location and item.event.location.place:
            location = item.event.location.place
            markers.append(
                MapMarkerRead(
                    editorial_id=item.id,
                    type=item.type.value,
                    title=item.title,
                    subtitle=item.subtitle,
                    latitude=location.latitude,
                    longitude=location.longitude,
                    href=f"/editorial/{item.id}",
                    city=location.city,
                    date=item.event.event_date,
                )
            )

    return markers
