from pydantic import BaseSettings
from typing import Optional
from functools import lru_cache

class Settings(BaseSettings):
    # Discord Configuration
    DISCORD_BOT_TOKEN: str
    DISCORD_CLIENT_ID: str
    DISCORD_CLIENT_SECRET: str

    # Database Configuration
    DATABASE_URL: str

    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_MINUTES: int = 1

    # MCP Inspector
    MCP_INSPECTOR_ENABLED: bool = True
    MCP_INSPECTOR_HOST: str = "localhost"
    MCP_INSPECTOR_PORT: int = 8000

    # Logging
    LOG_LEVEL: str = "INFO"

    class Config:
        env_file = ".env"

@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()

# MCP Inspector Configuration
class MCPInspectorConfig:
    def __init__(self, settings: Settings):
        self.enabled = settings.MCP_INSPECTOR_ENABLED
        self.host = settings.MCP_INSPECTOR_HOST
        self.port = settings.MCP_INSPECTOR_PORT

    @property
    def url(self) -> str:
        return f"http://{self.host}:{self.port}"

# Rate Limiting Configuration
class RateLimitConfig:
    def __init__(self, settings: Settings):
        self.requests = settings.RATE_LIMIT_REQUESTS
        self.minutes = settings.RATE_LIMIT_MINUTES

    @property
    def requests_per_minute(self) -> float:
        return self.requests / self.minutes