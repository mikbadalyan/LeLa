from __future__ import annotations

from collections import OrderedDict
from datetime import date, datetime
from typing import Optional

from sqlalchemy import func, or_, select
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


# ──────────────────────────────────────────────
# Serialisers
# ──────────────────────────────────────────────

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


# ──────────────────────────────────────────────
# Bulk linked-entity resolution (fixes N+1)
# ──────────────────────────────────────────────

def _bulk_linked_entities(
    db: Session, item_ids: list[str]
) -> dict[str, RelatedEntitySummary]:
    """Return a mapping of editorial_id → first linked RelatedEntitySummary."""
    if not item_ids:
        return {}

    relations = db.scalars(
        select(EditorialRelation).where(
            or_(
                EditorialRelation.source_id.in_(item_ids),
                EditorialRelation.target_id.in_(item_ids),
            )
        )
    ).all()

    if not relations:
        return {}

    # For each item, pick the first relation (source preferred over target)
    item_to_related: dict[str, str] = {}
    for rel in relations:
        if rel.source_id in item_ids and rel.source_id not in item_to_related:
            item_to_related[rel.source_id] = rel.target_id
        if rel.target_id in item_ids and rel.target_id not in item_to_related:
            item_to_related[rel.target_id] = rel.source_id

    related_ids = list(set(item_to_related.values()))
    if not related_ids:
        return {}

    targets = {
        obj.id: obj
        for obj in db.scalars(
            select(EditorialObject).where(EditorialObject.id.in_(related_ids))
        ).all()
    }

    return {
        item_id: RelatedEntitySummary(
            id=targets[rid].id,
            type=targets[rid].type,
            title=targets[rid].title,
            subtitle=targets[rid].subtitle,
        )
        for item_id, rid in item_to_related.items()
        if rid in targets
    }


def _bulk_like_counts(db: Session, item_ids: list[str]) -> dict[str, int]:
    if not item_ids:
        return {}
    rows = db.execute(
        select(Like.editorial_object_id, func.count(Like.id))
        .where(Like.editorial_object_id.in_(item_ids))
        .group_by(Like.editorial_object_id)
    ).all()
    return {row[0]: row[1] for row in rows}


def _bulk_liked_by_user(db: Session, item_ids: list[str], user_id: str) -> set[str]:
    if not item_ids:
        return set()
    rows = db.scalars(
        select(Like.editorial_object_id).where(
            Like.editorial_object_id.in_(item_ids),
            Like.user_id == user_id,
        )
    ).all()
    return set(rows)


# ──────────────────────────────────────────────
# Single-card serialiser (kept for detail page)
# ──────────────────────────────────────────────

def _serialize_card(
    db: Session,
    item: EditorialObject,
    current_user: Optional[User] = None,
    *,
    linked_entity: Optional[RelatedEntitySummary] = None,
    like_count: Optional[int] = None,
    is_liked: Optional[bool] = None,
) -> EditorialCardRead:
    if like_count is None:
        like_count = (
            db.scalar(
                select(func.count(Like.id)).where(Like.editorial_object_id == item.id)
            )
            or 0
        )

    if is_liked is None:
        is_liked = False
        if current_user:
            is_liked = (
                db.scalar(
                    select(Like.id).where(
                        Like.editorial_object_id == item.id,
                        Like.user_id == current_user.id,
                    )
                )
                is not None
            )

    if linked_entity is None:
        # Fallback: single-item lookup (used by detail page)
        linked_entity = _get_linked_entity_single(db, item.id)

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
        linked_entity=linked_entity,
        like_count=like_count,
        is_liked=is_liked,
        metadata=_serialize_metadata(item),
    )


def _get_linked_entity_single(
    db: Session, item_id: str
) -> Optional[RelatedEntitySummary]:
    relation = db.scalar(
        select(EditorialRelation)
        .where(EditorialRelation.source_id == item_id)
        .limit(1)
    )
    if not relation:
        relation = db.scalar(
            select(EditorialRelation)
            .where(EditorialRelation.target_id == item_id)
            .limit(1)
        )
    if not relation:
        return None

    related_id = (
        relation.target_id if relation.source_id == item_id else relation.source_id
    )
    target = db.scalar(
        select(EditorialObject).where(EditorialObject.id == related_id)
    )
    if not target:
        return None
    return RelatedEntitySummary(
        id=target.id,
        type=target.type,
        title=target.title,
        subtitle=target.subtitle,
    )


# ──────────────────────────────────────────────
# Filters
# ──────────────────────────────────────────────

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
    return any(
        candidate and candidate.strip().lower() == normalized_city
        for candidate in candidates
    )


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


# ──────────────────────────────────────────────
# Public API
# ──────────────────────────────────────────────

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
    query = (
        select(EditorialObject)
        .options(*LOAD_OPTIONS)
        .order_by(EditorialObject.created_at.desc())
    )

    if editorial_type:
        query = query.where(EditorialObject.type == editorial_type)

    filtered_items = _apply_filters(db.scalars(query).all(), city, selected_date)
    total = len(filtered_items)
    page_items = filtered_items[offset : offset + limit]
    next_cursor = str(offset + limit) if offset + limit < total else None

    if not page_items:
        return FeedResponse(items=[], next_cursor=next_cursor, total=total)

    # Batch all expensive lookups
    item_ids = [item.id for item in page_items]
    linked = _bulk_linked_entities(db, item_ids)
    counts = _bulk_like_counts(db, item_ids)
    liked_set: set[str] = (
        _bulk_liked_by_user(db, item_ids, current_user.id) if current_user else set()
    )

    return FeedResponse(
        items=[
            _serialize_card(
                db,
                item,
                current_user,
                linked_entity=linked.get(item.id),
                like_count=counts.get(item.id, 0),
                is_liked=item.id in liked_set,
            )
            for item in page_items
        ],
        next_cursor=next_cursor,
        total=total,
    )


def get_editorial_detail(
    db: Session,
    editorial_id: str,
    current_user: Optional[User] = None,
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
            or_(
                EditorialRelation.source_id == editorial_id,
                EditorialRelation.target_id == editorial_id,
            )
        )
    ).all()

    related_ids: OrderedDict[str, bool] = OrderedDict()
    for rel in relations:
        candidate = (
            rel.target_id if rel.source_id == editorial_id else rel.source_id
        )
        related_ids[candidate] = True

    related_items: list[EditorialCardRead] = []
    if related_ids:
        linked_objects = db.scalars(
            select(EditorialObject)
            .options(*LOAD_OPTIONS)
            .where(EditorialObject.id.in_(list(related_ids)))
        ).all()

        rel_ids = [o.id for o in linked_objects]
        rel_linked = _bulk_linked_entities(db, rel_ids)
        rel_counts = _bulk_like_counts(db, rel_ids)
        rel_liked: set[str] = (
            _bulk_liked_by_user(db, rel_ids, current_user.id) if current_user else set()
        )

        ordered = {
            o.id: _serialize_card(
                db,
                o,
                current_user,
                linked_entity=rel_linked.get(o.id),
                like_count=rel_counts.get(o.id, 0),
                is_liked=o.id in rel_liked,
            )
            for o in linked_objects
        }
        related_items = [ordered[rid] for rid in related_ids if rid in ordered]

    card = _serialize_card(db, item, current_user)

    return EditorialDetailRead(
        **card.model_dump(),
        related=related_items,
        relations=[
            EditorialRelationRead(
                id=rel.id,
                source_id=rel.source_id,
                target_id=rel.target_id,
                relation_type=rel.relation_type,
            )
            for rel in relations
        ],
    )


def toggle_like(
    db: Session, editorial_id: str, current_user: User
) -> tuple[bool, int]:
    existing = db.scalar(
        select(Like).where(
            Like.editorial_object_id == editorial_id,
            Like.user_id == current_user.id,
        )
    )
    if existing:
        db.delete(existing)
        liked = False
    else:
        db.add(Like(user_id=current_user.id, editorial_object_id=editorial_id))
        liked = True

    db.commit()

    like_count = (
        db.scalar(
            select(func.count(Like.id)).where(Like.editorial_object_id == editorial_id)
        )
        or 0
    )
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

    filtered = _apply_filters(liked_items, city, selected_date)
    if not filtered:
        return []

    item_ids = [i.id for i in filtered]
    linked = _bulk_linked_entities(db, item_ids)
    counts = _bulk_like_counts(db, item_ids)
    liked_set = _bulk_liked_by_user(db, item_ids, current_user.id)

    return [
        _serialize_card(
            db,
            item,
            current_user,
            linked_entity=linked.get(item.id),
            like_count=counts.get(item.id, 0),
            is_liked=item.id in liked_set,
        )
        for item in filtered
    ]


def list_map_markers(
    db: Session,
    city: Optional[str] = None,
    selected_date: Optional[str] = None,
) -> list[MapMarkerRead]:
    items = _apply_filters(
        db.scalars(
            select(EditorialObject)
            .options(*LOAD_OPTIONS)
            .where(
                EditorialObject.type.in_(
                    [EditorialType.PLACE, EditorialType.EVENT]
                )
            )
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
            loc = item.event.location.place
            markers.append(
                MapMarkerRead(
                    editorial_id=item.id,
                    type=item.type.value,
                    title=item.title,
                    subtitle=item.subtitle,
                    latitude=loc.latitude,
                    longitude=loc.longitude,
                    href=f"/editorial/{item.id}",
                    city=loc.city,
                    date=item.event.event_date,
                )
            )

    return markers



def list_user_editorials(
    db: Session,
    current_user: User,
) -> list[EditorialCardRead]:
    items = db.scalars(
        select(EditorialObject)
        .options(*LOAD_OPTIONS)
        .where(EditorialObject.contributor_id == current_user.id)
        .order_by(EditorialObject.created_at.desc())
    ).all()

    if not items:
        return []

    item_ids = [i.id for i in items]
    linked = _bulk_linked_entities(db, item_ids)
    counts = _bulk_like_counts(db, item_ids)
    liked_set = _bulk_liked_by_user(db, item_ids, current_user.id)

    return [
        _serialize_card(
            db,
            item,
            current_user,
            linked_entity=linked.get(item.id),
            like_count=counts.get(item.id, 0),
            is_liked=item.id in liked_set,
        )
        for item in items
    ]




def _resolve_media_kind(media_url: str | None) -> str | None:
    if not media_url:
        return None
    if media_url.endswith((".mp4", ".mov", ".webm")):
        return "video"
    if media_url.endswith((".jpg", ".jpeg", ".png", ".webp")):
        return "image"
    return "unknown"


def _resolve_poster_url(media_url: str | None) -> str | None:
    # simple version: return same URL for now
    return media_url
