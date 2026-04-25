from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Flashcard, ConceptNode, Exam
from schemas import (
    FlashcardRequest, ClozeRequest, ConceptMapRequest,
    FlashcardOut, ConceptMapOut, MessageOut
)
from services import generator_service

router = APIRouter(prefix="/generator", tags=["Generator"])


@router.post("/flashcards", summary="Generate Anki-style flashcards from study material")
async def generate_flashcards(req: FlashcardRequest, db: Session = Depends(get_db)):
    try:
        cards = generator_service.generate_flashcards(req.text, req.topic, req.num_cards)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Claude API error: {str(e)}")

    saved = []
    for card in cards:
        db_card = Flashcard(
            exam_id=req.exam_id,
            topic=req.topic,
            front=card.get("front", ""),
            back=card.get("back", ""),
            cloze_text=card.get("cloze_text"),
            concept_links=card.get("concept_links", []),
            tags=card.get("tags", []),
            difficulty=card.get("difficulty", "medium"),
        )
        db.add(db_card)
        db.flush()
        saved.append(db_card)
    db.commit()

    return {
        "count": len(saved),
        "flashcards": [
            {
                "id": c.id,
                "front": c.front,
                "back": c.back,
                "cloze_text": c.cloze_text,
                "difficulty": c.difficulty,
                "tags": c.tags,
                "concept_links": c.concept_links,
            }
            for c in saved
        ],
    }


@router.post("/cloze", summary="Generate cloze-deletion sentences for spaced repetition")
async def generate_cloze(req: ClozeRequest, db: Session = Depends(get_db)):
    try:
        cloze_list = generator_service.generate_cloze_deletions(req.text, req.topic, req.num_sentences)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Claude API error: {str(e)}")

    return {"count": len(cloze_list), "cloze_sentences": cloze_list}


@router.post("/concept-map", summary="Generate relational concept map between linked ideas")
async def generate_concept_map(req: ConceptMapRequest, db: Session = Depends(get_db)):
    try:
        result = generator_service.generate_concept_map(
            req.primary_concept, req.supporting_text or "", req.depth
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Claude API error: {str(e)}")

    # Persist nodes to DB
    nodes = result.get("nodes", [])
    for node_data in nodes:
        existing = db.query(ConceptNode).filter(ConceptNode.name == node_data.get("name")).first()
        if not existing:
            db_node = ConceptNode(
                exam_id=req.exam_id,
                name=node_data.get("name", ""),
                description=node_data.get("description", ""),
                category=node_data.get("category", "other"),
                year=node_data.get("year"),
                tags=node_data.get("tags", []),
                source_ministry=node_data.get("source_ministry"),
                source_body=node_data.get("source_body"),
                relation_types=node_data.get("relation_types", {}),
            )
            db.add(db_node)
    db.commit()

    return result


@router.get("/flashcards/{exam_id}", summary="List all flashcards for an exam")
async def list_flashcards(exam_id: int, db: Session = Depends(get_db)):
    cards = db.query(Flashcard).filter(Flashcard.exam_id == exam_id).all()
    return {"count": len(cards), "flashcards": cards}


@router.get("/concept-nodes", summary="List all stored concept nodes")
async def list_concept_nodes(exam_id: int = None, db: Session = Depends(get_db)):
    query = db.query(ConceptNode)
    if exam_id:
        query = query.filter(ConceptNode.exam_id == exam_id)
    nodes = query.all()
    return {"count": len(nodes), "nodes": nodes}
