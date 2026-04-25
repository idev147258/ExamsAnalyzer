"""Centralized Claude API client with structured prompt helpers."""
import json
import re
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import anthropic
from config import get_settings

settings = get_settings()


def get_client() -> anthropic.Anthropic:
    return anthropic.Anthropic(api_key=settings.anthropic_api_key)


def ask_claude(system_prompt: str, user_prompt: str, max_tokens: int = 4096) -> str:
    client = get_client()
    message = client.messages.create(
        model=settings.claude_model,
        max_tokens=max_tokens,
        system=system_prompt,
        messages=[{"role": "user", "content": user_prompt}],
    )
    return message.content[0].text


def ask_claude_json(system_prompt: str, user_prompt: str, max_tokens: int = 4096) -> dict | list:
    """Ask Claude and parse the JSON response."""
    system = system_prompt + "\n\nALWAYS respond with valid JSON only. No markdown fences, no extra text."
    raw = ask_claude(system, user_prompt, max_tokens)
    # Strip markdown code fences if present
    raw = re.sub(r"^```(?:json)?\n?", "", raw.strip())
    raw = re.sub(r"\n?```$", "", raw.strip())
    return json.loads(raw)
