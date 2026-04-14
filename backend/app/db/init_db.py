from __future__ import annotations

from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

import app.models  # noqa: F401
from app.db.seed import seed_database
from app.db.session import Base, engine


def _ensure_users_role_column() -> None:
    inspector = inspect(engine)
    columns = {column["name"] for column in inspector.get_columns("users")}
    if "role" in columns:
        return

    with engine.begin() as connection:
        connection.execute(
            text("ALTER TABLE users ADD COLUMN role VARCHAR(32) DEFAULT 'contributor'")
        )

def init_db(session: Session) -> None:
    Base.metadata.create_all(bind=engine)
    _ensure_users_role_column()
    seed_database(session)
