from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.config import get_settings
from app.models.contribution import (
    Contribution,
    ContributionModerationAction,
    ContributionModerationEvent,
    ContributionStatus,
    ContributionType,
)
from app.models.editorial import (
    EditorialObject,
    EditorialRelation,
    EditorialRelationType,
    EditorialType,
    Event,
    Person,
    Place,
)
from app.models.user import User
from app.schemas.contribution import (
    ContributionModerationActionRequest,
    ContributionModerationEventRead,
    ContributionCreate,
    ContributionModerationRead,
    ContributionRead,
)
from app.services.auth_service import serialize_user

STATIC_DIR = Path(__file__).resolve().parent.parent / "static"


def _serialize_moderation_event(
    event: ContributionModerationEvent,
    moderator: User,
) -> ContributionModerationEventRead:
    return ContributionModerationEventRead(
        id=event.id,
        action=event.action,
        note=event.note,
        created_at=event.created_at,
        moderator=serialize_user(moderator),
    )


def _serialize_contribution(
    contribution: Contribution,
    submitter: User,
    *,
    reviewed_by: User | None = None,
    history: list[ContributionModerationEventRead] | None = None,
) -> ContributionModerationRead:
    return ContributionModerationRead(
        id=contribution.id,
        status=contribution.status,
        created_at=contribution.created_at,
        updated_at=contribution.updated_at,
        submitted_at=contribution.submitted_at,
        type=contribution.type,
        title=contribution.title,
        subtitle=contribution.subtitle,
        description=contribution.description,
        media_name=contribution.media_name,
        media_url=_media_url(contribution.media_name, contribution.type),
        payload=contribution.payload or {},
        submitter=serialize_user(submitter),
        moderation_note=contribution.moderation_note,
        reviewed_at=contribution.reviewed_at,
        reviewed_by=serialize_user(reviewed_by) if reviewed_by else None,
        history=history or [],
    )


def create_contribution(
    db: Session, payload: ContributionCreate, current_user: User
) -> ContributionRead:
    _validate_contribution_payload(payload)

    now = datetime.now(timezone.utc)
    primary_media_name = _primary_media_name(payload)
    contribution = Contribution(
        user_id=current_user.id,
        type=payload.type,
        title=payload.title,
        subtitle=payload.subtitle,
        description=payload.description,
        media_name=primary_media_name,
        status=ContributionStatus.PENDING,
        submitted_at=now,
        payload={
            "city": payload.city,
            "address": payload.address,
            "event_date": payload.event_date,
            "end_date": payload.end_date,
            "price": payload.price,
            "external_url": payload.external_url,
            "linked_place_name": payload.linked_place_name,
            "linked_person_name": payload.linked_person_name,
            "linked_event_name": payload.linked_event_name,
            "primary_media_kind": payload.primary_media_kind,
            "media_items": payload.media_items,
            "text_content": payload.text_content,
            "legacy_media_kind": payload.primary_media_kind
            if payload.primary_media_kind in {"image", "video", "audio"}
            else None,
        },
    )
    db.add(contribution)
    db.commit()
    db.refresh(contribution)

    return ContributionRead(
        id=contribution.id,
        status=contribution.status,
        created_at=contribution.created_at,
        type=contribution.type,
        title=contribution.title,
    )


def list_pending_contributions(db: Session) -> list[ContributionModerationRead]:
    contributions = db.scalars(
        select(Contribution)
        .options(selectinload(Contribution.moderation_events))
        .where(Contribution.status == ContributionStatus.PENDING)
        .order_by(Contribution.created_at.desc())
    ).all()

    if not contributions:
        return []

    users = {
        user.id: user
        for user in db.scalars(
            select(User).where(
                User.id.in_(
                    {
                        contribution.user_id
                        for contribution in contributions
                    }
                    | {
                        contribution.reviewed_by_user_id
                        for contribution in contributions
                        if contribution.reviewed_by_user_id
                    }
                    | {
                        event.moderator_id
                        for contribution in contributions
                        for event in contribution.moderation_events
                    }
                )
            )
        ).all()
    }

    return [
        _serialize_contribution(
            contribution,
            users[contribution.user_id],
            reviewed_by=users.get(contribution.reviewed_by_user_id),
            history=[
                _serialize_moderation_event(event, users[event.moderator_id])
                for event in contribution.moderation_events
                if event.moderator_id in users
            ],
        )
        for contribution in contributions
        if contribution.user_id in users
    ]


def list_user_contributions(db: Session, current_user: User) -> list[ContributionModerationRead]:
    contributions = db.scalars(
        select(Contribution)
        .options(selectinload(Contribution.moderation_events))
        .where(Contribution.user_id == current_user.id)
        .order_by(Contribution.created_at.desc())
    ).all()

    moderator_ids = {
        contribution.reviewed_by_user_id
        for contribution in contributions
        if contribution.reviewed_by_user_id
    } | {
        event.moderator_id
        for contribution in contributions
        for event in contribution.moderation_events
    }

    moderators = {
        user.id: user
        for user in db.scalars(select(User).where(User.id.in_(moderator_ids))).all()
    }

    return [
        _serialize_contribution(
            contribution,
            current_user,
            reviewed_by=moderators.get(contribution.reviewed_by_user_id),
            history=[
                _serialize_moderation_event(event, moderators[event.moderator_id])
                for event in contribution.moderation_events
                if event.moderator_id in moderators
            ],
        )
        for contribution in contributions
    ]


def _find_related_editorial_id(db: Session, text_value: Optional[str]) -> Optional[str]:
    if not text_value or not text_value.strip():
        return None

    normalized = text_value.strip().lower()
    objects = db.scalars(select(EditorialObject)).all()

    for item in objects:
        title = item.title.lower()
        subtitle = (item.subtitle or "").lower()
        if normalized in title or title in normalized or normalized in subtitle:
            return item.id

        if item.person and normalized in item.person.name.lower():
            return item.id

    return None


def _media_url(media_name: Optional[str], contribution_type: ContributionType) -> str:
    settings = get_settings()
    if media_name:
        for folder in ("mock", "imported"):
            candidate = STATIC_DIR / folder / media_name
            if candidate.exists():
                return f"{settings.backend_public_url}/static/{folder}/{media_name}"

    fallback_map = {
        ContributionType.MULTI_MEDIA: "merci-mon-lapin.svg",
        ContributionType.SINGLE_MEDIA: "musee-wurth.svg",
        ContributionType.MAGAZINE: "merci-mon-lapin.svg",
        ContributionType.PLACE: "musee-wurth.svg",
        ContributionType.PERSON: "juliette-steiner.svg",
        ContributionType.EVENT: "demolition-day.svg",
    }

    return f"{settings.backend_public_url}/static/mock/{fallback_map[contribution_type]}"


def _to_editorial_type(contribution_type: ContributionType) -> EditorialType:
    if contribution_type in {
        ContributionType.MULTI_MEDIA,
        ContributionType.SINGLE_MEDIA,
        ContributionType.MAGAZINE,
    }:
        return EditorialType.MAGAZINE
    if contribution_type == ContributionType.PLACE:
        return EditorialType.PLACE
    if contribution_type == ContributionType.PERSON:
        return EditorialType.PERSON
    if contribution_type == ContributionType.EVENT:
        return EditorialType.EVENT
    return EditorialType.MAGAZINE


def _primary_media_name(payload: ContributionCreate) -> Optional[str]:
    if payload.media_items:
        for item in payload.media_items:
            if payload.primary_media_kind and item.get("kind") == payload.primary_media_kind:
                return item.get("name")
        return payload.media_items[0].get("name")
    return None


def _content_piece_count(payload: ContributionCreate) -> int:
    count = len(payload.media_items)
    if payload.text_content and payload.text_content.strip():
        count += 1
    return count


def _validate_contribution_payload(payload: ContributionCreate) -> None:
    if not payload.title.strip():
        raise ValueError("Ajoutez un titre pour la contribution.")

    if not payload.description.strip():
        raise ValueError("Ajoutez une legende editoriale.")

    if payload.type == ContributionType.MULTI_MEDIA:
        if _content_piece_count(payload) < 2:
            raise ValueError(
                "Une carte multi-media doit contenir au moins deux contenus parmi texte, image, video ou audio."
            )
        return

    if payload.type == ContributionType.SINGLE_MEDIA:
        if _content_piece_count(payload) != 1:
            raise ValueError(
                "Une carte single-media doit contenir exactement un contenu: image, video, audio ou texte."
            )
        return

    if payload.type == ContributionType.EVENT:
        if not payload.event_date:
            raise ValueError("Ajoutez la date de l'evenement.")
        if not (payload.address or payload.linked_place_name):
            raise ValueError("Ajoutez une adresse ou un lieu lie pour l'evenement.")
        return


def _parse_event_date(raw_date: Optional[str]) -> datetime:
    if not raw_date:
        return datetime.now(timezone.utc)

    try:
        return datetime.fromisoformat(raw_date.replace("Z", "+00:00"))
    except ValueError:
        return datetime.now(timezone.utc)


def _append_moderation_event(
    db: Session,
    contribution: Contribution,
    moderator: User,
    action: ContributionModerationAction,
    note: str | None,
) -> None:
    db.add(
        ContributionModerationEvent(
            contribution_id=contribution.id,
            moderator_id=moderator.id,
            action=action,
            note=note,
        )
    )


def _publish_editorial_from_contribution(db: Session, contribution: Contribution) -> None:
    payload = contribution.payload or {}
    editorial = EditorialObject(
        type=_to_editorial_type(contribution.type),
        title=contribution.title,
        subtitle=contribution.subtitle,
        description=contribution.description,
        narrative_text=contribution.description,
        media_url=_media_url(contribution.media_name, contribution.type),
        contributor_id=contribution.user_id,
    )
    db.add(editorial)
    db.flush()

    if contribution.type == ContributionType.PLACE:
        db.add(
            Place(
                editorial_object_id=editorial.id,
                address=payload.get("address") or "Adresse a confirmer",
                city=payload.get("city") or "Strasbourg",
                latitude=48.5734,
                longitude=7.7521,
                opening_hours=payload.get("opening_hours"),
            )
        )
    elif contribution.type == ContributionType.PERSON:
        db.add(
            Person(
                editorial_object_id=editorial.id,
                name=contribution.title,
                role=payload.get("role") or contribution.subtitle or "contributeur",
                biography=contribution.description,
            )
        )
    elif contribution.type == ContributionType.EVENT:
        db.add(
            Event(
                editorial_object_id=editorial.id,
                event_date=_parse_event_date(payload.get("event_date")),
                price=int(payload["price"]) if str(payload.get("price", "")).isdigit() else None,
                location_id=_find_related_editorial_id(db, payload.get("linked_place_name")),
            )
        )

    relation_targets = [
        (
            _find_related_editorial_id(db, payload.get("linked_place_name")),
            EditorialRelationType.LOCATED_AT,
        ),
        (
            _find_related_editorial_id(db, payload.get("linked_person_name")),
            EditorialRelationType.MENTIONS,
        ),
        (
            _find_related_editorial_id(db, payload.get("linked_event_name")),
            EditorialRelationType.RELATED,
        ),
    ]

    for target_id, relation_type in relation_targets:
        if target_id and target_id != editorial.id:
            db.add(
                EditorialRelation(
                    source_id=editorial.id,
                    target_id=target_id,
                    relation_type=relation_type,
                )
            )


def _serialize_contribution_result(contribution: Contribution) -> ContributionRead:
    return ContributionRead(
        id=contribution.id,
        status=contribution.status,
        created_at=contribution.created_at,
        type=contribution.type,
        title=contribution.title,
        moderation_note=contribution.moderation_note,
        reviewed_at=contribution.reviewed_at,
    )


def moderate_contribution(
    db: Session,
    contribution_id: str,
    payload: ContributionModerationActionRequest,
    moderator: User,
) -> ContributionRead:
    contribution = db.scalar(
        select(Contribution).where(Contribution.id == contribution_id)
    )
    if not contribution:
        raise ValueError("Contribution introuvable.")

    note = (payload.note or "").strip() or None
    now = datetime.now(timezone.utc)

    if payload.action in {
        ContributionModerationAction.REJECTED,
        ContributionModerationAction.CHANGES_REQUESTED,
    } and not note:
        raise ValueError("Ajoutez une note de moderation pour cette action.")

    if (
        contribution.status == ContributionStatus.APPROVED
        and payload.action != ContributionModerationAction.APPROVED
    ):
        raise ValueError(
            "Cette contribution a deja ete publiee et ne peut plus changer de statut."
        )

    if payload.action == ContributionModerationAction.APPROVED:
        if contribution.status != ContributionStatus.APPROVED:
            _publish_editorial_from_contribution(db, contribution)
        contribution.status = ContributionStatus.APPROVED
    elif payload.action == ContributionModerationAction.CHANGES_REQUESTED:
        contribution.status = ContributionStatus.CHANGES_REQUESTED
    else:
        contribution.status = ContributionStatus.REJECTED

    contribution.moderation_note = note
    contribution.reviewed_by_user_id = moderator.id
    contribution.reviewed_at = now
    _append_moderation_event(db, contribution, moderator, payload.action, note)
    db.commit()
    db.refresh(contribution)

    return _serialize_contribution_result(contribution)


def approve_contribution(
    db: Session,
    contribution_id: str,
    moderator: User,
) -> ContributionRead:
    return moderate_contribution(
        db,
        contribution_id,
        ContributionModerationActionRequest(
            action=ContributionModerationAction.APPROVED
        ),
        moderator,
    )
