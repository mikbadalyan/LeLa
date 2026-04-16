from __future__ import annotations

from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

import app.models  # noqa: F401  – registers all ORM models before create_all
from app.db.seed import seed_database
from app.db.session import Base, engine


def _ensure_users_role_column() -> None:
    """Add the `role` column to existing users tables that pre-date the enum migration."""
    inspector = inspect(engine)
    if "users" not in inspector.get_table_names():
        return  # Table will be created with the column by create_all

    columns = {col["name"] for col in inspector.get_columns("users")}
    if "role" in columns:
        return

    with engine.begin() as conn:
        conn.execute(
            text("ALTER TABLE users ADD COLUMN role VARCHAR(32) DEFAULT 'contributor' NOT NULL")
        )


def init_db(session: Session) -> None:
    Base.metadata.create_all(bind=engine)
    _ensure_users_role_column()
    seed_database(session)
