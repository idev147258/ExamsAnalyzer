from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Literal


class Settings(BaseSettings):
    # ── LLM Provider ────────────────────────────────────────────────────────
    # Options: "anthropic" | "claude-cli" | "ollama"
    llm_provider: Literal["anthropic", "claude-cli", "ollama"] = "anthropic"

    # ── Anthropic API ────────────────────────────────────────────────────────
    anthropic_api_key: str = ""
    anthropic_model: str = "claude-sonnet-4-6"

    # ── Claude CLI ───────────────────────────────────────────────────────────
    claude_cli_path: str = "claude"          # path to claude binary
    claude_cli_timeout: int = 120            # seconds

    # ── Ollama ───────────────────────────────────────────────────────────────
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.2"
    ollama_timeout: int = 120

    # ── Database ─────────────────────────────────────────────────────────────
    database_url: str = "sqlite:///./exams_analyzer.db"

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
