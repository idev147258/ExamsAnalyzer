import { useState } from 'react'
import { Target, AlertOctagon, Brain, Shield, Zap, CheckCircle, XCircle } from 'lucide-react'
import { analyzeOptions, checkFeasibility, getHeuristics } from '../api/client'
import { useExams } from '../hooks/useExams'
import type { EliminationResult, FeasibilityResult, Heuristic } from '../types'
import clsx from 'clsx'
import { useEffect } from 'react'

type Tab = 'analyze' | 'feasibility' | 'heuristics'

export default function EliminatorPage() {
  const { exams } = useExams()
  const [tab, setTab] = useState<Tab>('analyze')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [examId, setExamId] = useState('')

  // Analyze
  const [questionText, setQuestionText] = useState('')
  const [options, setOptions] = useState({ A: '', B: '', C: '', D: '' })
  const [topic, setTopic] = useState('')
  const [eliminationResult, setEliminationResult] = useState<EliminationResult | null>(null)

  // Feasibility
  const [optionText, setOptionText] = useState('')
  const [context, setContext] = useState('')
  const [feasibilityResult, setFeasibilityResult] = useState<FeasibilityResult | null>(null)

  // Heuristics
  const [heuristics, setHeuristics] = useState<{ default_heuristics: Heuristic[] } | null>(null)

  const handleAnalyze = async () => {
    if (!questionText) return
    setLoading(true); setError('')
    try {
      const r = await analyzeOptions({
        question_text: questionText, options,
        exam_id: examId ? +examId : undefined, topic: topic || undefined
      })
      setEliminationResult(r.data)
    } catch (e: any) { setError(e.response?.data?.detail || 'Error') } finally { setLoading(false) }
  }

  const handleFeasibility = async () => {
    if (!optionText) return
    setLoading(true); setError('')
    try {
      const r = await checkFeasibility({ option_text: optionText, context: context || undefined })
      setFeasibilityResult(r.data)
    } catch (e: any) { setError(e.response?.data?.detail || 'Error') } finally { setLoading(false) }
  }

  const handleLoadHeuristics = async () => {
    setLoading(true); setError('')
    try {
      const r = await getHeuristics()
      setHeuristics(r.data)
    } catch (e: any) { setError(e.response?.data?.detail || 'Error') } finally { setLoading(false) }
  }

  useEffect(() => {
    if (tab === 'heuristics' && !heuristics) handleLoadHeuristics()
  }, [tab])

  const tabs = [
    { id: 'analyze' as Tab, label: 'Option Eliminator', icon: Target },
    { id: 'feasibility' as Tab, label: 'Feasibility Check', icon: AlertOctagon },
    { id: 'heuristics' as Tab, label: 'Heuristic Library', icon: Brain },
  ]

  const confidenceColor = (c: number) =>
    c >= 0.8 ? 'text-green-400' : c >= 0.6 ? 'text-yellow-400' : 'text-red-400'

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Target className="text-orange-400" size={24} /> Elimination Strategist
          <span className="text-sm font-normal text-gray-500 ml-1">Heuristic Guessing Engine</span>
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Don't just memorize — eliminate. Use first-principles heuristics to confidently guess even when you don't know the exact answer.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-900 border border-gray-800 rounded-lg p-1 w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={clsx('flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
              tab === id ? 'bg-orange-700 text-white' : 'text-gray-400 hover:text-gray-200')}>
            <Icon size={15} />{label}
          </button>
        ))}
      </div>

      {error && <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg p-3 mb-4 text-sm">{error}</div>}

      {/* TAB: Option Eliminator */}
      {tab === 'analyze' && (
        <div className="space-y-4">
          <div className="card">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="label">Exam (optional)</label>
                <select className="input" value={examId} onChange={(e) => setExamId(e.target.value)}>
                  <option value="">— None —</option>
                  {exams.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Topic (optional)</label>
                <input className="input" placeholder="e.g. Government Schemes" value={topic} onChange={(e) => setTopic(e.target.value)} />
              </div>
            </div>
            <label className="label">Question *</label>
            <textarea className="textarea mb-4" rows={3}
              placeholder="Paste the exam question..."
              value={questionText} onChange={(e) => setQuestionText(e.target.value)} />
            <div className="grid grid-cols-2 gap-3 mb-4">
              {(['A', 'B', 'C', 'D'] as const).map((k) => (
                <div key={k}>
                  <label className="label">Option {k}</label>
                  <input className="input" placeholder={`Option ${k}...`}
                    value={options[k]} onChange={(e) => setOptions((o) => ({ ...o, [k]: e.target.value }))} />
                </div>
              ))}
            </div>
            <button onClick={handleAnalyze} disabled={loading} className="btn-primary flex items-center gap-2">
              <Zap size={15} />{loading ? 'Analysing with Claude AI...' : 'Run Elimination Analysis'}
            </button>
          </div>

          {eliminationResult && (
            <div className="card">
              {/* Confidence + Recommendation */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-semibold text-white text-lg">Elimination Analysis</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Heuristics applied: {eliminationResult.heuristics_applied.join(', ')}
                  </p>
                </div>
                <div className="text-right">
                  <div className={clsx('text-2xl font-black', confidenceColor(eliminationResult.confidence))}>
                    {(eliminationResult.confidence * 100).toFixed(0)}%
                  </div>
                  <div className="text-xs text-gray-500">Confidence</div>
                </div>
              </div>

              {/* Options grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {Object.entries(eliminationResult.options).map(([k, v]) => {
                  const isEliminated = eliminationResult.eliminated_options.includes(k)
                  const isRecommended = eliminationResult.recommended_answer === k
                  return (
                    <div key={k} className={clsx('rounded-lg p-3 border', {
                      'border-red-700 bg-red-900/20': isEliminated,
                      'border-green-600 bg-green-900/20': isRecommended && !isEliminated,
                      'border-gray-700 bg-gray-800': !isEliminated && !isRecommended,
                    })}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="font-mono font-bold text-gray-300">{k}.</span>
                        {isEliminated && <XCircle size={14} className="text-red-400" />}
                        {isRecommended && !isEliminated && <CheckCircle size={14} className="text-green-400" />}
                        {isRecommended && !isEliminated && <span className="badge-green text-xs">Best Guess</span>}
                        {isEliminated && <span className="badge-red text-xs">Eliminated</span>}
                      </div>
                      <p className="text-sm text-gray-300">{v}</p>
                      {isEliminated && eliminationResult.elimination_reasons[k] && (
                        <p className="text-xs text-red-400 mt-1.5">{eliminationResult.elimination_reasons[k]}</p>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Full explanation */}
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Brain size={14} className="text-orange-400" />
                  <span className="text-sm font-medium text-white">Step-by-Step Elimination</span>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">{eliminationResult.explanation}</p>
              </div>

              {/* Feasibility flags */}
              {Object.keys(eliminationResult.feasibility_flags).length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-2">Feasibility Flags:</p>
                  {Object.entries(eliminationResult.feasibility_flags).map(([opt, flag]) => (
                    <div key={opt} className="flex gap-2 text-xs mb-1">
                      <span className="font-mono text-red-400 font-bold">{opt}:</span>
                      <span className="text-gray-400">{JSON.stringify(flag)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB: Feasibility Check */}
      {tab === 'feasibility' && (
        <div className="space-y-4">
          <div className="card">
            <p className="text-sm text-gray-400 mb-4">
              Paste any option text to check if it's economically or logically feasible.
              Ideal for catching "₹10 lakh to every rural woman" style impossible claims.
            </p>
            <label className="label">Option / Statement to Check *</label>
            <textarea className="textarea mb-3" rows={3}
              placeholder='e.g. "Under the scheme, every rural household receives ₹5 lakh annually..."'
              value={optionText} onChange={(e) => setOptionText(e.target.value)} />
            <label className="label">Context (optional)</label>
            <input className="input mb-4" placeholder="e.g. UPSC GS Paper 2 — Government Schemes"
              value={context} onChange={(e) => setContext(e.target.value)} />
            <button onClick={handleFeasibility} disabled={loading} className="btn-primary flex items-center gap-2">
              <AlertOctagon size={15} />{loading ? 'Checking...' : 'Check Feasibility'}
            </button>
          </div>

          {feasibilityResult && (
            <div className="card">
              <div className="flex items-center gap-4 mb-4">
                <div className={clsx('w-14 h-14 rounded-full flex items-center justify-center',
                  feasibilityResult.is_feasible ? 'bg-green-900' : 'bg-red-900')}>
                  {feasibilityResult.is_feasible
                    ? <CheckCircle size={24} className="text-green-400" />
                    : <XCircle size={24} className="text-red-400" />}
                </div>
                <div>
                  <h3 className={clsx('text-lg font-bold', feasibilityResult.is_feasible ? 'text-green-300' : 'text-red-300')}>
                    {feasibilityResult.is_feasible ? 'Feasible' : 'NOT Feasible — Eliminate This Option'}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div className={clsx('h-full rounded-full', feasibilityResult.is_feasible ? 'bg-green-500' : 'bg-red-500')}
                        style={{ width: `${feasibilityResult.feasibility_score * 100}%` }} />
                    </div>
                    <span className="text-xs text-gray-400">{(feasibilityResult.feasibility_score * 100).toFixed(0)}% feasibility</span>
                  </div>
                </div>
              </div>

              {feasibilityResult.flags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {feasibilityResult.flags.map((f) => <span key={f} className="badge-red">{f}</span>)}
                </div>
              )}

              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield size={14} className="text-orange-400" />
                  <span className="text-sm font-medium text-white">Analysis</span>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">{feasibilityResult.explanation}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: Heuristic Library */}
      {tab === 'heuristics' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-400">
            Master these heuristics to confidently eliminate wrong options across any exam.
          </p>
          {loading && <div className="text-center py-8 text-gray-500">Loading heuristics...</div>}
          {heuristics?.default_heuristics.map((h, i) => (
            <div key={i} className="card">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-orange-900/50 border border-orange-800 rounded-lg flex items-center justify-center shrink-0">
                  <span className="text-orange-400 font-bold text-sm">H{i + 1}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-white">{h.pattern_name}</h4>
                    <span className="badge-orange" style={{ background: '#7c2d12', color: '#fdba74' }}>
                      {(h.confidence_score * 100).toFixed(0)}% confidence
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mb-3">{h.description}</p>

                  <div className="mb-3">
                    <p className="text-xs text-gray-600 mb-1.5">Trigger keywords:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {h.trigger_keywords.map((k) => (
                        <span key={k} className="badge-yellow font-mono text-xs">{k}</span>
                      ))}
                    </div>
                  </div>

                  {h.example_question && (
                    <div className="bg-gray-800 rounded-lg p-3 text-xs">
                      <p className="text-gray-500 mb-1">Example question:</p>
                      <p className="text-gray-300 mb-2">{h.example_question}</p>
                      {h.example_wrong_option && (
                        <>
                          <p className="text-gray-500 mb-1">Wrong option to eliminate:</p>
                          <p className="text-red-400">{h.example_wrong_option}</p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
