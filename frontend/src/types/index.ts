export interface Exam {
  id: number
  name: string
  exam_type: string
  description?: string
}

export interface Flashcard {
  id: number
  topic: string
  front: string
  back: string
  cloze_text?: string
  concept_links?: string[]
  tags?: string[]
  difficulty: 'easy' | 'medium' | 'hard'
}

export interface ConceptNode {
  id?: number
  name: string
  description: string
  category: string
  year?: number
  related_node_ids?: number[]
  relation_types?: Record<string, string>
  tags?: string[]
  source_ministry?: string
  source_body?: string
}

export interface ConceptEdge {
  source: string
  target: string
  relation_type: string
  description?: string
}

export interface ConceptMap {
  nodes: ConceptNode[]
  edges: ConceptEdge[]
  summary: string
}

export interface TrapScanResult {
  has_traps: boolean
  trap_types: string[]
  flagged_keywords: string[]
  explanation: string
  safe_options: string[]
  option_analysis?: Record<string, string>
  confidence: number
}

export interface TrendForecast {
  topic: string
  year_data: { year: number; count: number; marks?: number }[]
  momentum: number
  direction: 'rising' | 'falling' | 'stable'
  forecast: string
  priority: 'high' | 'medium' | 'low'
}

export interface TopicMomentum {
  exam_id: number
  topic_forecasts: TrendForecast[]
  top_priority_topics: string[]
  declining_topics: string[]
  source_shift_alert?: string
}

export interface DistractorCheckResult {
  option_text: string
  appeared_as_distractor: boolean
  distractor_years: number[]
  recycling_risk: 'low' | 'medium' | 'high'
  explanation: string
  similar_questions: { year: number; question_snippet: string; role: string }[]
}

export interface ROTIResult {
  name: string
  pages: number
  estimated_hours: number
  marks_yielded: number
  roti_score: number
  roti_grade: string
  comparison: string
  recommendation: string
}

export interface SourceEvolution {
  exam_id: number
  years: number[]
  source_distribution: Record<string, number[]>
  dominant_source_now: string
  dominant_source_before: string
  shift_detected: boolean
  shift_description: string
  pivot_recommendations: string[]
}

export interface EliminationResult {
  question_text: string
  options: Record<string, string>
  eliminated_options: string[]
  elimination_reasons: Record<string, string>
  recommended_answer?: string
  confidence: number
  heuristics_applied: string[]
  explanation: string
  feasibility_flags: Record<string, unknown>
}

export interface FeasibilityResult {
  option_text: string
  is_feasible: boolean
  feasibility_score: number
  flags: string[]
  explanation: string
}

export interface Heuristic {
  pattern_type: string
  pattern_name: string
  description: string
  trigger_keywords: string[]
  example_question?: string
  example_wrong_option?: string
  confidence_score: number
}
