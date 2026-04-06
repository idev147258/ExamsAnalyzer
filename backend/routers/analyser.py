from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Question, Exam, TopicWeightage
from schemas import (
    DistractorCheckRequest, DistractorCheckOut,
    TrapScanRequest, TrapScanOut, TopicMomentumOut,
    QuestionCreate, BulkQuestionsImport, MessageOut
)
from services import analyser_service

router = APIRouter(prefix="/analyser", tags=["Analyser"])


@router.post("/trap-scan", summary="Scan a question for examiner traps and extreme language")
async def trap_scan(req: TrapScanRequest, db: Session = Depends(get_db)):
    try:
        result = analyser_service.scan_for_traps(req.question_text, req.options)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Claude API error: {str(e)}")
    return result


@router.post("/distractor-check", summary="Check if an option was a recycled distractor in past years")
async def distractor_check(req: DistractorCheckRequest, db: Session = Depends(get_db)):
    try:
        result = analyser_service.check_distractor_recycling(
            req.option_text, db, req.exam_id, req.topic
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Claude API error: {str(e)}")
    return result


@router.get("/topic-momentum/{exam_id}", summary="Get micro-trend forecast for all topics in an exam")
async def topic_momentum(exam_id: int, db: Session = Depends(get_db)):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    try:
        result = analyser_service.get_topic_momentum(exam_id, db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis error: {str(e)}")
    return {"exam_id": exam_id, **result}


@router.post("/questions/import", summary="Import PYQs for an exam in bulk")
async def import_questions(payload: BulkQuestionsImport, db: Session = Depends(get_db)):
    exam = db.query(Exam).filter(Exam.id == payload.exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    saved_count = 0
    for q_data in payload.questions:
        db_q = Question(
            exam_id=payload.exam_id,
            year=q_data.year,
            question_text=q_data.question_text,
            options=q_data.options,
            correct_answer=q_data.correct_answer,
            topic=q_data.topic,
            subtopic=q_data.subtopic,
            source=q_data.source,
            marks=q_data.marks,
            negative_marks=q_data.negative_marks,
        )
        db.add(db_q)

        # Update TopicWeightage aggregate
        tw = db.query(TopicWeightage).filter(
            TopicWeightage.exam_id == payload.exam_id,
            TopicWeightage.topic == q_data.topic,
            TopicWeightage.year == q_data.year,
        ).first()
        if tw:
            tw.question_count += 1
            tw.total_marks += q_data.marks
            if q_data.source and q_data.source not in (tw.source_types or []):
                tw.source_types = (tw.source_types or []) + [q_data.source]
        else:
            db.add(TopicWeightage(
                exam_id=payload.exam_id,
                topic=q_data.topic,
                year=q_data.year,
                question_count=1,
                total_marks=q_data.marks,
                source_types=[q_data.source] if q_data.source else [],
            ))
        saved_count += 1

    db.commit()
    return {"message": f"Imported {saved_count} questions successfully"}


@router.get("/questions/{exam_id}", summary="List PYQs for an exam")
async def list_questions(exam_id: int, year: int = None, topic: str = None, db: Session = Depends(get_db)):
    query = db.query(Question).filter(Question.exam_id == exam_id)
    if year:
        query = query.filter(Question.year == year)
    if topic:
        query = query.filter(Question.topic == topic)
    questions = query.all()
    return {"count": len(questions), "questions": questions}
