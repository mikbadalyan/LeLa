from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.message import ConversationSummaryRead, MessageCreate, MessageRead
from app.services.message_service import create_message, list_conversations, read_conversation

router = APIRouter(prefix="/messages", tags=["messages"])


@router.get("/conversations", response_model=list[ConversationSummaryRead])
def get_conversations(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> list[ConversationSummaryRead]:
    return list_conversations(db, current_user)


@router.get("/conversations/{participant_id}", response_model=list[MessageRead])
def get_conversation_messages(
    participant_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> list[MessageRead]:
    try:
        return read_conversation(db, current_user, participant_id)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error


@router.post("", response_model=MessageRead)
def post_message(
    payload: MessageCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> MessageRead:
    try:
        return create_message(db, current_user, payload)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error
