from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import StudyResource, Exam
from schemas import (
    StudyResourceCreate, ROTIRequest, ROTIOut,
    SourceEvolutionOut, MessageOut
)
from services import validator_service

router = APIRouter(prefix="/validator", tags=["Validator"])


@router.post("/roti-score", summary="Calculate Return on Time Invested for a study resource")
async def calculate_roti(req: ROTIRequest, db: Session = Depends(get_db)):
    try:
        result = validator_service.calculate_roti(
            req.name, req.pages, req.estimated_hours, req.marks_yielded
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Claude API error: {str(e)}")

    # Persist resource if exam_id provided
    if req.exam_id and req.resource_id is None:
        db_resource = StudyResource(
            exam_id=req.exam_id,
            name=req.name,
            resource_type="book",
            source_category="textbook",
            pages=req.pages,
            estimated_hours=req.estimated_hours,
            marks_yielded=req.marks_yielded,
            roti_score=result.get("roti_score", 0),
        )
        db.add(db_resource)
        db.commit()

    return result


@router.post("/resources", summary="Add a study resource to track")
async def add_resource(resource: StudyResourceCreate, db: Session = Depends(get_db)):
    exam = db.query(Exam).filter(Exam.id == resource.exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    db_resource = StudyResource(**resource.model_dump())
    db.add(db_resource)
    db.commit()
    db.refresh(db_resource)
    return db_resource


@router.get("/resources/{exam_id}", summary="List all study resources for an exam sorted by ROTI")
async def list_resources(exam_id: int, db: Session = Depends(get_db)):
    resources = (
        db.query(StudyResource)
        .filter(StudyResource.exam_id == exam_id)
        .order_by(StudyResource.roti_score.desc().nullslast())
        .all()
    )
    return {"count": len(resources), "resources": resources}


@router.get("/source-evolution/{exam_id}", summary="Track how question sources have shifted over years")
async def source_evolution(exam_id: int, db: Session = Depends(get_db)):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    try:
        result = validator_service.get_source_evolution(exam_id, db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis error: {str(e)}")
    return result


@router.get("/recommendations/{exam_id}", summary="Get prioritized study recommendations based on ROTI and source trends")
async def recommendations(exam_id: int, db: Session = Depends(get_db)):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    resources = (
        db.query(StudyResource)
        .filter(StudyResource.exam_id == exam_id)
        .all()
    )

    high_roti = [r for r in resources if r.roti_score and r.roti_score >= 1.0]
    low_roti = [r for r in resources if r.roti_score and r.roti_score < 0.5]

    return {
        "exam_id": exam_id,
        "high_roti_resources": [{"name": r.name, "roti_score": r.roti_score} for r in high_roti],
        "low_roti_resources": [{"name": r.name, "roti_score": r.roti_score} for r in low_roti],
        "pivot_advice": (
            "Focus on high-ROTI resources. "
            "If Economic Survey / PIB showing up in source evolution — pivot reading accordingly."
        )
    }
