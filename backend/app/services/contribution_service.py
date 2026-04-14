from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.contribution import Contribution, ContributionStatus, ContributionType
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
    ContributionCreate,
    ContributionModerationRead,
    ContributionRead,
)
from app.services.auth_service import serialize_user

STATIC_DIR = Path(__file__).resolve().parent.parent / "static"


def _serialize_contribution(contribution: Contribution, submitter: User) -> ContributionModerationRead:
    return ContributionModerationRead(
        id=contribution.id,
        status=contribution.status,
        created_at=contribution.created_at,
        type=contribution.type,
        title=contribution.title,
        subtitle=contribution.subtitle,
        description=contribution.description,
        media_name=contribution.media_name,
        payload=contribution.payload or {},
        submitter=serialize_user(submitter),
    )


def create_contribution(
    db: Session, payload: ContributionCreate, current_user: User
) -> ContributionRead:
    contribution = Contribution(
        user_id=current_user.id,
        type=payload.type,
        title=payload.title,
        subtitle=payload.subtitle,
        description=payload.description,
        media_name=payload.media_name,
        payload={
            "city": payload.city,
            "address": payload.address,
            "neighborhood": payload.neighborhood,
            "opening_hours": payload.opening_hours,
            "role": payload.role,
            "event_date": payload.event_date,
            "end_date": payload.end_date,
            "price": payload.price,
            "media_kind": payload.media_kind,
            "external_url": payload.external_url,
            "linked_place_name": payload.linked_place_name,
            "linked_person_name": payload.linked_person_name,
            "linked_event_name": payload.linked_event_name,
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
        .where(Contribution.status == ContributionStatus.PENDING)
        .order_by(Contribution.created_at.desc())
    ).all()

    users = {
        user.id: user
        for user in db.scalars(
            select(User).where(User.id.in_([contribution.user_id for contribution in contributions]))
        ).all()
    }

    return [
      _serialize_contribution(contribution, users[contribution.user_id])
      for contribution in contributions
      if contribution.user_id in users
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
        ContributionType.MAGAZINE: "merci-mon-lapin.svg",
        ContributionType.PLACE: "musee-wurth.svg",
        ContributionType.PERSON: "juliette-steiner.svg",
        ContributionType.EVENT: "demolition-day.svg",
    }

    return f"{settings.backend_public_url}/static/mock/{fallback_map[contribution_type]}"


def _to_editorial_type(contribution_type: ContributionType) -> EditorialType:
    if contribution_type == ContributionType.PLACE:
        return EditorialType.PLACE
    if contribution_type == ContributionType.PERSON:
        return EditorialType.PERSON
    if contribution_type == ContributionType.EVENT:
        return EditorialType.EVENT
    return EditorialType.MAGAZINE


def _parse_event_date(raw_date: Optional[str]) -> datetime:
    if not raw_date:
        return datetime.now(timezone.utc)

    try:
        return datetime.fromisoformat(raw_date.replace("Z", "+00:00"))
    except ValueError:
        return datetime.now(timezone.utc)


def approve_contribution(db: Session, contribution_id: str) -> ContributionRead:
    contribution = db.scalar(
        select(Contribution).where(Contribution.id == contribution_id)
    )
    if not contribution:
        raise ValueError("Contribution introuvable.")

    if contribution.status == ContributionStatus.APPROVED:
        return ContributionRead(
            id=contribution.id,
            status=contribution.status,
            created_at=contribution.created_at,
            type=contribution.type,
            title=contribution.title,
        )

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
        (_find_related_editorial_id(db, payload.get("linked_place_name")), EditorialRelationType.LOCATED_AT),
        (_find_related_editorial_id(db, payload.get("linked_person_name")), EditorialRelationType.MENTIONS),
        (_find_related_editorial_id(db, payload.get("linked_event_name")), EditorialRelationType.RELATED),
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

    contribution.status = ContributionStatus.APPROVED
    db.commit()
    db.refresh(contribution)

    return ContributionRead(
        id=contribution.id,
        status=contribution.status,
        created_at=contribution.created_at,
        type=contribution.type,
        title=contribution.title,
    )
