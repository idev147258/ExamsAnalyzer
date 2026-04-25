import { useState } from 'react'
import { Brain, BookOpen, TrendingUp, CheckCircle, Target, Plus, Trash2, ArrowRight } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useExams } from '../hooks/useExams'
import { createExam, deleteExam } from '../api/client'

const modules = [
  {
    to: '/generator',
    icon: BookOpen,
    label: 'Generator',
    color: 'from-blue-600 to-blue-800',
    desc: 'Convert study material into Anki flashcards, cloze deletions, and linked concept maps.',
    features: ['Active Recall Flashcards', 'Cloze Deletion', 'Concept Interlinking'],
  },
  {
    to: '/analyser',
    icon: TrendingUp,
    label: 'Analyser',
    color: 'from-purple-600 to-purple-800',
    desc: 'Decode the examiner\'s mindset: track distractor recycling, forecast micro-trends, flag traps.',
    features: ['Distractor Recycling Tracker', 'Micro-Trend Forecasting', 'Trap Identification'],
  },
  {
    to: '/validator',
    icon: CheckCircle,
    label: 'Validator',
    color: 'from-emerald-600 to-emerald-800',
    desc: 'Calculate Return on Time Invested (ROTI) per resource and track source evolution.',
    features: ['ROTI Scoring', 'Source Evolution Tracker', 'Pivot Recommendations'],
  },
  {
    to: '/eliminator',
    icon: Target,
    label: 'Elimination Strategist',
    color: 'from-orange-600 to-orange-800',
    desc: 'Teach yourself to guess confidently by eliminating wrong options with first-principles logic.',
    features: ['Budget Feasibility Check', 'Extreme Language Detector', 'Body/Ministry Confusion Flags'],
  },
]

export default function Dashboard() {
  const { exams, loading, refresh } = useExams()
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', exam_type: 'UPSC', description: '' })
  const [submitting, setSubmitting] = useState(false)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSubmitting(true)
    try {
      await createExam(form)
      setForm({ name: '', exam_type: 'UPSC', description: '' })
      setCreating(false)
      refresh()
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete exam "${name}"?`)) return
    await deleteExam(id)
    refresh()
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Hero */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
            <Brain size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">ExamsAnalyzer</h1>
            <p className="text-gray-500 text-sm">Elite AI Exam Strategist — Decode the examiner's mindset</p>
          </div>
        </div>
        <p className="text-gray-400 max-w-2xl">
          Four powerful AI modules that transform how toppers prepare: from building an interconnected fact-wiki
          to heuristic elimination of wrong answers — all powered by Claude AI.
        </p>
      </div>

      {/* Module Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        {modules.map(({ to, icon: Icon, label, color, desc, features }) => (
          <NavLink
            key={to}
            to={to}
            className="card hover:border-gray-700 transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center shrink-0`}>
                <Icon size={20} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-white">{label}</h3>
                  <ArrowRight size={14} className="text-gray-600 group-hover:text-brand-400 transition-colors" />
                </div>
                <p className="text-sm text-gray-400 mb-3">{desc}</p>
                <div className="flex flex-wrap gap-1.5">
                  {features.map((f) => (
                    <span key={f} className="badge-blue text-xs">{f}</span>
                  ))}
                </div>
              </div>
            </div>
          </NavLink>
        ))}
      </div>

      {/* Exams section */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-semibold text-white">Your Exams</h2>
            <p className="text-xs text-gray-500 mt-0.5">Create an exam to start tracking PYQs and resources</p>
          </div>
          <button
            onClick={() => setCreating(!creating)}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Plus size={16} />
            New Exam
          </button>
        </div>

        {creating && (
          <form onSubmit={handleCreate} className="bg-gray-800 rounded-lg p-4 mb-4 space-y-3">
            <div>
              <label className="label">Exam Name</label>
              <input
                className="input"
                placeholder="e.g. UPSC CSE 2025"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Exam Type</label>
              <select
                className="input"
                value={form.exam_type}
                onChange={(e) => setForm((f) => ({ ...f, exam_type: e.target.value }))}
              >
                {['UPSC', 'NEET', 'JEE', 'GATE', 'CAT', 'SSC', 'Other'].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Description (optional)</label>
              <input
                className="input"
                placeholder="e.g. General Studies Paper 1"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary text-sm" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Exam'}
              </button>
              <button type="button" className="btn-secondary text-sm" onClick={() => setCreating(false)}>
                Cancel
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading exams...</div>
        ) : exams.length === 0 ? (
          <div className="text-center py-10">
            <Brain size={40} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No exams yet. Create one to get started.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {exams.map((exam) => (
              <div
                key={exam.id}
                className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
              >
                <div>
                  <span className="font-medium text-white">{exam.name}</span>
                  <span className="ml-2 badge-purple text-xs">{exam.exam_type}</span>
                  {exam.description && (
                    <p className="text-xs text-gray-500 mt-0.5">{exam.description}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(exam.id, exam.name)}
                  className="text-gray-600 hover:text-red-400 transition-colors p-1"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
