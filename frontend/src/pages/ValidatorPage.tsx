import { useState } from 'react'
import { CheckCircle, TrendingUp, BookOpen, Zap, ArrowUpRight } from 'lucide-react'
import { calculateROTI, getSourceEvolution, getRecommendations } from '../api/client'
import { useExams } from '../hooks/useExams'
import type { ROTIResult, SourceEvolution } from '../types'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import clsx from 'clsx'

type Tab = 'roti' | 'sources'

const gradeColor: Record<string, string> = {
  'A+': 'text-green-400',
  'A': 'text-emerald-400',
  'B': 'text-yellow-400',
  'C': 'text-orange-400',
  'D': 'text-red-400',
}

const SOURCE_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444']

export default function ValidatorPage() {
  const { exams } = useExams()
  const [tab, setTab] = useState<Tab>('roti')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [examId, setExamId] = useState('')

  // ROTI form
  const [rotiForm, setROTIForm] = useState({ name: '', pages: '', estimated_hours: '', marks_yielded: '' })
  const [rotiResult, setROTIResult] = useState<ROTIResult | null>(null)

  // Source evolution
  const [sourceEvo, setSourceEvo] = useState<SourceEvolution | null>(null)

  const handleROTI = async () => {
    const { name, pages, estimated_hours, marks_yielded } = rotiForm
    if (!name || !pages || !estimated_hours || !marks_yielded) return
    setLoading(true); setError('')
    try {
      const r = await calculateROTI({
        name, pages: +pages, estimated_hours: +estimated_hours,
        marks_yielded: +marks_yielded, exam_id: examId ? +examId : undefined,
      })
      setROTIResult(r.data)
    } catch (e: any) { setError(e.response?.data?.detail || 'Error') } finally { setLoading(false) }
  }

  const handleSourceEvo = async () => {
    if (!examId) return
    setLoading(true); setError('')
    try {
      const r = await getSourceEvolution(+examId)
      setSourceEvo(r.data)
    } catch (e: any) { setError(e.response?.data?.detail || 'Error') } finally { setLoading(false) }
  }

  // Transform source data for recharts
  const chartData = sourceEvo ? sourceEvo.years.map((year, i) => {
    const row: Record<string, unknown> = { year }
    Object.entries(sourceEvo.source_distribution).forEach(([src, counts]) => {
      row[src] = counts[i] || 0
    })
    return row
  }) : []

  const tabs = [
    { id: 'roti' as Tab, label: 'ROTI Calculator', icon: BookOpen },
    { id: 'sources' as Tab, label: 'Source Evolution', icon: TrendingUp },
  ]

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <CheckCircle className="text-emerald-400" size={24} /> Validator
          <span className="text-sm font-normal text-gray-500 ml-1">ROI Engine</span>
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Calculate Return on Time Invested (ROTI) for every study resource and track how question sources are evolving.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-900 border border-gray-800 rounded-lg p-1 w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={clsx('flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
              tab === id ? 'bg-emerald-700 text-white' : 'text-gray-400 hover:text-gray-200')}>
            <Icon size={15} />{label}
          </button>
        ))}
      </div>

      {error && <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg p-3 mb-4 text-sm">{error}</div>}

      {/* Exam selector */}
      <div className="card mb-5">
        <label className="label">Exam (optional for ROTI, required for Source Evolution)</label>
        <select className="input max-w-xs" value={examId} onChange={(e) => setExamId(e.target.value)}>
          <option value="">— None —</option>
          {exams.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
      </div>

      {/* TAB: ROTI Calculator */}
      {tab === 'roti' && (
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold text-white mb-1">Return on Time Invested Calculator</h3>
            <p className="text-xs text-gray-500 mb-4">
              Formula: <code className="bg-gray-800 px-1 rounded">marks_yielded ÷ (pages/100 × hours)</code> — Higher = better use of your time.
            </p>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="col-span-2">
                <label className="label">Resource Name *</label>
                <input className="input" placeholder="e.g. Economic Survey 2023-24"
                  value={rotiForm.name} onChange={(e) => setROTIForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="label">Total Pages *</label>
                <input className="input" type="number" placeholder="e.g. 450"
                  value={rotiForm.pages} onChange={(e) => setROTIForm(f => ({ ...f, pages: e.target.value }))} />
              </div>
              <div>
                <label className="label">Study Hours Required *</label>
                <input className="input" type="number" step="0.5" placeholder="e.g. 20"
                  value={rotiForm.estimated_hours} onChange={(e) => setROTIForm(f => ({ ...f, estimated_hours: e.target.value }))} />
              </div>
              <div>
                <label className="label">Marks Yielded in Past Exams *</label>
                <input className="input" type="number" step="0.5" placeholder="e.g. 5"
                  value={rotiForm.marks_yielded} onChange={(e) => setROTIForm(f => ({ ...f, marks_yielded: e.target.value }))} />
              </div>
            </div>
            <button onClick={handleROTI} disabled={loading} className="btn-primary flex items-center gap-2">
              <Zap size={15} />{loading ? 'Calculating with Claude AI...' : 'Calculate ROTI'}
            </button>
          </div>

          {rotiResult && (
            <div className="card">
              <div className="flex items-center gap-4 mb-5">
                <div className="text-center">
                  <div className={clsx('text-5xl font-black', gradeColor[rotiResult.roti_grade] || 'text-white')}>
                    {rotiResult.roti_grade}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">ROTI Grade</div>
                </div>
                <div className="flex-1 grid grid-cols-3 gap-3">
                  <div className="bg-gray-800 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-white">{rotiResult.roti_score.toFixed(2)}</div>
                    <div className="text-xs text-gray-500">ROTI Score</div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-white">{rotiResult.marks_yielded}</div>
                    <div className="text-xs text-gray-500">Marks Yielded</div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-white">{rotiResult.pages}</div>
                    <div className="text-xs text-gray-500">Pages</div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-800 rounded-lg p-3 mb-3">
                <p className="text-sm font-medium text-gray-300 mb-1">Comparison</p>
                <p className="text-sm text-gray-400">{rotiResult.comparison}</p>
              </div>
              <div className="bg-brand-900/40 border border-brand-700 rounded-lg p-3">
                <p className="text-sm font-medium text-brand-300 mb-1">Recommendation</p>
                <p className="text-sm text-brand-200">{rotiResult.recommendation}</p>
              </div>
            </div>
          )}

          {/* Grade scale reference */}
          <div className="card">
            <h4 className="text-sm font-semibold text-white mb-3">ROTI Grade Scale</h4>
            <div className="grid grid-cols-5 gap-2">
              {[['A+', '>2.0', 'text-green-400'], ['A', '1.0-2.0', 'text-emerald-400'], ['B', '0.5-1.0', 'text-yellow-400'], ['C', '0.2-0.5', 'text-orange-400'], ['D', '<0.2', 'text-red-400']].map(([grade, range, color]) => (
                <div key={grade} className="bg-gray-800 rounded-lg p-3 text-center">
                  <div className={clsx('text-2xl font-black', color)}>{grade}</div>
                  <div className="text-xs text-gray-500 mt-1">{range}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB: Source Evolution */}
      {tab === 'sources' && (
        <div className="space-y-4">
          <div className="card">
            <p className="text-sm text-gray-400 mb-3">
              Track how the origin of exam questions has shifted over the years — from textbooks to dynamic sources like Economic Survey and PIB.
            </p>
            <button onClick={handleSourceEvo} disabled={loading || !examId} className="btn-primary flex items-center gap-2">
              <TrendingUp size={15} />{loading ? 'Analysing...' : 'Analyse Source Evolution'}
            </button>
            {!examId && <p className="text-xs text-yellow-400 mt-2">Select an exam above first.</p>}
          </div>

          {sourceEvo && (
            <div className="space-y-4">
              {/* Shift indicator */}
              <div className={clsx('rounded-lg p-4 border', sourceEvo.shift_detected
                ? 'bg-yellow-900/30 border-yellow-700' : 'bg-green-900/20 border-green-800')}>
                <div className="flex items-center gap-2 mb-1">
                  <ArrowUpRight size={16} className={sourceEvo.shift_detected ? 'text-yellow-400' : 'text-green-400'} />
                  <span className={clsx('font-semibold', sourceEvo.shift_detected ? 'text-yellow-300' : 'text-green-300')}>
                    {sourceEvo.shift_detected ? 'Source Shift Detected!' : 'Sources are Stable'}
                  </span>
                </div>
                <p className="text-sm text-gray-300">{sourceEvo.shift_description}</p>
                <div className="flex gap-4 mt-2 text-xs text-gray-500">
                  <span>Before: <span className="text-white">{sourceEvo.dominant_source_before}</span></span>
                  <span>→</span>
                  <span>Now: <span className="text-white">{sourceEvo.dominant_source_now}</span></span>
                </div>
              </div>

              {/* Chart */}
              {chartData.length > 0 && (
                <div className="card">
                  <h4 className="font-semibold text-white mb-4">Source Distribution Over Years</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                      <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8 }} />
                      <Legend />
                      {Object.keys(sourceEvo.source_distribution).map((src, i) => (
                        <Bar key={src} dataKey={src} stackId="a" fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Recommendations */}
              <div className="card">
                <h4 className="font-semibold text-white mb-3">Pivot Recommendations</h4>
                <div className="space-y-2">
                  {sourceEvo.pivot_recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm">
                      <span className="text-brand-400 font-bold shrink-0">→</span>
                      <span className="text-gray-300">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
