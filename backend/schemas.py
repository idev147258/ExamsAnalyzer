from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


# ── Exam ────────────────────────────────────────────────────────────────────
class ExamCreate(BaseModel):
    name: str
    exam_type: str
    description: Optional[str] = None


class ExamOut(ExamCreate):
    id: int
    class Config:
        from_attributes = True


# ── Question / PYQ ──────────────────────────────────────────────────────────
class QuestionCreate(BaseModel):
    exam_id: int
    year: int
    question_text: str
    options: Dict[str, str]
    correct_answer: str
    topic: str
    subtopic: Optional[str] = None
    source: Optional[str] = None
    marks: float = 1.0
    negative_marks: float = 0.33


class QuestionOut(QuestionCreate):
    id: int
    has_traps: bool
    trap_keywords: Optional[List[str]]
    distractor_flags: Optional[Dict]
    class Config:
        from_attributes = True


# ── Generator ───────────────────────────────────────────────────────────────
class FlashcardRequest(BaseModel):
    text: str = Field(..., description="Study material text to convert into flashcards")
    topic: str
    exam_id: Optional[int] = None
    num_cards: int = Field(10, ge=1, le=50)


class ClozeRequest(BaseModel):
    text: str = Field(..., description="Text to generate cloze deletions from")
    topic: str
    exam_id: Optional[int] = None
    num_sentences: int = Field(5, ge=1, le=30)


class ConceptMapRequest(BaseModel):
    primary_concept: str
    supporting_text: Optional[str] = None
    exam_id: Optional[int] = None
    depth: int = Field(2, ge=1, le=4)


class FlashcardOut(BaseModel):
    id: int
    topic: str
    front: str
    back: str
    cloze_text: Optional[str]
    concept_links: Optional[List[str]]
    tags: Optional[List[str]]
    difficulty: str
    class Config:
        from_attributes = True


class ConceptNodeOut(BaseModel):
    id: int
    name: str
    description: str
    category: str
    year: Optional[int]
    related_node_ids: List[int]
    relation_types: Dict[str, str]
    tags: List[str]
    source_ministry: Optional[str]
    source_body: Optional[str]
    class Config:
        from_attributes = True


class ConceptMapOut(BaseModel):
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]
    summary: str


# ── Analyser ────────────────────────────────────────────────────────────────
class DistractorCheckRequest(BaseModel):
    option_text: str
    exam_id: int
    topic: Optional[str] = None


class DistractorCheckOut(BaseModel):
    option_text: str
    appeared_as_distractor: bool
    distractor_years: List[int]
    recycling_risk: str  # low, medium, high
    explanation: str
    similar_questions: List[Dict[str, Any]]


class TrendForecastOut(BaseModel):
    topic: str
    year_data: List[Dict[str, Any]]  # [{year, count, marks}]
    momentum: float  # % change over last 3 years
    direction: str   # "rising", "falling", "stable"
    forecast: str    # Human-readable prediction
    priority: str    # "high", "medium", "low"


class TrapScanRequest(BaseModel):
    question_text: str
    options: Dict[str, str]
    exam_id: Optional[int] = None


class TrapScanOut(BaseModel):
    has_traps: bool
    trap_types: List[str]
    flagged_keywords: List[str]
    explanation: str
    safe_options: List[str]  # Options least likely to be traps
    confidence: float


class TopicMomentumOut(BaseModel):
    exam_id: int
    topic_forecasts: List[TrendForecastOut]
    top_priority_topics: List[str]
    declining_topics: List[str]
    source_shift_alert: Optional[str]


# ── Validator ────────────────────────────────────────────────────────────────
class StudyResourceCreate(BaseModel):
    exam_id: int
    name: str
    resource_type: str
    source_category: str
    pages: Optional[int] = None
    estimated_hours: Optional[float] = None
    marks_yielded: float = 0.0
    years_tracked: List[int] = []


class ROTIRequest(BaseModel):
    resource_id: Optional[int] = None
    name: str
    pages: int
    estimated_hours: float
    marks_yielded: float
    exam_id: Optional[int] = None


class ROTIOut(BaseModel):
    name: str
    pages: int
    estimated_hours: float
    marks_yielded: float
    roti_score: float
    roti_grade: str  # A+, A, B, C, D
    comparison: str
    recommendation: str


class SourceEvolutionOut(BaseModel):
    exam_id: int
    years: List[int]
    source_distribution: Dict[str, List[int]]  # {source: [count_per_year]}
    dominant_source_now: str
    dominant_source_before: str
    shift_detected: bool
    shift_description: str
    pivot_recommendations: List[str]


# ── Elimination Strategist ───────────────────────────────────────────────────
class EliminationRequest(BaseModel):
    question_text: str
    options: Dict[str, str]
    exam_id: Optional[int] = None
    topic: Optional[str] = None


class EliminationAnalysisOut(BaseModel):
    question_text: str
    options: Dict[str, str]
    eliminated_options: List[str]  # Option keys to eliminate (A, B, C, D)
    elimination_reasons: Dict[str, str]  # {option_key: reason}
    recommended_answer: Optional[str]  # Best guess after elimination
    confidence: float
    heuristics_applied: List[str]
    explanation: str
    feasibility_flags: Dict[str, Any]


class FeasibilityCheckRequest(BaseModel):
    option_text: str
    context: Optional[str] = None  # exam context or topic


class FeasibilityCheckOut(BaseModel):
    option_text: str
    is_feasible: bool
    feasibility_score: float  # 0-1
    flags: List[str]  # ["budget_infeasible", "logically_impossible", etc.]
    explanation: str


class HeuristicOut(BaseModel):
    id: int
    pattern_type: str
    pattern_name: str
    description: str
    trigger_keywords: List[str]
    example_question: Optional[str]
    example_wrong_option: Optional[str]
    confidence_score: float
    class Config:
        from_attributes = True


# ── Shared ───────────────────────────────────────────────────────────────────
class BulkQuestionsImport(BaseModel):
    exam_id: int
    questions: List[QuestionCreate]


class MessageOut(BaseModel):
    message: str
    data: Optional[Any] = None
