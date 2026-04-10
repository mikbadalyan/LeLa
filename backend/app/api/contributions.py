from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.contribution import ContributionCreate, ContributionRead
from app.services.contribution_service import create_contribution

router = APIRouter(prefix="/contributions", tags=["contributions"])


@router.post("", response_model=ContributionRead)
def submit_contribution(
    payload: ContributionCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> ContributionRead:
    return create_contribution(db, payload, current_user)
