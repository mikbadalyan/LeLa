from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import or_, select
from sqlalchemy.orm import Session, selectinload

from app.core.media import resolve_media_kind, resolve_poster_url
from app.models.direct_message import DirectMessage
from app.models.editorial import EditorialObject
from app.models.user import User
from app.schemas.auth import UserRead
from app.schemas.message import (
    ConversationSummaryRead,
    MessageCreate,
    MessageEditorialAttachment,
    MessageRead,
)
from app.services.auth_service import can_user_receive_direct_message, serialize_user


def _serialize_editorial(editorial: Optional[EditorialObject]) -> Optional[MessageEditorialAttachment]:
    if not editorial:
        return None

    return MessageEditorialAttachment(
        id=editorial.id,
        title=editorial.title,
        subtitle=editorial.subtitle,
        media_url=editorial.media_url,
        media_kind=resolve_media_kind(editorial.media_url) or "image",
        poster_url=resolve_poster_url(editorial.id, editorial.media_url),
        href=f"/editorial/{editorial.id}",
    )


def _serialize_message(message: DirectMessage, current_user: User) -> MessageRead:
    return MessageRead(
        id=message.id,
        content=message.body,
        created_at=message.created_at,
        is_mine=message.sender_id == current_user.id,
        sender=UserRead(**serialize_user(message.sender, viewer=current_user).model_dump()),
        recipient=UserRead(**serialize_user(message.recipient, viewer=current_user).model_dump()),
        editorial=_serialize_editorial(message.editorial_object),
    )


def _ensure_participant(db: Session, current_user: User, participant_id: str) -> User:
    if participant_id == current_user.id:
        raise ValueError("Vous ne pouvez pas ouvrir une conversation avec vous-meme.")

    participant = db.scalar(select(User).where(User.id == participant_id))
    if not participant:
        raise ValueError("Utilisateur introuvable.")

    return participant


def list_conversations(db: Session, current_user: User) -> list[ConversationSummaryRead]:
    messages = db.scalars(
        select(DirectMessage)
        .options(
            selectinload(DirectMessage.sender),
            selectinload(DirectMessage.recipient),
            selectinload(DirectMessage.editorial_object),
        )
        .where(
            or_(
                DirectMessage.sender_id == current_user.id,
                DirectMessage.recipient_id == current_user.id,
            )
        )
        .order_by(DirectMessage.created_at.desc())
    ).all()

    grouped: dict[str, list[DirectMessage]] = {}
    participants: dict[str, User] = {}
    for message in messages:
        participant = message.recipient if message.sender_id == current_user.id else message.sender
        grouped.setdefault(participant.id, []).append(message)
        participants[participant.id] = participant

    summaries: list[ConversationSummaryRead] = []
    for participant_id, thread in grouped.items():
        last_message = thread[0]
        participant = participants[participant_id]
        unread_count = sum(
            1
            for entry in thread
            if entry.recipient_id == current_user.id and entry.read_at is None
        )
        preview = (
            last_message.body.strip()
            if last_message.body
            else f"Carte partagee: {last_message.editorial_object.title}"
            if last_message.editorial_object
            else "Message"
        )
        summaries.append(
            ConversationSummaryRead(
                participant=UserRead(**serialize_user(participant, viewer=current_user).model_dump()),
                last_message_preview=preview,
                last_message_at=last_message.created_at,
                unread_count=unread_count,
                last_message_kind="editorial" if last_message.editorial_object else "text",
            )
        )

    summaries.sort(key=lambda summary: summary.last_message_at, reverse=True)
    return summaries


def read_conversation(db: Session, current_user: User, participant_id: str) -> list[MessageRead]:
    _ensure_participant(db, current_user, participant_id)

    messages = db.scalars(
        select(DirectMessage)
        .options(
            selectinload(DirectMessage.sender),
            selectinload(DirectMessage.recipient),
            selectinload(DirectMessage.editorial_object),
        )
        .where(
            or_(
                (DirectMessage.sender_id == current_user.id)
                & (DirectMessage.recipient_id == participant_id),
                (DirectMessage.sender_id == participant_id)
                & (DirectMessage.recipient_id == current_user.id),
            )
        )
        .order_by(DirectMessage.created_at.asc())
    ).all()

    updated = False
    for message in messages:
        if message.recipient_id == current_user.id and message.read_at is None:
            message.read_at = datetime.now(timezone.utc)
            updated = True

    if updated:
        db.commit()

    return [_serialize_message(message, current_user) for message in messages]


def create_message(db: Session, current_user: User, payload: MessageCreate) -> MessageRead:
    recipient = _ensure_participant(db, current_user, payload.recipient_id)
    content = (payload.content or "").strip()
    if not content:
        raise ValueError("Le message ne peut pas etre vide.")

    message = DirectMessage(
        sender_id=current_user.id,
        recipient_id=recipient.id,
        body=content,
    )
    db.add(message)
    db.commit()
    db.refresh(message)

    message.sender = current_user
    message.recipient = recipient
    return _serialize_message(message, current_user)


def create_editorial_message(
    db: Session,
    current_user: User,
    recipient: User,
    editorial: EditorialObject,
) -> None:
    if not can_user_receive_direct_message(db, current_user, recipient):
        raise ValueError("Cet utilisateur n'accepte pas ce type de messages.")
    message = DirectMessage(
        sender_id=current_user.id,
        recipient_id=recipient.id,
        editorial_object_id=editorial.id,
    )
    db.add(message)
