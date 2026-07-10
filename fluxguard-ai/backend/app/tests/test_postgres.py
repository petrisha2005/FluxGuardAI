from unittest.mock import patch

from app.core import database
from app.core.config import Settings


def test_database_url_not_configured() -> None:
    # Verify that by default, without DATABASE_URL, get_db_pool returns None
    with patch("app.core.database.get_settings") as mock_settings:
        mock_settings.return_value = Settings(DATABASE_URL=None)

        # Reset init attempted flag
        database._init_attempted = False
        database._pool = None

        pool = database.get_db_pool()
        assert pool is None


def test_database_connection_failure_fallback() -> None:
    # Verify that when DATABASE_URL is configured but connection fails, it falls back to None pool
    with patch("app.core.database.get_settings") as mock_settings:
        mock_settings.return_value = Settings(
            DATABASE_URL="postgresql://invalid_user:invalid_password@localhost:54321/invalid_db"
        )

        database._init_attempted = False
        database._pool = None

        pool = database.get_db_pool()
        assert pool is None

        # Verify queries still succeed by falling back to in-memory store
        events = database.get_all_events()
        assert len(events) == 1
        assert events[0]["name"] == "FIFA World Cup 2026 - Opening Match"
