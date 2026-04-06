"""Analyser (Strategy Engine) — Distractor Tracker, Trend Forecasting, Trap Identification."""
from typing import Any
from sqlalchemy.orm import Session
from models import Question, TopicWeightage, DistractorRecord
from services.claude_client import ask_claude_json


SYSTEM_TRAP = """You are an expert analyst of competitive exam question patterns, specializing in UPSC, NEET, and JEE.
Identify "examiner traps" in questions — subtle tricks used to catch unprepared students.

Trap types to detect:
1. EXTREME_LANGUAGE: Words like "always", "never", "only", "exclusively", "all", "none", "every", "must"
2. BODY_CONFUSION: Confusing mandates of different bodies (NCW vs NHRC vs NITI Aayog vs ministry names)
3. DATE_CONFUSION: Wrong year/date associations
4. REVERSED_CAUSALITY: Effect described as cause or vice versa
5. PARTIAL_TRUTH: Statement correct about one aspect but wrong about another
6. SCOPE_EXAGGERATION: Overstating the scope or reach of a law/scheme

Return structured JSON with all detected traps."""

SYSTEM_DISTRACTOR = """You are a pattern recognition expert for competitive exam question databases.
Analyze if an answer option appears to be a recycled distractor — a wrong answer from a past question
that exam setters are likely to use as the correct answer in a future question.

Analyze semantic similarity, factual adjacency, and examiner behavioral patterns.
Return JSON analysis."""

SYSTEM_TREND = """You are a data-driven exam strategy analyst.
Based on topic weightage data across years, generate micro-trend forecasts.
Calculate momentum (% change), direction, and priority for student focus.
Return structured JSON forecasts."""


def scan_for_traps(question_text: str, options: dict[str, str]) -> dict[str, Any]:
    prompt = f"""Analyze this exam question for examiner traps:

Question: {question_text}

Options:
{chr(10).join(f"{k}. {v}" for k, v in options.items())}

Return JSON:
{{
  "has_traps": true/false,
  "trap_types": ["EXTREME_LANGUAGE", ...],
  "flagged_keywords": ["always", "only", ...],
  "explanation": "detailed explanation of traps found",
  "safe_options": ["A", "C"],
  "option_analysis": {{"A": "safe/risky + why", "B": "...", "C": "...", "D": "..."}},
  "confidence": 0.85
}}"""
    return ask_claude_json(SYSTEM_TRAP, prompt)


def check_distractor_recycling(option_text: str, db: Session, exam_id: int, topic: str = None) -> dict[str, Any]:
    # Get historical questions from DB
    query = db.query(Question).filter(Question.exam_id == exam_id)
    if topic:
        query = query.filter(Question.topic == topic)
    historical_questions = query.limit(50).all()

    history_context = "\n".join([
        f"Year {q.year}: Q={q.question_text[:100]}... | Wrong options: {[v for k,v in q.options.items() if k != q.correct_answer]}"
        for q in historical_questions[:20]
    ])

    prompt = f"""Analyze if this option text has appeared as a distractor (wrong answer) in past questions:

Option to analyze: "{option_text}"

Historical questions from this exam:
{history_context if history_context else "No historical data available yet."}

Return JSON:
{{
  "option_text": "{option_text}",
  "appeared_as_distractor": true/false,
  "distractor_years": [2019, 2021],
  "recycling_risk": "low|medium|high",
  "explanation": "Why this option is/isn't a recycling risk",
  "similar_questions": [{{"year": 2019, "question_snippet": "...", "role": "distractor|correct_answer"}}]
}}"""
    return ask_claude_json(SYSTEM_DISTRACTOR, prompt)


def get_topic_momentum(exam_id: int, db: Session) -> dict[str, Any]:
    # Aggregate topic weightage from DB
    weightages = db.query(TopicWeightage).filter(
        TopicWeightage.exam_id == exam_id
    ).order_by(TopicWeightage.year).all()

    if not weightages:
        # Return mock data if no DB data
        return _generate_mock_momentum()

    # Build topic → year → count mapping
    topic_year_data: dict[str, dict[int, int]] = {}
    for w in weightages:
        if w.topic not in topic_year_data:
            topic_year_data[w.topic] = {}
        topic_year_data[w.topic][w.year] = w.question_count

    topic_summary = "\n".join([
        f"Topic: {topic} | Year data: {year_data}"
        for topic, year_data in topic_year_data.items()
    ])

    prompt = f"""Analyze the following topic weightage data for exam_id={exam_id}:

{topic_summary}

For each topic, calculate:
- momentum: percentage change over last 3 available years
- direction: "rising", "falling", or "stable"
- priority: "high", "medium", or "low" for student focus
- forecast: human-readable 1-sentence prediction

Also identify:
- top_priority_topics: top 3 topics to prioritize
- declining_topics: topics losing weightage
- source_shift_alert: if pattern suggests source shift (e.g., textbooks → Economic Survey)

Return JSON:
{{
  "topic_forecasts": [
    {{
      "topic": "...",
      "year_data": [{{"year": 2020, "count": 3, "marks": 3.0}}, ...],
      "momentum": 25.5,
      "direction": "rising",
      "forecast": "...",
      "priority": "high"
    }}
  ],
  "top_priority_topics": ["topic1", "topic2", "topic3"],
  "declining_topics": ["topic4"],
  "source_shift_alert": "Questions shifting from NCERT to Economic Survey. Pivot recommended."
}}"""
    return ask_claude_json(SYSTEM_TREND, prompt, max_tokens=8192)


def _generate_mock_momentum() -> dict[str, Any]:
    """Return illustrative data when no PYQs are loaded yet."""
    return {
        "topic_forecasts": [
            {
                "topic": "Women's Rights & Legislation",
                "year_data": [{"year": 2021, "count": 2}, {"year": 2022, "count": 3}, {"year": 2023, "count": 5}],
                "momentum": 25.0,
                "direction": "rising",
                "forecast": "Strong upward trend — likely 6-7 questions in upcoming exam.",
                "priority": "high"
            },
            {
                "topic": "Financial Inclusion Schemes",
                "year_data": [{"year": 2021, "count": 4}, {"year": 2022, "count": 3}, {"year": 2023, "count": 5}],
                "momentum": 15.0,
                "direction": "rising",
                "forecast": "Consistently rising; Digital India and Jan Dhan sub-topics are hot.",
                "priority": "high"
            },
            {
                "topic": "Pre-Independence Movements",
                "year_data": [{"year": 2021, "count": 5}, {"year": 2022, "count": 4}, {"year": 2023, "count": 3}],
                "momentum": -10.0,
                "direction": "falling",
                "forecast": "Declining — focus only on high-probability specifics.",
                "priority": "low"
            }
        ],
        "top_priority_topics": ["Women's Rights & Legislation", "Financial Inclusion Schemes", "Environment & Climate"],
        "declining_topics": ["Pre-Independence Movements", "Ancient History"],
        "source_shift_alert": "No PYQ data loaded yet. Import questions to get live trend analysis."
    }
