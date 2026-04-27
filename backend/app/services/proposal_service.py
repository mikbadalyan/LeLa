from __future__ import annotations

import re
from datetime import datetime, timezone
from typing import Any, Optional

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.contribution import (
    Card,
    CardCategoryMetadata,
    ContributionProposal,
    Fiche,
    ProposalStatus,
    ProposalType,
    PublishedEntityStatus,
    RevisionEntityType,
    RevisionHistory,
)
from app.models.editorial import EditorialObject, EditorialType, Event, Person, Place
from app.models.user import User
from app.schemas.contribution import (
    CardCreate,
    CardRead,
    CardSearchResult,
    CardUpdate,
    ContributionProposalCreate,
    ContributionProposalRead,
    ContributionProposalUpdate,
    FicheAiEvaluation,
    ProposalModerationRequest,
    PublishedFicheRead,
    RevisionHistoryRead,
)
from app.services.ai_moderation import evaluate_proposal_with_ai
from app.services.auth_service import serialize_user


def _role_value(user: User) -> str:
    return str(getattr(user.role, "value", user.role))


def _is_moderator(user: User) -> bool:
    return _role_value(user) == "moderator"


def _slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or "carte"


def _unique_slug(db: Session, title: str, current_id: str | None = None) -> str:
    base = _slugify(title)
    slug = base
    index = 2
    while True:
        query = select(Card).where(Card.slug == slug)
        if current_id:
            query = query.where(Card.id != current_id)
        if not db.scalar(query):
            return slug
        slug = f"{base}-{index}"
        index += 1


def _clean_tags(tags: list[str] | None) -> list[str]:
    seen: set[str] = set()
    clean: list[str] = []
    for tag in tags or []:
        value = tag.strip()
        key = value.lower()
        if value and key not in seen:
            clean.append(value)
            seen.add(key)
    return clean


def _fallback_media(category: CardCategoryMetadata) -> str:
    settings = get_settings()
    mapping = {
        CardCategoryMetadata.LIEU: "musee-wurth.svg",
        CardCategoryMetadata.PERSONNE: "juliette-steiner.svg",
        CardCategoryMetadata.EVENEMENT: "demolition-day.svg",
        CardCategoryMetadata.OBJET: "merci-mon-lapin.svg",
        CardCategoryMetadata.THEME: "merci-mon-lapin.svg",
        CardCategoryMetadata.AUTRE: "merci-mon-lapin.svg",
    }
    return f"{settings.backend_public_url}/static/mock/{mapping[category]}"


def _editorial_type(category: CardCategoryMetadata) -> EditorialType:
    if category == CardCategoryMetadata.LIEU:
        return EditorialType.PLACE
    if category == CardCategoryMetadata.PERSONNE:
        return EditorialType.PERSON
    if category == CardCategoryMetadata.EVENEMENT:
        return EditorialType.EVENT
    return EditorialType.MAGAZINE


def _category_from_editorial_type(editorial_type: EditorialType) -> CardCategoryMetadata:
    if editorial_type == EditorialType.PLACE:
        return CardCategoryMetadata.LIEU
    if editorial_type == EditorialType.PERSON:
        return CardCategoryMetadata.PERSONNE
    if editorial_type == EditorialType.EVENT:
        return CardCategoryMetadata.EVENEMENT
    return CardCategoryMetadata.AUTRE


def _card_snapshot(card: Card) -> dict[str, Any]:
    return {
        "id": card.id,
        "title": card.title,
        "slug": card.slug,
        "short_description": card.short_description,
        "category_metadata": card.category_metadata.value,
        "city": card.city,
        "location": card.location,
        "main_image": card.main_image,
        "tags": card.tags or [],
        "relations": card.relations or [],
        "why_exists": card.why_exists,
        "source_reference": card.source_reference,
        "status": card.status.value,
        "editorial_object_id": card.editorial_object_id,
    }


def _fiche_snapshot(fiche: Fiche) -> dict[str, Any]:
    return {
        "id": fiche.id,
        "card_id": fiche.card_id,
        "title": fiche.title,
        "sections": fiche.sections or {},
        "media_blocks": fiche.media_blocks or [],
        "sources": fiche.sources or [],
        "relations": fiche.relations or [],
        "tags": fiche.tags or [],
        "status": fiche.status.value,
    }


def _serialize_card(card: Card) -> CardRead:
    return CardRead(
        id=card.id,
        slug=card.slug,
        title=card.title,
        short_description=card.short_description,
        category_metadata=card.category_metadata,
        city=card.city,
        location=card.location,
        main_image=card.main_image,
        tags=card.tags or [],
        relations=card.relations or [],
        why_exists=card.why_exists,
        source_reference=card.source_reference,
        status=card.status,
        created_by=card.created_by,
        editorial_object_id=card.editorial_object_id,
        current_published_version_id=card.current_published_version_id,
        created_at=card.created_at,
        updated_at=card.updated_at,
    )


def _serialize_fiche(fiche: Fiche) -> PublishedFicheRead:
    return PublishedFicheRead(
        id=fiche.id,
        card_id=fiche.card_id,
        title=fiche.title,
        sections=fiche.sections or {},
        media_blocks=fiche.media_blocks or [],
        sources=fiche.sources or [],
        relations=fiche.relations or [],
        tags=fiche.tags or [],
        status=fiche.status,
        created_by=fiche.created_by,
        current_published_version_id=fiche.current_published_version_id,
        created_at=fiche.created_at,
        updated_at=fiche.updated_at,
    )


def _serialize_proposal(
    proposal: ContributionProposal,
    contributor: User,
    *,
    moderator: User | None = None,
    target_card: Card | None = None,
    target_fiche: Fiche | None = None,
) -> ContributionProposalRead:
    ai_review = (
        FicheAiEvaluation.model_validate(proposal.ai_review)
        if proposal.ai_review
        else None
    )
    return ContributionProposalRead(
        id=proposal.id,
        contribution_type=proposal.contribution_type,
        target_card_id=proposal.target_card_id,
        target_fiche_id=proposal.target_fiche_id,
        proposed_data=proposal.proposed_data or {},
        previous_data_snapshot=proposal.previous_data_snapshot,
        contributor=serialize_user(contributor),
        explanation=proposal.explanation,
        ai_review=ai_review,
        status=proposal.status,
        moderator=serialize_user(moderator) if moderator else None,
        moderator_notes=proposal.moderator_notes,
        created_at=proposal.created_at,
        updated_at=proposal.updated_at,
        submitted_at=proposal.submitted_at,
        reviewed_at=proposal.reviewed_at,
        target_card=_serialize_card(target_card) if target_card else None,
        target_fiche=_serialize_fiche(target_fiche) if target_fiche else None,
    )


def _load_users(db: Session, proposals: list[ContributionProposal]) -> dict[str, User]:
    user_ids = {
        proposal.contributor_id for proposal in proposals
    } | {proposal.moderator_id for proposal in proposals if proposal.moderator_id}
    if not user_ids:
        return {}
    return {user.id: user for user in db.scalars(select(User).where(User.id.in_(user_ids))).all()}


def _load_cards(db: Session, ids: set[str]) -> dict[str, Card]:
    if not ids:
        return {}
    return {card.id: card for card in db.scalars(select(Card).where(Card.id.in_(ids))).all()}


def _load_fiches(db: Session, ids: set[str]) -> dict[str, Fiche]:
    if not ids:
        return {}
    return {fiche.id: fiche for fiche in db.scalars(select(Fiche).where(Fiche.id.in_(ids))).all()}


def search_cards(
    db: Session,
    *,
    query: str | None = None,
    city: str | None = None,
    tags: str | None = None,
    category: CardCategoryMetadata | None = None,
    limit: int = 12,
) -> list[CardSearchResult]:
    tag_values = [tag.strip().lower() for tag in (tags or "").split(",") if tag.strip()]
    card_query = select(Card).where(Card.status == PublishedEntityStatus.PUBLISHED)
    if query:
        needle = f"%{query.strip()}%"
        card_query = card_query.where(
            or_(Card.title.ilike(needle), Card.short_description.ilike(needle))
        )
    if city:
        card_query = card_query.where(Card.city.ilike(f"%{city.strip()}%"))
    if category:
        card_query = card_query.where(Card.category_metadata == category)

    cards = db.scalars(card_query.order_by(Card.updated_at.desc()).limit(limit)).all()
    results = [
        CardSearchResult(
            id=card.id,
            title=card.title,
            short_description=card.short_description,
            city=card.city,
            image=card.main_image,
            status=card.status.value,
            category_metadata=card.category_metadata.value,
            tags=card.tags or [],
            source="card",
        )
        for card in cards
        if not tag_values
        or any(tag.lower() in tag_values for tag in (card.tags or []))
    ]

    remaining = max(0, limit - len(results))
    if remaining <= 0:
        return results

    editorial_query = select(EditorialObject)
    if query:
        needle = f"%{query.strip()}%"
        editorial_query = editorial_query.where(
            or_(EditorialObject.title.ilike(needle), EditorialObject.description.ilike(needle))
        )
    editorials = db.scalars(
        editorial_query.order_by(EditorialObject.created_at.desc()).limit(remaining)
    ).all()
    for item in editorials:
        city_value = item.place.city if item.place else None
        if city and city_value and city.strip().lower() not in city_value.lower():
            continue
        results.append(
            CardSearchResult(
                id=item.id,
                title=item.title,
                short_description=item.description,
                city=city_value,
                image=item.media_url,
                status="published",
                category_metadata=item.type.value,
                tags=[],
                source="editorial",
            )
        )
    return results


def create_card(db: Session, payload: CardCreate, current_user: User) -> CardRead:
    card = Card(
        title=payload.title.strip(),
        slug=_unique_slug(db, payload.title),
        short_description=payload.short_description.strip(),
        category_metadata=payload.category_metadata,
        city=(payload.city or "").strip() or None,
        location=(payload.location or "").strip() or None,
        main_image=(payload.main_image or "").strip() or None,
        tags=_clean_tags(payload.tags),
        relations=payload.relations,
        why_exists=(payload.why_exists or "").strip() or None,
        source_reference=(payload.source_reference or "").strip() or None,
        status=PublishedEntityStatus.DRAFT,
        created_by=current_user.id,
    )
    db.add(card)
    db.commit()
    db.refresh(card)
    return _serialize_card(card)


def read_card(db: Session, card_id: str) -> CardRead | None:
    card = db.scalar(
        select(Card).where(
            Card.id == card_id,
            Card.status == PublishedEntityStatus.PUBLISHED,
        )
    )
    return _serialize_card(card) if card else None


def read_card_by_editorial(db: Session, editorial_id: str) -> CardRead | None:
    card = db.scalar(
        select(Card).where(
            Card.editorial_object_id == editorial_id,
            Card.status == PublishedEntityStatus.PUBLISHED,
        )
    )
    return _serialize_card(card) if card else None


def list_card_fiches(db: Session, card_id: str) -> list[PublishedFicheRead]:
    fiches = db.scalars(
        select(Fiche)
        .where(Fiche.card_id == card_id, Fiche.status == PublishedEntityStatus.PUBLISHED)
        .order_by(Fiche.updated_at.desc())
    ).all()
    return [_serialize_fiche(fiche) for fiche in fiches]


def list_editorial_fiches(db: Session, editorial_id: str) -> list[PublishedFicheRead]:
    card = db.scalar(
        select(Card).where(
            Card.editorial_object_id == editorial_id,
            Card.status == PublishedEntityStatus.PUBLISHED,
        )
    )
    if not card:
        return []
    return list_card_fiches(db, card.id)


def _snapshot_for_target(
    db: Session,
    target_card_id: str | None,
    target_fiche_id: str | None,
) -> dict[str, Any] | None:
    if target_fiche_id:
        fiche = db.scalar(select(Fiche).where(Fiche.id == target_fiche_id))
        return _fiche_snapshot(fiche) if fiche else None
    if target_card_id:
        card = db.scalar(select(Card).where(Card.id == target_card_id))
        return _card_snapshot(card) if card else None
    return None


def create_proposal(
    db: Session,
    payload: ContributionProposalCreate,
    current_user: User,
) -> ContributionProposalRead:
    snapshot = payload.previous_data_snapshot or _snapshot_for_target(
        db, payload.target_card_id, payload.target_fiche_id
    )
    proposal = ContributionProposal(
        contribution_type=payload.contribution_type,
        target_card_id=payload.target_card_id,
        target_fiche_id=payload.target_fiche_id,
        proposed_data=payload.proposed_data,
        previous_data_snapshot=snapshot,
        contributor_id=current_user.id,
        explanation=(payload.explanation or "").strip() or None,
        status=ProposalStatus.DRAFT,
    )
    db.add(proposal)
    db.commit()
    db.refresh(proposal)
    return _serialize_proposal(proposal, current_user)


def list_my_proposals(db: Session, current_user: User) -> list[ContributionProposalRead]:
    proposals = db.scalars(
        select(ContributionProposal)
        .where(ContributionProposal.contributor_id == current_user.id)
        .order_by(ContributionProposal.updated_at.desc())
        .limit(100)
    ).all()
    return _serialize_proposals(db, proposals)


def list_moderation_proposals(
    db: Session,
    *,
    status_filter: ProposalStatus | None = ProposalStatus.PENDING_MODERATION,
    type_filter: ProposalType | None = None,
    city: str | None = None,
    min_score: int | None = None,
    duplicate_risk: int | None = None,
    category_metadata: CardCategoryMetadata | None = None,
    contributor: str | None = None,
    selected_date: str | None = None,
) -> list[ContributionProposalRead]:
    query = select(ContributionProposal).order_by(ContributionProposal.updated_at.desc())
    if status_filter:
        query = query.where(ContributionProposal.status == status_filter)
    if type_filter:
        query = query.where(ContributionProposal.contribution_type == type_filter)
    if contributor:
        needle = f"%{contributor.strip()}%"
        query = query.join(User, ContributionProposal.contributor_id == User.id).where(
            or_(User.username.ilike(needle), User.email.ilike(needle))
        )
    if selected_date:
        query = query.where(func.date(ContributionProposal.created_at) == selected_date)
    proposals = db.scalars(query.limit(150)).all()
    filtered: list[ContributionProposal] = []
    for proposal in proposals:
        data = proposal.proposed_data or {}
        card_data = data.get("card") if isinstance(data.get("card"), dict) else data
        card_reference = data.get("card_reference") if isinstance(data.get("card_reference"), dict) else {}
        city_value = str(card_data.get("city") or "")
        if not city_value:
            city_value = str(card_reference.get("city") or "")
        if city and city.strip().lower() not in city_value.lower():
            continue
        category_value = str(
            card_data.get("category_metadata") or card_reference.get("category_metadata") or ""
        )
        if category_metadata and category_value != category_metadata.value:
            continue
        review = proposal.ai_review or {}
        if min_score is not None and int(review.get("global_score") or -1) < min_score:
            continue
        if duplicate_risk is not None and int(review.get("duplicate_risk_score") or 0) < duplicate_risk:
            continue
        filtered.append(proposal)
    return _serialize_proposals(db, filtered)


def _serialize_proposals(
    db: Session,
    proposals: list[ContributionProposal],
) -> list[ContributionProposalRead]:
    users = _load_users(db, proposals)
    cards = _load_cards(db, {p.target_card_id for p in proposals if p.target_card_id})
    fiches = _load_fiches(db, {p.target_fiche_id for p in proposals if p.target_fiche_id})
    return [
        _serialize_proposal(
            proposal,
            users[proposal.contributor_id],
            moderator=users.get(proposal.moderator_id),
            target_card=cards.get(proposal.target_card_id or ""),
            target_fiche=fiches.get(proposal.target_fiche_id or ""),
        )
        for proposal in proposals
        if proposal.contributor_id in users
    ]


def read_proposal(
    db: Session,
    proposal_id: str,
    current_user: User,
) -> ContributionProposalRead:
    proposal = db.scalar(select(ContributionProposal).where(ContributionProposal.id == proposal_id))
    if not proposal:
        raise ValueError("Proposition introuvable.")
    if proposal.contributor_id != current_user.id and not _is_moderator(current_user):
        raise PermissionError("Acces refuse.")
    return _serialize_proposals(db, [proposal])[0]


def list_my_revision_history(db: Session, current_user: User) -> list[RevisionHistoryRead]:
    revisions = db.scalars(
        select(RevisionHistory)
        .where(RevisionHistory.contributor_id == current_user.id)
        .order_by(RevisionHistory.created_at.desc())
        .limit(100)
    ).all()
    return [
        RevisionHistoryRead(
            id=revision.id,
            entity_type=revision.entity_type,
            entity_id=revision.entity_id,
            version_number=revision.version_number,
            data_snapshot=revision.data_snapshot or {},
            contributor_id=revision.contributor_id,
            approved_by=revision.approved_by,
            created_at=revision.created_at,
        )
        for revision in revisions
    ]


def update_proposal(
    db: Session,
    proposal_id: str,
    payload: ContributionProposalUpdate,
    current_user: User,
) -> ContributionProposalRead:
    proposal = db.scalar(select(ContributionProposal).where(ContributionProposal.id == proposal_id))
    if not proposal:
        raise ValueError("Proposition introuvable.")
    if proposal.contributor_id != current_user.id and not _is_moderator(current_user):
        raise PermissionError("Acces refuse.")
    if proposal.status == ProposalStatus.APPROVED and not _is_moderator(current_user):
        raise ValueError("Une proposition approuvee ne peut plus etre modifiee.")

    updates = payload.model_dump(exclude_unset=True)
    for field_name, value in updates.items():
        setattr(proposal, field_name, value)
    if proposal.status in {ProposalStatus.NEEDS_CHANGES, ProposalStatus.REJECTED}:
        proposal.status = ProposalStatus.DRAFT
    db.commit()
    db.refresh(proposal)
    return _serialize_proposals(db, [proposal])[0]


def run_proposal_ai_review(
    db: Session,
    proposal_id: str,
    current_user: User,
) -> ContributionProposalRead:
    proposal = db.scalar(select(ContributionProposal).where(ContributionProposal.id == proposal_id))
    if not proposal:
        raise ValueError("Proposition introuvable.")
    if proposal.contributor_id != current_user.id and not _is_moderator(current_user):
        raise PermissionError("Acces refuse.")

    search_text = _proposal_title(proposal)
    similar = [
        result.model_dump()
        for result in search_cards(db, query=search_text, limit=6)
        if result.id not in {proposal.target_card_id, proposal.target_fiche_id}
    ]
    evaluation = evaluate_proposal_with_ai(
        ContributionProposalCreate(
            contribution_type=proposal.contribution_type,
            target_card_id=proposal.target_card_id,
            target_fiche_id=proposal.target_fiche_id,
            proposed_data=proposal.proposed_data or {},
            previous_data_snapshot=proposal.previous_data_snapshot,
            explanation=proposal.explanation,
        ),
        similar,
    )
    proposal.ai_review = evaluation.model_dump()
    proposal.status = ProposalStatus.AI_REVIEWED
    db.commit()
    db.refresh(proposal)
    return _serialize_proposals(db, [proposal])[0]


def submit_proposal_for_moderation(
    db: Session,
    proposal_id: str,
    current_user: User,
) -> ContributionProposalRead:
    proposal = db.scalar(select(ContributionProposal).where(ContributionProposal.id == proposal_id))
    if not proposal:
        raise ValueError("Proposition introuvable.")
    if proposal.contributor_id != current_user.id:
        raise PermissionError("Acces refuse.")
    if not proposal.ai_review:
        raise ValueError("L'analyse IA doit etre lancee avant soumission.")
    proposal.status = ProposalStatus.PENDING_MODERATION
    proposal.submitted_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(proposal)
    return _serialize_proposals(db, [proposal])[0]


def _proposal_title(proposal: ContributionProposal) -> str:
    data = proposal.proposed_data or {}
    card = data.get("card") if isinstance(data.get("card"), dict) else data
    fiche = data.get("fiche") if isinstance(data.get("fiche"), dict) else {}
    return str(card.get("title") or fiche.get("title") or "")


def _coerce_category(value: Any) -> CardCategoryMetadata:
    try:
        return CardCategoryMetadata(value or "autre")
    except ValueError:
        return CardCategoryMetadata.AUTRE


def _card_payload_from_data(data: dict[str, Any]) -> CardCreate:
    card_data = data.get("card") if isinstance(data.get("card"), dict) else data
    return CardCreate(
        title=str(card_data.get("title") or "").strip(),
        short_description=str(card_data.get("short_description") or "").strip(),
        category_metadata=_coerce_category(card_data.get("category_metadata")),
        city=(card_data.get("city") or None),
        location=(card_data.get("location") or None),
        main_image=(card_data.get("main_image") or None),
        tags=list(card_data.get("tags") or []),
        relations=list(card_data.get("relations") or []),
        why_exists=(card_data.get("why_exists") or None),
        source_reference=(card_data.get("source_reference") or None),
    )


def _publish_card_to_editorial(db: Session, card: Card) -> None:
    media_url = card.main_image or _fallback_media(card.category_metadata)
    if card.editorial_object_id:
        editorial = db.scalar(select(EditorialObject).where(EditorialObject.id == card.editorial_object_id))
        if editorial:
            editorial.type = _editorial_type(card.category_metadata)
            editorial.title = card.title
            editorial.subtitle = card.city or card.location
            editorial.description = card.short_description
            editorial.narrative_text = card.why_exists or card.short_description
            editorial.media_url = media_url
    else:
        editorial = EditorialObject(
            type=_editorial_type(card.category_metadata),
            title=card.title,
            subtitle=card.city or card.location,
            description=card.short_description,
            narrative_text=card.why_exists or card.short_description,
            media_url=media_url,
            contributor_id=card.created_by,
        )
        db.add(editorial)
        db.flush()
        card.editorial_object_id = editorial.id

    if card.category_metadata == CardCategoryMetadata.LIEU and card.editorial_object_id:
        existing = db.scalar(select(Place).where(Place.editorial_object_id == card.editorial_object_id))
        if not existing:
            db.add(
                Place(
                    editorial_object_id=card.editorial_object_id,
                    address=card.location or "Adresse a confirmer",
                    city=card.city or "Strasbourg",
                    latitude=48.5734,
                    longitude=7.7521,
                )
            )
    elif card.category_metadata == CardCategoryMetadata.PERSONNE and card.editorial_object_id:
        existing = db.scalar(select(Person).where(Person.editorial_object_id == card.editorial_object_id))
        if not existing:
            db.add(
                Person(
                    editorial_object_id=card.editorial_object_id,
                    name=card.title,
                    role=card.location or "acteur LE_LA",
                    biography=card.short_description,
                )
            )
    elif card.category_metadata == CardCategoryMetadata.EVENEMENT and card.editorial_object_id:
        existing = db.scalar(select(Event).where(Event.editorial_object_id == card.editorial_object_id))
        if not existing:
            db.add(
                Event(
                    editorial_object_id=card.editorial_object_id,
                    event_date=datetime.now(timezone.utc),
                    price=None,
                    location_id=None,
                )
            )


def _ensure_card_from_editorial(
    db: Session,
    editorial_id: str | None,
    contributor_id: str,
) -> Card | None:
    if not editorial_id:
        return None

    existing = db.scalar(select(Card).where(Card.editorial_object_id == editorial_id))
    if existing:
        return existing

    editorial = db.scalar(select(EditorialObject).where(EditorialObject.id == editorial_id))
    if not editorial:
        return None

    city = editorial.place.city if editorial.place else None
    card = Card(
        title=editorial.title,
        slug=_unique_slug(db, editorial.title),
        short_description=editorial.description,
        category_metadata=_category_from_editorial_type(editorial.type),
        city=city,
        location=editorial.subtitle,
        main_image=editorial.media_url,
        tags=[],
        relations=[],
        why_exists=editorial.narrative_text,
        source_reference="Carte héritée depuis le contenu éditorial existant.",
        status=PublishedEntityStatus.PUBLISHED,
        created_by=contributor_id,
        editorial_object_id=editorial.id,
    )
    db.add(card)
    db.flush()
    revision = _record_revision(
        db,
        entity_type=RevisionEntityType.CARD,
        entity_id=card.id,
        snapshot=_card_snapshot(card),
        contributor_id=contributor_id,
        moderator_id=None,
    )
    card.current_published_version_id = revision.id
    return card


def _target_card_for_proposal(
    db: Session,
    proposal: ContributionProposal,
) -> Card | None:
    if proposal.target_card_id:
        return db.scalar(select(Card).where(Card.id == proposal.target_card_id))

    data = proposal.proposed_data or {}
    reference = data.get("card_reference") if isinstance(data.get("card_reference"), dict) else {}
    linked_editorial_id = data.get("linked_editorial_id")
    if not linked_editorial_id and isinstance(reference, dict) and reference.get("source") == "editorial":
        linked_editorial_id = reference.get("id")

    card = _ensure_card_from_editorial(
        db,
        str(linked_editorial_id) if linked_editorial_id else None,
        proposal.contributor_id,
    )
    if card:
        proposal.target_card_id = card.id
    return card


def _next_version(db: Session, entity_type: RevisionEntityType, entity_id: str) -> int:
    current = db.scalar(
        select(func.max(RevisionHistory.version_number)).where(
            RevisionHistory.entity_type == entity_type,
            RevisionHistory.entity_id == entity_id,
        )
    )
    return int(current or 0) + 1


def _record_revision(
    db: Session,
    *,
    entity_type: RevisionEntityType,
    entity_id: str,
    snapshot: dict[str, Any],
    contributor_id: str | None,
    moderator_id: str | None,
) -> RevisionHistory:
    revision = RevisionHistory(
        entity_type=entity_type,
        entity_id=entity_id,
        version_number=_next_version(db, entity_type, entity_id),
        data_snapshot=snapshot,
        contributor_id=contributor_id,
        approved_by=moderator_id,
    )
    db.add(revision)
    db.flush()
    return revision


def _apply_card_payload(card: Card, payload: CardCreate | CardUpdate, db: Session) -> None:
    data = payload.model_dump(exclude_unset=True)
    if "title" in data and data["title"]:
        card.title = data["title"].strip()
        card.slug = _unique_slug(db, card.title, current_id=card.id)
    if "short_description" in data and data["short_description"]:
        card.short_description = data["short_description"].strip()
    if "category_metadata" in data and data["category_metadata"]:
        card.category_metadata = data["category_metadata"]
    for field in ["city", "location", "main_image", "why_exists", "source_reference"]:
        if field in data:
            value = data[field]
            setattr(card, field, value.strip() if isinstance(value, str) and value.strip() else None)
    if "tags" in data and data["tags"] is not None:
        card.tags = _clean_tags(data["tags"])
    if "relations" in data and data["relations"] is not None:
        card.relations = data["relations"]


def _apply_fiche_payload(
    db: Session,
    *,
    card_id: str,
    data: dict[str, Any],
    current_user: User,
    existing: Fiche | None = None,
) -> Fiche:
    fiche_data = data.get("fiche") if isinstance(data.get("fiche"), dict) else data
    if existing:
        fiche = existing
    else:
        fiche = Fiche(
            card_id=card_id,
            title=str(fiche_data.get("title") or "").strip() or "Fiche LE_LA",
            sections={},
            created_by=current_user.id,
        )
        db.add(fiche)

    correction = data.get("correction") if isinstance(data.get("correction"), dict) else None
    if correction and existing:
        section_label = str(correction.get("section") or "correction").strip()
        section_key = section_label.lower()
        if "résumé" in section_key or "resume" in section_key or "intro" in section_key:
            section_key = "resume"
        elif "description" in section_key:
            section_key = "description"
        elif "contexte" in section_key or "histor" in section_key or "culture" in section_key:
            section_key = "contexte"
        elif "pratique" in section_key:
            section_key = "pratique"
        proposed_text = str(correction.get("proposed_text") or "").strip()
        if proposed_text:
            sections = dict(fiche.sections or {})
            sections[section_key] = proposed_text
            fiche.sections = sections
        fiche.status = PublishedEntityStatus.PUBLISHED
        return fiche

    fiche.title = str(fiche_data.get("title") or fiche.title).strip()
    fiche.sections = dict(fiche_data.get("sections") or {})
    fiche.media_blocks = list(fiche_data.get("media_blocks") or [])
    fiche.sources = list(fiche_data.get("sources") or [])
    fiche.relations = list(fiche_data.get("relations") or [])
    fiche.tags = _clean_tags(list(fiche_data.get("tags") or []))
    fiche.status = PublishedEntityStatus.PUBLISHED
    return fiche


def moderate_proposal(
    db: Session,
    proposal_id: str,
    moderator: User,
    target_status: ProposalStatus,
    payload: ProposalModerationRequest,
) -> ContributionProposalRead:
    proposal = db.scalar(select(ContributionProposal).where(ContributionProposal.id == proposal_id))
    if not proposal:
        raise ValueError("Proposition introuvable.")
    note = (payload.moderator_notes or "").strip() or None
    if target_status in {ProposalStatus.REJECTED, ProposalStatus.NEEDS_CHANGES} and not note:
        raise ValueError("Ajoutez une note de moderation.")

    if target_status == ProposalStatus.APPROVED:
        _approve_proposal(db, proposal, moderator)
    proposal.status = target_status
    proposal.moderator_id = moderator.id
    proposal.moderator_notes = note
    proposal.reviewed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(proposal)
    return _serialize_proposals(db, [proposal])[0]


def _approve_proposal(db: Session, proposal: ContributionProposal, moderator: User) -> None:
    data = proposal.proposed_data or {}
    if proposal.contribution_type == ProposalType.CREATE_CARD:
        payload = _card_payload_from_data(data)
        card = Card(
            title=payload.title,
            slug=_unique_slug(db, payload.title),
            short_description=payload.short_description,
            category_metadata=payload.category_metadata,
            city=payload.city,
            location=payload.location,
            main_image=payload.main_image,
            tags=_clean_tags(payload.tags),
            relations=payload.relations,
            why_exists=payload.why_exists,
            source_reference=payload.source_reference,
            status=PublishedEntityStatus.PUBLISHED,
            created_by=proposal.contributor_id,
        )
        db.add(card)
        db.flush()
        _publish_card_to_editorial(db, card)
        revision = _record_revision(
            db,
            entity_type=RevisionEntityType.CARD,
            entity_id=card.id,
            snapshot=_card_snapshot(card),
            contributor_id=proposal.contributor_id,
            moderator_id=moderator.id,
        )
        card.current_published_version_id = revision.id
        if isinstance(data.get("fiche"), dict):
            fiche = _apply_fiche_payload(db, card_id=card.id, data=data, current_user=moderator)
            fiche.created_by = proposal.contributor_id
            db.flush()
            fiche_revision = _record_revision(
                db,
                entity_type=RevisionEntityType.FICHE,
                entity_id=fiche.id,
                snapshot=_fiche_snapshot(fiche),
                contributor_id=proposal.contributor_id,
                moderator_id=moderator.id,
            )
            fiche.current_published_version_id = fiche_revision.id
        proposal.target_card_id = card.id
        return

    target_card = _target_card_for_proposal(db, proposal)

    if (
        proposal.contribution_type in {ProposalType.UPDATE_CARD, ProposalType.CORRECTION}
        and target_card
        and not proposal.target_fiche_id
    ):
        card = target_card
        if not card:
            raise ValueError("Carte cible introuvable.")
        if proposal.contribution_type == ProposalType.CORRECTION and "card" not in data:
            correction = data.get("correction") if isinstance(data.get("correction"), dict) else {}
            proposed_text = str(correction.get("proposed_text") or "").strip()
            section = str(correction.get("section") or "").lower()
            if proposed_text and "titre" in section:
                card.title = proposed_text[:255]
                card.slug = _unique_slug(db, card.title, current_id=card.id)
            elif proposed_text:
                card.short_description = proposed_text
        else:
            _apply_card_payload(card, CardUpdate.model_validate(_card_payload_from_data(data).model_dump()), db)
        card.status = PublishedEntityStatus.PUBLISHED
        _publish_card_to_editorial(db, card)
        revision = _record_revision(
            db,
            entity_type=RevisionEntityType.CARD,
            entity_id=card.id,
            snapshot=_card_snapshot(card),
            contributor_id=proposal.contributor_id,
            moderator_id=moderator.id,
        )
        card.current_published_version_id = revision.id
        return

    if proposal.contribution_type in {ProposalType.CREATE_FICHE, ProposalType.UPDATE_FICHE, ProposalType.CORRECTION}:
        target_card_id = proposal.target_card_id or str(data.get("linked_card_id") or "")
        if not target_card_id and target_card:
            target_card_id = target_card.id
        existing_fiche = None
        if proposal.target_fiche_id:
            existing_fiche = db.scalar(select(Fiche).where(Fiche.id == proposal.target_fiche_id))
            if not existing_fiche:
                raise ValueError("Fiche cible introuvable.")
            target_card_id = existing_fiche.card_id
        if not target_card_id:
            raise ValueError("Carte cible obligatoire pour publier une fiche.")
        fiche = _apply_fiche_payload(
            db,
            card_id=target_card_id,
            data=data,
            current_user=moderator,
            existing=existing_fiche,
        )
        if not existing_fiche:
            fiche.created_by = proposal.contributor_id
        db.flush()
        revision = _record_revision(
            db,
            entity_type=RevisionEntityType.FICHE,
            entity_id=fiche.id,
            snapshot=_fiche_snapshot(fiche),
            contributor_id=proposal.contributor_id,
            moderator_id=moderator.id,
        )
        fiche.current_published_version_id = revision.id
        proposal.target_fiche_id = fiche.id
        proposal.target_card_id = target_card_id
