from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import EliminationHeuristic
from schemas import (
    EliminationRequest, EliminationAnalysisOut,
    FeasibilityCheckRequest, FeasibilityCheckOut,
    HeuristicOut, MessageOut
)
from services import eliminator_service

router = APIRouter(prefix="/eliminator", tags=["Elimination Strategist"])


@router.post("/analyze", summary="Analyze question options using elimination heuristics")
async def analyze_options(req: EliminationRequest, db: Session = Depends(get_db)):
    try:
        result = eliminator_service.analyze_options_for_elimination(
            req.question_text, req.options, req.topic
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Claude API error: {str(e)}")
    return result


@router.post("/feasibility-check", summary="Check if an option is economically/logically feasible")
async def feasibility_check(req: FeasibilityCheckRequest, db: Session = Depends(get_db)):
    try:
        result = eliminator_service.check_feasibility(req.option_text, req.context)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Claude API error: {str(e)}")
    return result


@router.get("/heuristics", summary="List all elimination heuristics and patterns")
async def list_heuristics(exam_id: int = None, db: Session = Depends(get_db)):
    db_heuristics = db.query(EliminationHeuristic)
    if exam_id:
        db_heuristics = db_heuristics.filter(EliminationHeuristic.exam_id == exam_id)
    db_heuristics = db_heuristics.all()

    # Always include default heuristics
    defaults = eliminator_service.get_default_heuristics()

    return {
        "default_heuristics": defaults,
        "custom_heuristics": db_heuristics,
        "total": len(defaults) + len(db_heuristics),
    }


@router.post("/heuristics", summary="Add a custom elimination heuristic")
async def add_heuristic(
    pattern_type: str,
    pattern_name: str,
    description: str,
    trigger_keywords: list[str],
    confidence_score: float = 0.8,
    exam_id: int = None,
    db: Session = Depends(get_db),
):
    db_h = EliminationHeuristic(
        exam_id=exam_id,
        pattern_type=pattern_type,
        pattern_name=pattern_name,
        description=description,
        trigger_keywords=trigger_keywords,
        confidence_score=confidence_score,
    )
    db.add(db_h)
    db.commit()
    db.refresh(db_h)
    return db_h
