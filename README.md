# ExamsAnalyzer — Elite AI Exam Strategist

An AI-driven exam strategy platform powered by Claude, designed around how **toppers actually think** — not just memorization, but systematic decoding of the examiner's mindset.

## Four Core Modules

### 1. Generator (Knowledge Engine)
Transforms raw study material into active-recall tools:
- **Anki-style Flashcards** — front/back cards with difficulty grading and concept linking
- **Cloze Deletion** — fill-in-the-blank sentences for spaced repetition: `The {{c1::Vishaka Guidelines}} were issued in {{c2::1997}}`
- **Concept Maps** — auto-generated relational knowledge graph linking laws → cases → bodies → successor acts

### 2. Analyser (Strategy Engine)
Decodes the examiner's behavioral patterns:
- **Distractor Recycling Tracker** — flags if a past wrong answer is now a recycling candidate for the correct answer
- **Micro-Trend Forecasting** — tracks topic momentum (% change over 3 years) and prioritizes prep accordingly
- **Trap Identification** — scans question phrasing for extreme keywords (`always`, `never`, `only`), body/ministry confusion, partial truths

### 3. Validator (ROI Engine)
Allocates study time with mathematical precision:
- **ROTI Score** — `marks_yielded ÷ (pages/100 × hours)` | Grades: A+ to D
- **Source Evolution Tracker** — charts the shift from NCERT → Economic Survey → PIB reports
- **Pivot Recommendations** — tells you exactly which sources to add/drop

### 4. Elimination Strategist (New Module)
Teaches confident guessing with first-principles logic:
- **Budget Feasibility Check** — flags economically impossible options (e.g., ₹10L × 800M people > entire national budget)
- **Extreme Language Detector** — "always/never/only" options are almost always wrong
- **Body/Ministry Confusion Flags** — catches NCW vs NHRC vs NITI Aayog mandate mix-ups
- **Heuristic Library** — 4 built-in heuristics with examples and confidence scores

## Tech Stack

| Layer | Tech |
|-------|------|
| Backend | Python 3.11 + FastAPI + SQLAlchemy |
| Database | SQLite (portable, no setup needed) |
| AI Engine | Claude (`claude-sonnet-4-6`) via Anthropic SDK |
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS (dark theme) |
| Charts | Recharts |

## Quick Start

### 1. Set up environment
```bash
cd backend
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env
```

### 2. Install dependencies
```bash
# Backend
pip install -r backend/requirements.txt

# Frontend
cd frontend && npm install
```

### 3. Start both servers
```bash
chmod +x start.sh
./start.sh
```

- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Frontend**: http://localhost:5173

## API Overview

| Module | Endpoint | Description |
|--------|----------|-------------|
| Generator | `POST /generator/flashcards` | Generate Anki flashcards from text |
| Generator | `POST /generator/cloze` | Generate cloze deletion sentences |
| Generator | `POST /generator/concept-map` | Build relational concept graph |
| Analyser | `POST /analyser/trap-scan` | Detect examiner traps in questions |
| Analyser | `POST /analyser/distractor-check` | Check distractor recycling risk |
| Analyser | `GET /analyser/topic-momentum/{id}` | Micro-trend forecast |
| Validator | `POST /validator/roti-score` | Calculate ROTI for a resource |
| Validator | `GET /validator/source-evolution/{id}` | Track source shift |
| Eliminator | `POST /eliminator/analyze` | Run elimination heuristics |
| Eliminator | `POST /eliminator/feasibility-check` | Check budget/logic feasibility |
| Eliminator | `GET /eliminator/heuristics` | List all elimination patterns |
