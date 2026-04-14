from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    app_name: str = "LE_LA API"
    api_v1_prefix: str = "/api"
    secret_key: str = "change-me"
    access_token_expire_minutes: int = 1440
    database_url: str = "postgresql+psycopg://lela:lela@localhost:5432/lela"
    backend_public_url: str = "http://localhost:8000"
    storage_endpoint: str = "http://localhost:9000"
    storage_bucket: str = "lela-media"
    storage_access_key: str = "minioadmin"
    storage_secret_key: str = "minioadmin"
    storage_region: str = "eu-west-1"
    frontend_origin: str = "http://localhost:3000"
    llm_provider: str = "ollama"
    mistral_api_key: str = ""
    mistral_model: str = "mistral-small-latest"
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "mistral"
    llm_timeout_seconds: float = 45.0

    @property
    def frontend_origins(self) -> list[str]:
        origins = {
            self.frontend_origin,
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        }
        return sorted(origins)

    @property
    def frontend_origin_regex(self) -> str:
        return (
            r"^https?://("
            r"localhost|127\.0\.0\.1|"
            r"192\.168\.\d{1,3}\.\d{1,3}|"
            r"10\.\d{1,3}\.\d{1,3}\.\d{1,3}|"
            r"172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}"
            r"):\d+$"
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()
