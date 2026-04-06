"""Validator (ROI Engine) — ROTI scoring, source evolution tracking."""
from typing import Any
from sqlalchemy.orm import Session
from models import StudyResource, TopicWeightage
from services.claude_client import ask_claude_json


SYSTEM_ROTI = """You are an elite exam strategy consultant specializing in Return on Time Invested (ROTI) analysis.
You help students allocate study time with mathematical precision.
ROTI formula: marks_yielded / (pages_per_100 * hours). Higher = better return.
Grade scale: A+ (>2.0), A (1.0-2.0), B (0.5-1.0), C (0.2-0.5), D (<0.2)
Return structured JSON with ROTI analysis and actionable advice."""

SYSTEM_SOURCE = """You are a source evolution analyst for competitive exams.
Examine how the origin of exam questions has shifted over the years.
Identify pivots from standard textbooks to dynamic sources (Economic Survey, PIB, Ministry reports, NGO data).
Return strategic pivot recommendations in JSON."""


def calculate_roti(name: str, pages: int, estimated_hours: float, marks_yielded: float) -> dict[str, Any]:
    pages_unit = pages / 100  # normalize per 100 pages
    roti_score = marks_yielded / (pages_unit * estimated_hours) if (pages_unit * estimated_hours) > 0 else 0

    if roti_score >= 2.0:
        grade = "A+"
    elif roti_score >= 1.0:
        grade = "A"
    elif roti_score >= 0.5:
        grade = "B"
    elif roti_score >= 0.2:
        grade = "C"
    else:
        grade = "D"

    prompt = f"""Analyze the ROTI (Return on Time Invested) for this study resource:

Resource: {name}
Pages: {pages}
Estimated study hours: {estimated_hours}
Marks yielded in past exams: {marks_yielded}
Calculated ROTI score: {roti_score:.3f}
Grade: {grade}

Provide:
1. A comparison with typical competitive exam resources
2. Specific recommendation: should student prioritize, skim, or deprioritize?
3. If low ROTI, suggest what to replace it with

Return JSON:
{{
  "name": "{name}",
  "pages": {pages},
  "estimated_hours": {estimated_hours},
  "marks_yielded": {marks_yielded},
  "roti_score": {roti_score:.3f},
  "roti_grade": "{grade}",
  "comparison": "...",
  "recommendation": "..."
}}"""
    return ask_claude_json(SYSTEM_ROTI, prompt)


def get_source_evolution(exam_id: int, db: Session) -> dict[str, Any]:
    # Get source distribution from questions
    from models import Question
    questions = db.query(Question).filter(Question.exam_id == exam_id).all()

    if not questions:
        return _mock_source_evolution(exam_id)

    # Aggregate source types by year
    year_source_data: dict[int, dict[str, int]] = {}
    for q in questions:
        year = q.year
        source = q.source or "Unknown"
        if year not in year_source_data:
            year_source_data[year] = {}
        year_source_data[year][source] = year_source_data[year].get(source, 0) + 1

    years = sorted(year_source_data.keys())
    all_sources = set()
    for year_data in year_source_data.values():
        all_sources.update(year_data.keys())

    source_distribution = {
        source: [year_source_data.get(y, {}).get(source, 0) for y in years]
        for source in all_sources
    }

    prompt = f"""Analyze source evolution for exam_id={exam_id}:

Years analyzed: {years}
Source distribution (source → [count per year]):
{source_distribution}

Identify:
- Which sources are gaining traction (modern, dynamic sources like Economic Survey, PIB, Ministry reports)
- Which are declining (old textbooks)
- Dominant source now vs before
- Whether a strategic pivot is needed

Return JSON:
{{
  "exam_id": {exam_id},
  "years": {years},
  "source_distribution": {{}},
  "dominant_source_now": "...",
  "dominant_source_before": "...",
  "shift_detected": true/false,
  "shift_description": "...",
  "pivot_recommendations": ["Read Economic Survey chapters 3 & 7", "Subscribe to PIB daily digest", ...]
}}"""
    return ask_claude_json(SYSTEM_SOURCE, prompt)


def _mock_source_evolution(exam_id: int) -> dict[str, Any]:
    return {
        "exam_id": exam_id,
        "years": [2019, 2020, 2021, 2022, 2023],
        "source_distribution": {
            "NCERT": [8, 7, 6, 5, 4],
            "Economic Survey": [1, 2, 3, 4, 6],
            "PIB / Govt Press Releases": [0, 1, 2, 3, 4],
            "Standard Reference Books": [5, 4, 4, 3, 2]
        },
        "dominant_source_now": "Economic Survey",
        "dominant_source_before": "NCERT Textbooks",
        "shift_detected": True,
        "shift_description": (
            "Clear pivot from static NCERT sources toward dynamic government publications. "
            "Economic Survey questions have increased 500% from 2019 to 2023."
        ),
        "pivot_recommendations": [
            "Read Economic Survey Vol. 1 (Chapters on Social Sector) thoroughly",
            "Subscribe to PIB daily digest — focus on schemes and flagship programs",
            "Follow Ministry of Finance and MoWCD press releases weekly",
            "Reduce time on static NCERT Ancient History; redirect to current affairs"
        ]
    }
