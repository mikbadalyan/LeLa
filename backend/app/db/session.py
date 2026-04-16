from __future__ import annotations

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import get_settings


class Base(DeclarativeBase):
    pass


settings = get_settings()

engine = create_engine(
    settings.database_url,
    future=True,
    echo=False,
    pool_pre_ping=True,   # Reconnect if the connection was dropped
    pool_recycle=3600,    # Recycle connections after 1 hour
    pool_size=5,
    max_overflow=10,
)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
    future=True,
)


def get_db():
    """FastAPI dependency that provides a scoped DB session."""
    with SessionLocal() as session:
        try:
            yield session
        except Exception:
            session.rollback()
            raise
