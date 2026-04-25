import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// ── Exams ──────────────────────────────────────────────────────────────────
export const getExams = () => api.get('/exams/')
export const createExam = (data: { name: string; exam_type: string; description?: string }) =>
  api.post('/exams/', data)
export const deleteExam = (id: number) => api.delete(`/exams/${id}`)

// ── Generator ──────────────────────────────────────────────────────────────
export const generateFlashcards = (data: {
  text: string
  topic: string
  exam_id?: number
  num_cards?: number
}) => api.post('/generator/flashcards', data)

export const generateCloze = (data: {
  text: string
  topic: string
  exam_id?: number
  num_sentences?: number
}) => api.post('/generator/cloze', data)

export const generateConceptMap = (data: {
  primary_concept: string
  supporting_text?: string
  exam_id?: number
  depth?: number
}) => api.post('/generator/concept-map', data)

export const getFlashcards = (examId: number) => api.get(`/generator/flashcards/${examId}`)

// ── Analyser ───────────────────────────────────────────────────────────────
export const scanTraps = (data: {
  question_text: string
  options: Record<string, string>
  exam_id?: number
}) => api.post('/analyser/trap-scan', data)

export const checkDistractor = (data: {
  option_text: string
  exam_id: number
  topic?: string
}) => api.post('/analyser/distractor-check', data)

export const getTopicMomentum = (examId: number) => api.get(`/analyser/topic-momentum/${examId}`)

export const importQuestions = (data: {
  exam_id: number
  questions: unknown[]
}) => api.post('/analyser/questions/import', data)

// ── Validator ──────────────────────────────────────────────────────────────
export const calculateROTI = (data: {
  name: string
  pages: number
  estimated_hours: number
  marks_yielded: number
  exam_id?: number
}) => api.post('/validator/roti-score', data)

export const getSourceEvolution = (examId: number) =>
  api.get(`/validator/source-evolution/${examId}`)

export const getRecommendations = (examId: number) =>
  api.get(`/validator/recommendations/${examId}`)

export const getResources = (examId: number) => api.get(`/validator/resources/${examId}`)

// ── Elimination Strategist ─────────────────────────────────────────────────
export const analyzeOptions = (data: {
  question_text: string
  options: Record<string, string>
  exam_id?: number
  topic?: string
}) => api.post('/eliminator/analyze', data)

export const checkFeasibility = (data: {
  option_text: string
  context?: string
}) => api.post('/eliminator/feasibility-check', data)

export const getHeuristics = () => api.get('/eliminator/heuristics')
