from sqlalchemy import Column, Integer, String, Float, Text, JSON, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from database import Base


class Exam(Base):
    __tablename__ = "exams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    exam_type = Column(String)  # UPSC, NEET, JEE, etc.
    description = Column(Text, nullable=True)

    questions = relationship("Question", back_populates="exam")
    topic_weightages = relationship("TopicWeightage", back_populates="exam")
    study_resources = relationship("StudyResource", back_populates="exam")


class Question(Base):
    """Past Year Question (PYQ)"""
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("exams.id"))
    year = Column(Integer)
    question_text = Column(Text)
    options = Column(JSON)  # {"A": "...", "B": "...", "C": "...", "D": "..."}
    correct_answer = Column(String)  # "A", "B", "C", or "D"
    topic = Column(String, index=True)
    subtopic = Column(String, nullable=True)
    source = Column(String, nullable=True)  # e.g., "NCERT", "Economic Survey"
    marks = Column(Float, default=1.0)
    negative_marks = Column(Float, default=0.33)
    has_traps = Column(Boolean, default=False)
    trap_keywords = Column(JSON, nullable=True)  # ["always", "never", etc.]
    distractor_flags = Column(JSON, nullable=True)  # options that were distractors before

    exam = relationship("Exam", back_populates="questions")
    distractor_records = relationship("DistractorRecord", back_populates="question")


class DistractorRecord(Base):
    """Tracks options that appeared as wrong answers (distractors) in past years"""
    __tablename__ = "distractor_records"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("questions.id"))
    option_text = Column(Text)
    appeared_as_distractor_years = Column(JSON)  # [2019, 2021, ...]
    became_correct_year = Column(Integer, nullable=True)
    recycling_risk = Column(String, default="low")  # low, medium, high

    question = relationship("Question", back_populates="distractor_records")


class Flashcard(Base):
    __tablename__ = "flashcards"

    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, nullable=True)
    topic = Column(String, index=True)
    front = Column(Text)
    back = Column(Text)
    cloze_text = Column(Text, nullable=True)  # "The {{c1::Vishaka Guidelines}} were issued in {{c2::1997}}"
    concept_links = Column(JSON, nullable=True)  # Related concept IDs
    tags = Column(JSON, nullable=True)
    difficulty = Column(String, default="medium")  # easy, medium, hard
    review_count = Column(Integer, default=0)


class ConceptNode(Base):
    """Knowledge graph node for interlinking facts"""
    __tablename__ = "concept_nodes"

    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, nullable=True)
    name = Column(String, index=True)
    description = Column(Text)
    category = Column(String)  # law, scheme, case, person, event, etc.
    year = Column(Integer, nullable=True)
    related_node_ids = Column(JSON, default=list)  # IDs of related ConceptNodes
    relation_types = Column(JSON, default=dict)  # {node_id: "led_to" | "amended_by" | "case_for" | ...}
    tags = Column(JSON, default=list)
    source_ministry = Column(String, nullable=True)
    source_body = Column(String, nullable=True)  # NCW, NHRC, etc.


class TopicWeightage(Base):
    """Tracks how many questions come from each topic per year"""
    __tablename__ = "topic_weightages"

    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("exams.id"))
    topic = Column(String, index=True)
    year = Column(Integer)
    question_count = Column(Integer, default=0)
    total_marks = Column(Float, default=0.0)
    source_types = Column(JSON, default=list)  # ["NCERT", "Economic Survey", ...]

    exam = relationship("Exam", back_populates="topic_weightages")


class StudyResource(Base):
    """Resources for ROTI (Return on Time Invested) calculation"""
    __tablename__ = "study_resources"

    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("exams.id"))
    name = Column(String)
    resource_type = Column(String)  # book, report, website, notes
    source_category = Column(String)  # textbook, government_report, ngo_report, news
    pages = Column(Integer, nullable=True)
    estimated_hours = Column(Float, nullable=True)
    marks_yielded = Column(Float, default=0.0)
    years_tracked = Column(JSON, default=list)
    roti_score = Column(Float, nullable=True)  # Computed: marks_yielded / (pages * hours)
    trending = Column(Boolean, default=False)
    pivot_recommendation = Column(Text, nullable=True)

    exam = relationship("Exam", back_populates="study_resources")


class EliminationHeuristic(Base):
    """Patterns that help eliminate wrong options"""
    __tablename__ = "elimination_heuristics"

    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, nullable=True)
    pattern_type = Column(String)  # extreme_language, budget_infeasible, body_confusion, logical_impossibility
    pattern_name = Column(String)
    description = Column(Text)
    trigger_keywords = Column(JSON, default=list)
    example_question = Column(Text, nullable=True)
    example_wrong_option = Column(Text, nullable=True)
    confidence_score = Column(Float, default=0.8)
    usage_count = Column(Integer, default=0)
