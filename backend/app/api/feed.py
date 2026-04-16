from __future__ import annotations

from typing import Annotated
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.deps import get_optional_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.editorial import FeedResponse
from app.services.editorial_service import get_feed

router = APIRouter(prefix="/feed", tags=["feed"])


@router.get("", response_model=FeedResponse)
def read_feed(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[Optional[User], Depends(get_optional_user)],
    type: Optional[str] = Query(default=None),
    cursor: Optional[str] = Query(default=None),
    limit: int = Query(default=5, le=20),
    city: Optional[str] = Query(default=None),
    date: Optional[str] = Query(default=None),
    media: Optional[str] = Query(default=None),
) -> FeedResponse:
    return get_feed(
        db,
        type,
        cursor,
        limit,
        current_user,
        city=city,
        selected_date=date,
        media_filter=media,
    )
