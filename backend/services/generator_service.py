"""Generator (Knowledge Engine) — Flashcards, Cloze, Concept Maps via Claude."""
from typing import Any
from services.claude_client import ask_claude_json


SYSTEM_FLASHCARD = """You are an elite exam strategist AI for competitive exams like UPSC, NEET, and JEE.
Your job: convert raw study material into high-quality Anki-style flashcards using active-recall principles.
Rules:
- Each flashcard has a focused FRONT (question/prompt) and a concise BACK (answer).
- Generate a CLOZE version: surround key facts with {{c1::fact}} syntax.
- Tag difficulty: easy / medium / hard.
- Add 2-5 relevant tags.
- Identify concept_links: other concepts this card relates to (as strings).
Return a JSON array of flashcard objects."""

SYSTEM_CLOZE = """You are an expert in spaced-repetition study techniques for competitive exams.
Convert the provided text into cloze-deletion sentences for Anki.
Rules:
- Each sentence should have 1-3 blanks marked as {{c1::answer}}, {{c2::answer}}, etc.
- Blanks should cover key facts, dates, names, amounts, or relationships.
- Include a plain-text 'hint' field with a one-word hint for each blank.
Return a JSON array of cloze objects."""

SYSTEM_CONCEPT_MAP = """You are a knowledge-graph architect for competitive exam preparation.
Build a relational concept map showing how concepts link to each other.
For each node include: name, description, category (law/scheme/case/person/event/body/other), year (if applicable),
related_nodes (array of concept names it links to), relation_types (object mapping related concept name to relationship type),
source_ministry (if applicable), source_body (if applicable), tags.
Relation types: "led_to", "amended_by", "overturned_by", "implements", "case_for", "established_by", "falls_under", "predecessor_of", "successor_of", "defined_by".
Return JSON: {"nodes": [...], "edges": [...], "summary": "..."}
Edges: [{source, target, relation_type, description}]"""


def generate_flashcards(text: str, topic: str, num_cards: int = 10) -> list[dict[str, Any]]:
    prompt = f"""Topic: {topic}
Number of flashcards to generate: {num_cards}

Study Material:
{text}

Return a JSON array with exactly {num_cards} flashcard objects, each having:
{{
  "front": "Question prompt",
  "back": "Concise answer",
  "cloze_text": "Sentence with {{{{c1::key_fact}}}} syntax",
  "difficulty": "easy|medium|hard",
  "tags": ["tag1", "tag2"],
  "concept_links": ["related concept 1", "related concept 2"]
}}"""
    return ask_claude_json(SYSTEM_FLASHCARD, prompt)


def generate_cloze_deletions(text: str, topic: str, num_sentences: int = 5) -> list[dict[str, Any]]:
    prompt = f"""Topic: {topic}
Number of cloze sentences: {num_sentences}

Text:
{text}

Return a JSON array with {num_sentences} objects, each having:
{{
  "original": "original sentence",
  "cloze": "sentence with {{{{c1::answer}}}} blanks",
  "blanks": [{{"position": 1, "answer": "...", "hint": "..."}}],
  "difficulty": "easy|medium|hard"
}}"""
    return ask_claude_json(SYSTEM_CLOZE, prompt)


def generate_concept_map(primary_concept: str, supporting_text: str = "", depth: int = 2) -> dict[str, Any]:
    context_block = ("Supporting context:\n" + supporting_text) if supporting_text else ""
    prompt = f"""Primary Concept: {primary_concept}
Map Depth: {depth} levels of relationships

{context_block}

Build a comprehensive concept map. Include at minimum 5 nodes and their relationships.
Ensure you capture legal/constitutional links, historical precedents, implementing bodies, and successor laws.

Return JSON: {{"nodes": [...], "edges": [...], "summary": "..."}}"""
    return ask_claude_json(SYSTEM_CONCEPT_MAP, prompt, max_tokens=8192)
