from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import Optional
from functools import lru_cache


class Settings(BaseSettings):
    APP_NAME: str = "WTFApp"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    SECRET_KEY: str = "change-me-in-production"

    DATABASE_URL: str = "postgresql+asyncpg://wtfapp:wtfapp@localhost:5432/wtfapp"

    REDIS_URL: str = "redis://localhost:6379/0"

    JWT_PRIVATE_KEY_PATH: str = "./keys/private.pem"
    JWT_PUBLIC_KEY_PATH: str = "./keys/public.pem"
    JWT_ACCESS_TOKEN_TTL_MINUTES: int = 15
    JWT_REFRESH_TOKEN_TTL_DAYS: int = 30

    CORS_ORIGINS: str = "*"

    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "noreply@wtfapp.com"

    MEDIA_ROOT: str = "./media"
    MEDIA_URL: str = "/media/"

    RATE_LIMIT_ANONYMOUS: str = "100/minute"
    RATE_LIMIT_AUTHENTICATED: str = "300/minute"

    @property
    def cors_origins_list(self) -> list[str]:
        if self.CORS_ORIGINS == "*":
            return ["*"]
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

    @property
    def jwt_private_key(self) -> str:
        with open(self.JWT_PRIVATE_KEY_PATH, "r") as f:
            return f.read()

    @property
    def jwt_public_key(self) -> str:
        with open(self.JWT_PUBLIC_KEY_PATH, "r") as f:
            return f.read()

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
