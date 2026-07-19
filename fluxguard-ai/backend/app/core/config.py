from functools import lru_cache

from pydantic import AliasChoices, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

DEFAULT_FRONTEND_URLS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]


class Settings(BaseSettings):
    app_name: str = Field(default="FluxGuard AI API", alias="APP_NAME")
    environment: str = Field(default="development", alias="ENVIRONMENT")
    api_v1_prefix: str = Field(default="/api/v1", alias="API_V1_PREFIX")
    frontend_urls: list[str] = Field(
        default=DEFAULT_FRONTEND_URLS,
        validation_alias=AliasChoices("FRONTEND_URLS", "CORS_ALLOWED_ORIGINS"),
    )
    cors_allowed_origins: list[str] = Field(
        default=DEFAULT_FRONTEND_URLS,
        alias="CORS_ALLOWED_ORIGINS",
    )
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")
    database_url: str | None = Field(default=None, alias="DATABASE_URL")
    jwt_secret: str | None = Field(default=None, alias="JWT_SECRET")
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")
    jwt_audience: str | None = Field(default=None, alias="JWT_AUDIENCE")
    gemini_api_key: str | None = Field(
        default=None,
        validation_alias=AliasChoices("GOOGLE_GEMINI_API_KEY", "GEMINI_API_KEY"),
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        populate_by_name=True,
    )

    @property
    def allowed_origins(self) -> list[str]:
        """Frontend origins allowed to call the API with browser credentials."""
        return self.frontend_urls

    @field_validator("frontend_urls", "cors_allowed_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()
