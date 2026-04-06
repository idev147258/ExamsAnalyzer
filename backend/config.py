from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    anthropic_api_key: str = ""
    database_url: str = "sqlite:///./exams_analyzer.db"
    claude_model: str = "claude-sonnet-4-6"

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
