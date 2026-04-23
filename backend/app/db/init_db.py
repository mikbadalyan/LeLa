from __future__ import annotations

from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

import app.models  # noqa: F401  – registers all ORM models before create_all
from app.db.seed import seed_database
from app.db.session import Base, engine


def _ensure_users_columns() -> None:
    """Add settings columns to existing users tables that pre-date the latest schema."""
    inspector = inspect(engine)
    if "users" not in inspector.get_table_names():
        return

    columns = {col["name"] for col in inspector.get_columns("users")}
    definitions = {
        "role": "ALTER TABLE users ADD COLUMN role VARCHAR(32) DEFAULT 'contributor' NOT NULL",
        "interface_language": "ALTER TABLE users ADD COLUMN interface_language VARCHAR(8) DEFAULT 'fr' NOT NULL",
        "theme_preference": "ALTER TABLE users ADD COLUMN theme_preference VARCHAR(16) DEFAULT 'system' NOT NULL",
        "compact_mode": "ALTER TABLE users ADD COLUMN compact_mode BOOLEAN DEFAULT TRUE NOT NULL",
        "autoplay_previews": "ALTER TABLE users ADD COLUMN autoplay_previews BOOLEAN DEFAULT FALSE NOT NULL",
        "reduce_motion": "ALTER TABLE users ADD COLUMN reduce_motion BOOLEAN DEFAULT FALSE NOT NULL",
        "large_text": "ALTER TABLE users ADD COLUMN large_text BOOLEAN DEFAULT FALSE NOT NULL",
        "high_contrast": "ALTER TABLE users ADD COLUMN high_contrast BOOLEAN DEFAULT FALSE NOT NULL",
        "sound_effects": "ALTER TABLE users ADD COLUMN sound_effects BOOLEAN DEFAULT TRUE NOT NULL",
        "data_saver": "ALTER TABLE users ADD COLUMN data_saver BOOLEAN DEFAULT FALSE NOT NULL",
        "profile_visibility": "ALTER TABLE users ADD COLUMN profile_visibility VARCHAR(16) DEFAULT 'public' NOT NULL",
        "show_email": "ALTER TABLE users ADD COLUMN show_email BOOLEAN DEFAULT FALSE NOT NULL",
        "show_city": "ALTER TABLE users ADD COLUMN show_city BOOLEAN DEFAULT TRUE NOT NULL",
        "show_activity_status": "ALTER TABLE users ADD COLUMN show_activity_status BOOLEAN DEFAULT TRUE NOT NULL",
        "searchable_by_email": "ALTER TABLE users ADD COLUMN searchable_by_email BOOLEAN DEFAULT TRUE NOT NULL",
        "allow_friend_requests": "ALTER TABLE users ADD COLUMN allow_friend_requests BOOLEAN DEFAULT TRUE NOT NULL",
        "allow_direct_messages": "ALTER TABLE users ADD COLUMN allow_direct_messages VARCHAR(16) DEFAULT 'friends' NOT NULL",
        "allow_tagging": "ALTER TABLE users ADD COLUMN allow_tagging BOOLEAN DEFAULT TRUE NOT NULL",
        "profile_indexing_enabled": "ALTER TABLE users ADD COLUMN profile_indexing_enabled BOOLEAN DEFAULT TRUE NOT NULL",
        "two_factor_enabled": "ALTER TABLE users ADD COLUMN two_factor_enabled BOOLEAN DEFAULT FALSE NOT NULL",
        "login_alerts": "ALTER TABLE users ADD COLUMN login_alerts BOOLEAN DEFAULT TRUE NOT NULL",
        "security_reminders": "ALTER TABLE users ADD COLUMN security_reminders BOOLEAN DEFAULT TRUE NOT NULL",
        "marketing_emails": "ALTER TABLE users ADD COLUMN marketing_emails BOOLEAN DEFAULT FALSE NOT NULL",
        "product_updates": "ALTER TABLE users ADD COLUMN product_updates BOOLEAN DEFAULT TRUE NOT NULL",
        "weekly_digest": "ALTER TABLE users ADD COLUMN weekly_digest BOOLEAN DEFAULT FALSE NOT NULL",
        "message_notifications": "ALTER TABLE users ADD COLUMN message_notifications BOOLEAN DEFAULT TRUE NOT NULL",
        "friend_request_notifications": "ALTER TABLE users ADD COLUMN friend_request_notifications BOOLEAN DEFAULT TRUE NOT NULL",
        "moderation_notifications": "ALTER TABLE users ADD COLUMN moderation_notifications BOOLEAN DEFAULT TRUE NOT NULL",
        "last_password_changed_at": "ALTER TABLE users ADD COLUMN last_password_changed_at DATETIME",
    }

    with engine.begin() as conn:
        for column_name, ddl in definitions.items():
            if column_name not in columns:
                conn.execute(text(ddl))


def _ensure_contributions_columns() -> None:
    inspector = inspect(engine)
    if "contributions" not in inspector.get_table_names():
        return

    columns = {col["name"] for col in inspector.get_columns("contributions")}
    definitions = {
        "moderation_note": "ALTER TABLE contributions ADD COLUMN moderation_note TEXT",
        "reviewed_by_user_id": "ALTER TABLE contributions ADD COLUMN reviewed_by_user_id VARCHAR(36)",
        "reviewed_at": "ALTER TABLE contributions ADD COLUMN reviewed_at DATETIME",
        "submitted_at": "ALTER TABLE contributions ADD COLUMN submitted_at DATETIME",
        "updated_at": "ALTER TABLE contributions ADD COLUMN updated_at DATETIME",
    }

    with engine.begin() as conn:
        for column_name, ddl in definitions.items():
            if column_name not in columns:
                conn.execute(text(ddl))

        if "submitted_at" in definitions:
            conn.execute(
                text(
                    "UPDATE contributions SET submitted_at = created_at "
                    "WHERE submitted_at IS NULL"
                )
            )
        if "updated_at" in definitions:
            conn.execute(
                text(
                    "UPDATE contributions SET updated_at = created_at "
                    "WHERE updated_at IS NULL"
                )
            )


def _ensure_indexes() -> None:
    statements = [
        "CREATE INDEX IF NOT EXISTS ix_editorial_objects_created_at ON editorial_objects (created_at)",
        "CREATE INDEX IF NOT EXISTS ix_editorial_objects_type_created_at ON editorial_objects (type, created_at)",
        "CREATE INDEX IF NOT EXISTS ix_contributions_status_created_at ON contributions (status, created_at)",
        "CREATE INDEX IF NOT EXISTS ix_direct_messages_thread ON direct_messages (sender_id, recipient_id, created_at)",
        "CREATE INDEX IF NOT EXISTS ix_editorial_relations_source_target ON editorial_relations (source_id, target_id)",
    ]

    with engine.begin() as conn:
        for statement in statements:
            conn.execute(text(statement))


def init_db(session: Session) -> None:
    Base.metadata.create_all(bind=engine)
    _ensure_users_columns()
    _ensure_contributions_columns()
    _ensure_indexes()
    seed_database(session)
