from app.core.config import Settings


def test_settings_load_defaults() -> None:
    settings = Settings()

    assert settings.app_name == "FluxGuard AI API"
    assert settings.environment == "development"
    assert "http://localhost:5173" in settings.frontend_urls
    assert "http://127.0.0.1:5173" in settings.allowed_origins


def test_frontend_urls_parse_from_comma_separated_string() -> None:
    settings = Settings(FRONTEND_URLS="http://localhost:3000,https://example.com")

    assert settings.allowed_origins == [
        "http://localhost:3000",
        "https://example.com",
    ]


def test_legacy_cors_origins_still_supported() -> None:
    settings = Settings(CORS_ALLOWED_ORIGINS="http://localhost:5174")

    assert settings.allowed_origins == ["http://localhost:5174"]
