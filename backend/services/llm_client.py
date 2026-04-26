"""
Multi-provider LLM client.

Supports:
  - anthropic   : Anthropic API via official SDK (default)
  - claude-cli  : Local `claude` CLI subprocess (no API key needed)
  - ollama      : Local Ollama server (llama3, mistral, phi3, etc.)

Set LLM_PROVIDER in .env to switch providers.
"""
import json
import re
import subprocess
import httpx
from typing import Any

from config import get_settings

settings = get_settings()


# ── Shared JSON cleanup ──────────────────────────────────────────────────────

def _parse_json(raw: str) -> dict | list:
    raw = raw.strip()
    raw = re.sub(r"^```(?:json)?\n?", "", raw)
    raw = re.sub(r"\n?```$", "", raw)
    return json.loads(raw)


# ── Provider: Anthropic API ──────────────────────────────────────────────────

def _ask_anthropic(system_prompt: str, user_prompt: str, max_tokens: int) -> str:
    import anthropic
    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    msg = client.messages.create(
        model=settings.anthropic_model,
        max_tokens=max_tokens,
        system=system_prompt,
        messages=[{"role": "user", "content": user_prompt}],
    )
    return msg.content[0].text


# ── Provider: Claude CLI ─────────────────────────────────────────────────────

def _ask_claude_cli(system_prompt: str, user_prompt: str, max_tokens: int) -> str:
    """
    Calls the local `claude` CLI in non-interactive print mode.
    System prompt is prepended as a XML-tagged block so Claude respects it.
    """
    full_prompt = f"<system>\n{system_prompt}\n</system>\n\n{user_prompt}"
    result = subprocess.run(
        [settings.claude_cli_path, "--print", "--output-format", "text", full_prompt],
        capture_output=True,
        text=True,
        timeout=settings.claude_cli_timeout,
    )
    if result.returncode != 0:
        raise RuntimeError(f"claude CLI error: {result.stderr.strip()}")
    return result.stdout.strip()


# ── Provider: Ollama ─────────────────────────────────────────────────────────

def _ask_ollama(system_prompt: str, user_prompt: str, max_tokens: int) -> str:
    """
    Calls Ollama via its OpenAI-compatible /v1/chat/completions endpoint.
    Works with any model pulled into Ollama (llama3.2, mistral, phi3, gemma2, etc.)
    """
    url = f"{settings.ollama_base_url.rstrip('/')}/v1/chat/completions"
    payload = {
        "model": settings.ollama_model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "stream": False,
        "options": {"num_predict": max_tokens},
    }
    with httpx.Client(timeout=settings.ollama_timeout) as client:
        resp = client.post(url, json=payload)
        resp.raise_for_status()
    return resp.json()["choices"][0]["message"]["content"]


# ── Unified interface ─────────────────────────────────────────────────────────

def ask_llm(system_prompt: str, user_prompt: str, max_tokens: int = 4096) -> str:
    """Ask the configured LLM provider and return raw text."""
    provider = settings.llm_provider
    if provider == "anthropic":
        return _ask_anthropic(system_prompt, user_prompt, max_tokens)
    elif provider == "claude-cli":
        return _ask_claude_cli(system_prompt, user_prompt, max_tokens)
    elif provider == "ollama":
        return _ask_ollama(system_prompt, user_prompt, max_tokens)
    else:
        raise ValueError(f"Unknown LLM provider: {provider}")


def ask_llm_json(system_prompt: str, user_prompt: str, max_tokens: int = 4096) -> dict | list:
    """Ask the configured LLM provider and parse the JSON response."""
    system = system_prompt + "\n\nALWAYS respond with valid JSON only. No markdown fences, no extra text."
    raw = ask_llm(system, user_prompt, max_tokens)
    return _parse_json(raw)


def get_provider_info() -> dict[str, Any]:
    """Returns current provider name and model for display in the UI."""
    provider = settings.llm_provider
    if provider == "anthropic":
        return {"provider": "anthropic", "model": settings.anthropic_model, "label": "Anthropic API"}
    elif provider == "claude-cli":
        return {"provider": "claude-cli", "model": "claude (local CLI)", "label": "Claude CLI"}
    elif provider == "ollama":
        return {"provider": "ollama", "model": settings.ollama_model, "label": f"Ollama ({settings.ollama_model})"}
    return {"provider": provider, "model": "unknown", "label": provider}
