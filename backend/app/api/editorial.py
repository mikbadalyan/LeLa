from __future__ import annotations

from typing import Annotated
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_optional_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.editorial import EditorialDetailRead
from app.services.editorial_service import get_editorial_detail, toggle_like

router = APIRouter(prefix="/editorial", tags=["editorial"])


@router.get("/{editorial_id}", response_model=EditorialDetailRead)
def read_editorial_detail(
    editorial_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[Optional[User], Depends(get_optional_user)],
) -> EditorialDetailRead:
    editorial = get_editorial_detail(db, editorial_id, current_user)
    if editorial is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Carte introuvable.")

    return editorial


@router.post("/{editorial_id}/like")
def like_editorial(
    editorial_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> dict[str, object]:
    liked, like_count = toggle_like(db, editorial_id, current_user)
    return {"liked": liked, "like_count": like_count}
