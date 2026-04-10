from __future__ import annotations

from sqlalchemy.orm import Session

import app.models  # noqa: F401
from app.db.seed import seed_database
from app.db.session import Base, engine


def init_db(session: Session) -> None:
    Base.metadata.create_all(bind=engine)
    seed_database(session)
