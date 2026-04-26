"""Elimination Strategist — Heuristic-based educated guessing engine."""
from typing import Any
from sqlalchemy.orm import Session
from models import EliminationHeuristic
from services.llm_client import ask_llm_json as ask_claude_json


SYSTEM_ELIMINATOR = """You are an elite exam strategist who teaches students how to eliminate wrong options
using first-principles reasoning — even without knowing the exact answer.

You apply these elimination heuristics:
1. EXTREME_LANGUAGE: Options with "always", "never", "only", "all", "none" are almost always wrong
2. BUDGET_INFEASIBILITY: Amounts that would be economically impossible at national scale (e.g., ₹10 lakh to every rural woman ≈ ₹80 lakh crore — impossible)
3. LOGICAL_IMPOSSIBILITY: Statements that contradict known facts or physical laws
4. SCOPE_OVERREACH: A scheme/body claiming powers beyond its constitutional mandate
5. TEMPORAL_IMPOSSIBILITY: Events described before they could have occurred
6. COMPARATIVE_ELIMINATION: If 3 options share a common element and one is the "odd one out" in structure
7. MINISTRY_BODY_CONFUSION: Attributing functions of one body to another (e.g., NHRC vs NCW vs NITI Aayog)
8. DOUBLE_NEGATION: Grammatically or logically self-contradicting statements

For budget checks, use these reference anchors:
- India's total central budget: ~₹45 lakh crore (2023-24)
- Rural population: ~800 million
- BPL households: ~250 million
- Any per-person scheme giving >₹1 lakh to 100M+ people is budget-infeasible

Return structured JSON analysis."""

SYSTEM_FEASIBILITY = """You are a budget and logic feasibility analyst for Indian government schemes and policies.
Check if a proposed scheme/policy option is economically and logically feasible.
Use knowledge of India's budget size, population scale, and constitutional constraints.
Return detailed feasibility analysis in JSON."""

DEFAULT_HEURISTICS = [
    {
        "pattern_type": "extreme_language",
        "pattern_name": "Absolute Language Trap",
        "description": "Options using absolute terms (always, never, only, exclusively, all, none) are almost always wrong in factual exams. Reality is rarely absolute.",
        "trigger_keywords": ["always", "never", "only", "exclusively", "all", "none", "every", "must", "cannot", "solely"],
        "example_question": "The Right to Information Act applies to:",
        "example_wrong_option": "All private organizations without exception",
        "confidence_score": 0.92
    },
    {
        "pattern_type": "budget_infeasible",
        "pattern_name": "Budget Impossibility Check",
        "description": "If a scheme promises very large amounts to a very large number of people, check against India's total budget (~₹45 lakh crore). If the math doesn't work, eliminate it.",
        "trigger_keywords": ["lakh", "crore", "every rural", "all BPL", "universal", "₹"],
        "example_question": "Under which scheme does every rural woman receive ₹10 lakh annually?",
        "example_wrong_option": "PM Mahila Shakti Yojana",
        "confidence_score": 0.95
    },
    {
        "pattern_type": "body_confusion",
        "pattern_name": "Ministry/Body Mandate Confusion",
        "description": "Exam setters frequently swap the mandates of NCW, NHRC, NITI Aayog, and various ministries. Know which body does what.",
        "trigger_keywords": ["NCW", "NHRC", "NITI Aayog", "Ministry", "Commission", "Authority"],
        "example_question": "Which body is mandated to investigate human rights violations by the armed forces?",
        "example_wrong_option": "National Commission for Women (NCW)",
        "confidence_score": 0.88
    },
    {
        "pattern_type": "logical_impossibility",
        "pattern_name": "Causal Impossibility",
        "description": "Options that describe an effect before its cause, or attribute an outcome to a logically impossible sequence of events.",
        "trigger_keywords": ["before", "prior to", "following", "as a result"],
        "example_question": "The Bhanwari Devi case led to:",
        "example_wrong_option": "The enactment of the POCSO Act (2012)",
        "confidence_score": 0.85
    }
]


def analyze_options_for_elimination(
    question_text: str,
    options: dict[str, str],
    topic: str = None,
) -> dict[str, Any]:
    options_str = "\n".join(f"{k}. {v}" for k, v in options.items())

    prompt = f"""Analyze this exam question using elimination heuristics:

Question: {question_text}
{"Topic: " + topic if topic else ""}

Options:
{options_str}

Apply all available heuristics systematically to each option.
Check budget feasibility for any monetary amounts.
Flag extreme language in each option.
Identify any body/ministry mandate confusions.

Return JSON:
{{
  "question_text": "...",
  "options": {{"A": "...", "B": "...", "C": "...", "D": "..."}},
  "eliminated_options": ["B", "D"],
  "elimination_reasons": {{"B": "Uses 'always' — absolute language trap. NHRC cannot investigate armed forces (body confusion).", "D": "₹5 lakh to all 800M rural citizens = ₹40 lakh crore — exceeds entire national budget."}},
  "recommended_answer": "A",
  "confidence": 0.78,
  "heuristics_applied": ["EXTREME_LANGUAGE", "BUDGET_INFEASIBILITY", "BODY_CONFUSION"],
  "explanation": "Step-by-step elimination walkthrough...",
  "feasibility_flags": {{"D": {{"flag": "BUDGET_INFEASIBLE", "math": "₹5L × 800M = ₹40 lakh crore > total budget"}}}}
}}"""
    return ask_claude_json(SYSTEM_ELIMINATOR, prompt)


def check_feasibility(option_text: str, context: str = None) -> dict[str, Any]:
    prompt = f"""Check the economic and logical feasibility of this statement/option:

Statement: "{option_text}"
{"Context: " + context if context else ""}

Analyze:
1. If it involves money/budget — is it financially feasible given India's budget scale?
2. If it involves a constitutional body — does it have the mandate described?
3. Is it logically/temporally consistent?
4. Are there any absolute claims that are almost certainly false?

Return JSON:
{{
  "option_text": "{option_text}",
  "is_feasible": true/false,
  "feasibility_score": 0.0-1.0,
  "flags": ["BUDGET_INFEASIBLE", "BODY_CONFUSION", ...],
  "explanation": "Detailed explanation with numbers/logic"
}}"""
    return ask_claude_json(SYSTEM_FEASIBILITY, prompt)


def get_default_heuristics() -> list[dict[str, Any]]:
    return DEFAULT_HEURISTICS
