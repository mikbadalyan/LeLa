from __future__ import annotations

from typing import Annotated
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_moderator_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.contribution import (
    ContributionCreate,
    ContributionModerationRead,
    ContributionRead,
)
from app.services.contribution_service import (
    approve_contribution,
    create_contribution,
    list_pending_contributions,
    list_user_contributions,
)

router = APIRouter(prefix="/contributions", tags=["contributions"])


@router.post("", response_model=ContributionRead)
def submit_contribution(
    payload: ContributionCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> ContributionRead:
    return create_contribution(db, payload, current_user)


@router.get("", response_model=list[ContributionModerationRead])
def read_contributions(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(get_moderator_user)],
    status_filter: Optional[str] = Query(default="pending", alias="status"),
) -> list[ContributionModerationRead]:
    if status_filter != "pending":
        return []

    return list_pending_contributions(db)


@router.get("/mine", response_model=list[ContributionModerationRead])
def read_my_contributions(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> list[ContributionModerationRead]:
    return list_user_contributions(db, current_user)


@router.post("/{contribution_id}/approve", response_model=ContributionRead)
def approve_pending_contribution(
    contribution_id: str,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(get_moderator_user)],
) -> ContributionRead:
    try:
        return approve_contribution(db, contribution_id)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
