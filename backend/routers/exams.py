from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Exam
from schemas import ExamCreate, ExamOut

router = APIRouter(prefix="/exams", tags=["Exams"])


@router.post("/", response_model=ExamOut, summary="Create a new exam")
async def create_exam(exam: ExamCreate, db: Session = Depends(get_db)):
    existing = db.query(Exam).filter(Exam.name == exam.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Exam with this name already exists")
    db_exam = Exam(**exam.model_dump())
    db.add(db_exam)
    db.commit()
    db.refresh(db_exam)
    return db_exam


@router.get("/", summary="List all exams")
async def list_exams(db: Session = Depends(get_db)):
    exams = db.query(Exam).all()
    return {"count": len(exams), "exams": exams}


@router.get("/{exam_id}", response_model=ExamOut, summary="Get exam details")
async def get_exam(exam_id: int, db: Session = Depends(get_db)):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    return exam


@router.delete("/{exam_id}", summary="Delete an exam")
async def delete_exam(exam_id: int, db: Session = Depends(get_db)):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    db.delete(exam)
    db.commit()
    return {"message": f"Exam '{exam.name}' deleted"}
