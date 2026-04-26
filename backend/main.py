from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import generator, analyser, validator, eliminator, exams
from services.llm_client import get_provider_info

# Create all DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ExamsAnalyzer — Elite AI Exam Strategist",
    description=(
        "An AI-driven exam strategy platform powered by Claude. "
        "Four modules: Generator (flashcards + concept maps), "
        "Analyser (distractor tracking + trend forecasting + trap detection), "
        "Validator (ROTI scoring + source evolution), "
        "Elimination Strategist (heuristic guessing engine)."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(exams.router)
app.include_router(generator.router)
app.include_router(analyser.router)
app.include_router(validator.router)
app.include_router(eliminator.router)


@app.get("/", tags=["Health"])
async def root():
    return {
        "name": "ExamsAnalyzer API",
        "version": "1.0.0",
        "modules": ["Generator", "Analyser", "Validator", "Elimination Strategist"],
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok"}


@app.get("/provider", tags=["Health"])
async def provider_info():
    """Returns the currently configured LLM provider and model."""
    return get_provider_info()
