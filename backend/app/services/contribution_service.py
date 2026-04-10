from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.contribution import Contribution
from app.models.user import User
from app.schemas.contribution import ContributionCreate, ContributionRead


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
            "event_date": payload.event_date,
            "external_url": payload.external_url,
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
