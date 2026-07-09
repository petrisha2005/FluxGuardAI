from app.core.config import Settings


def test_settings_load_defaults() -> None:
    settings = Settings()

    assert settings.app_name == "FluxGuard AI API"
    assert settings.environment == "development"
    assert "http://localhost:5173" in settings.cors_allowed_origins


def test_cors_origins_parse_from_comma_separated_string() -> None:
    settings = Settings(CORS_ALLOWED_ORIGINS="http://localhost:3000,https://example.com")

    assert settings.cors_allowed_origins == [
        "http://localhost:3000",
        "https://example.com",
    ]
