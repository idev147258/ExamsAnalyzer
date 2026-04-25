import { useState } from 'react'
import { TrendingUp, AlertTriangle, RefreshCcw, BarChart2, Zap } from 'lucide-react'
import { scanTraps, checkDistractor, getTopicMomentum } from '../api/client'
import { useExams } from '../hooks/useExams'
import type { TrapScanResult, DistractorCheckResult, TopicMomentum, TrendForecast } from '../types'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import clsx from 'clsx'

type Tab = 'traps' | 'distractors' | 'trends'

const priorityColor = { high: 'badge-red', medium: 'badge-yellow', low: 'badge-green' } as const
const riskColor = { high: 'badge-red', medium: 'badge-yellow', low: 'badge-green' } as const
const directionColor = { rising: 'text-green-400', falling: 'text-red-400', stable: 'text-yellow-400' } as const

export default function AnalyserPage() {
  const { exams } = useExams()
  const [tab, setTab] = useState<Tab>('traps')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [examId, setExamId] = useState('')

  // Trap scanner
  const [questionText, setQuestionText] = useState('')
  const [options, setOptions] = useState({ A: '', B: '', C: '', D: '' })
  const [trapResult, setTrapResult] = useState<TrapScanResult | null>(null)

  // Distractor check
  const [optionText, setOptionText] = useState('')
  const [distractorResult, setDistractorResult] = useState<DistractorCheckResult | null>(null)

  // Trend forecasting
  const [momentum, setMomentum] = useState<TopicMomentum | null>(null)

  const handleTrapScan = async () => {
    if (!questionText) return
    setLoading(true); setError('')
    try {
      const r = await scanTraps({ question_text: questionText, options, exam_id: examId ? +examId : undefined })
      setTrapResult(r.data)
    } catch (e: any) { setError(e.response?.data?.detail || 'Error') } finally { setLoading(false) }
  }

  const handleDistractorCheck = async () => {
    if (!optionText || !examId) return
    setLoading(true); setError('')
    try {
      const r = await checkDistractor({ option_text: optionText, exam_id: +examId })
      setDistractorResult(r.data)
    } catch (e: any) { setError(e.response?.data?.detail || 'Error') } finally { setLoading(false) }
  }

  const handleTrends = async () => {
    if (!examId) return
    setLoading(true); setError('')
    try {
      const r = await getTopicMomentum(+examId)
      setMomentum(r.data)
    } catch (e: any) { setError(e.response?.data?.detail || 'Error') } finally { setLoading(false) }
  }

  const tabs = [
    { id: 'traps' as Tab, label: 'Trap Identification', icon: AlertTriangle },
    { id: 'distractors' as Tab, label: 'Distractor Recycling', icon: RefreshCcw },
    { id: 'trends' as Tab, label: 'Micro-Trend Forecast', icon: BarChart2 },
  ]

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <TrendingUp className="text-purple-400" size={24} /> Analyser
          <span className="text-sm font-normal text-gray-500 ml-1">Strategy Engine</span>
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Decode the examiner's mindset: detect question traps, track distractor recycling, and forecast topic momentum.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-900 border border-gray-800 rounded-lg p-1 w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={clsx('flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
              tab === id ? 'bg-purple-700 text-white' : 'text-gray-400 hover:text-gray-200')}>
            <Icon size={15} />{label}
          </button>
        ))}
      </div>

      {error && <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg p-3 mb-4 text-sm">{error}</div>}

      {/* Exam selector */}
      <div className="card mb-5">
        <label className="label">Select Exam</label>
        <select className="input max-w-xs" value={examId} onChange={(e) => setExamId(e.target.value)}>
          <option value="">— Select an exam —</option>
          {exams.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
      </div>

      {/* TAB: Trap Scanner */}
      {tab === 'traps' && (
        <div className="space-y-4">
          <div className="card">
            <label className="label">Question Text *</label>
            <textarea className="textarea mb-3" rows={3}
              placeholder="Paste the exam question here..."
              value={questionText} onChange={(e) => setQuestionText(e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              {(['A', 'B', 'C', 'D'] as const).map((k) => (
                <div key={k}>
                  <label className="label">Option {k}</label>
                  <input className="input" placeholder={`Option ${k}`}
                    value={options[k]} onChange={(e) => setOptions((o) => ({ ...o, [k]: e.target.value }))} />
                </div>
              ))}
            </div>
            <button onClick={handleTrapScan} disabled={loading} className="btn-primary flex items-center gap-2 mt-4">
              <Zap size={15} />{loading ? 'Scanning with Claude AI...' : 'Scan for Traps'}
            </button>
          </div>

          {trapResult && (
            <div className="card">
              <div className="flex items-center gap-3 mb-4">
                <div className={clsx('w-10 h-10 rounded-full flex items-center justify-center',
                  trapResult.has_traps ? 'bg-red-900' : 'bg-green-900')}>
                  <AlertTriangle size={18} className={trapResult.has_traps ? 'text-red-400' : 'text-green-400'} />
                </div>
                <div>
                  <h3 className="font-semibold text-white">
                    {trapResult.has_traps ? 'Traps Detected!' : 'No Major Traps Found'}
                  </h3>
                  <p className="text-xs text-gray-500">Confidence: {(trapResult.confidence * 100).toFixed(0)}%</p>
                </div>
              </div>

              {trapResult.trap_types.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-1.5">Trap Types:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {trapResult.trap_types.map((t) => <span key={t} className="badge-red">{t}</span>)}
                  </div>
                </div>
              )}

              {trapResult.flagged_keywords.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-1.5">Flagged Keywords:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {trapResult.flagged_keywords.map((k) => <span key={k} className="badge-yellow font-mono">{k}</span>)}
                  </div>
                </div>
              )}

              <div className="bg-gray-800 rounded-lg p-3 mb-3">
                <p className="text-sm text-gray-300">{trapResult.explanation}</p>
              </div>

              {trapResult.safe_options.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-1.5">Safer Options (less likely to be traps):</p>
                  <div className="flex gap-2">
                    {trapResult.safe_options.map((o) => <span key={o} className="badge-green font-mono font-bold">Option {o}</span>)}
                  </div>
                </div>
              )}

              {trapResult.option_analysis && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-2">Per-Option Analysis:</p>
                  <div className="space-y-1.5">
                    {Object.entries(trapResult.option_analysis).map(([k, v]) => (
                      <div key={k} className="flex gap-3 text-xs">
                        <span className="font-mono font-bold text-gray-400 w-4 shrink-0">{k}</span>
                        <span className="text-gray-300">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB: Distractor Recycling */}
      {tab === 'distractors' && (
        <div className="space-y-4">
          <div className="card">
            <p className="text-sm text-gray-400 mb-3">
              Exam setters frequently recycle wrong answers from past years as the correct answer in future exams.
              Check if an option has a recycling risk.
            </p>
            <label className="label">Option Text to Check *</label>
            <textarea className="textarea mb-3" rows={2}
              placeholder="Paste the option/answer text to check..."
              value={optionText} onChange={(e) => setOptionText(e.target.value)} />
            <button onClick={handleDistractorCheck} disabled={loading || !examId}
              className="btn-primary flex items-center gap-2">
              <RefreshCcw size={15} />{loading ? 'Checking...' : 'Check Distractor History'}
            </button>
            {!examId && <p className="text-xs text-yellow-400 mt-2">Select an exam above first.</p>}
          </div>

          {distractorResult && (
            <div className="card">
              <div className="flex items-center gap-3 mb-4">
                <span className={riskColor[distractorResult.recycling_risk as keyof typeof riskColor] || 'badge-gray'}>
                  {distractorResult.recycling_risk.toUpperCase()} RISK
                </span>
                <span className={distractorResult.appeared_as_distractor ? 'text-yellow-400' : 'text-green-400'}>
                  {distractorResult.appeared_as_distractor ? 'Previously seen as distractor' : 'No distractor history found'}
                </span>
              </div>
              <div className="bg-gray-800 rounded-lg p-3 mb-3">
                <p className="text-sm text-gray-300">{distractorResult.explanation}</p>
              </div>
              {distractorResult.distractor_years.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-1.5">Appeared as distractor in years:</p>
                  <div className="flex gap-1.5">
                    {distractorResult.distractor_years.map((y) => <span key={y} className="badge-yellow font-mono">{y}</span>)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB: Micro-Trend Forecasting */}
      {tab === 'trends' && (
        <div className="space-y-4">
          <div className="card">
            <p className="text-sm text-gray-400 mb-3">
              See which topics are gaining momentum vs declining. Prioritize your prep accordingly.
            </p>
            <button onClick={handleTrends} disabled={loading || !examId}
              className="btn-primary flex items-center gap-2">
              <BarChart2 size={15} />{loading ? 'Forecasting...' : 'Generate Trend Forecast'}
            </button>
            {!examId && <p className="text-xs text-yellow-400 mt-2">Select an exam above first.</p>}
          </div>

          {momentum && (
            <div className="space-y-4">
              {/* Alert */}
              {momentum.source_shift_alert && (
                <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4">
                  <p className="text-yellow-300 text-sm font-medium">Source Shift Alert</p>
                  <p className="text-yellow-400 text-sm mt-1">{momentum.source_shift_alert}</p>
                </div>
              )}

              {/* Priority lists */}
              <div className="grid grid-cols-2 gap-4">
                <div className="card">
                  <h4 className="text-sm font-semibold text-white mb-2">Top Priority Topics</h4>
                  <div className="space-y-1">
                    {momentum.top_priority_topics.map((t, i) => (
                      <div key={t} className="flex items-center gap-2 text-sm">
                        <span className="text-brand-400 font-bold">#{i + 1}</span>
                        <span className="text-gray-200">{t}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="card">
                  <h4 className="text-sm font-semibold text-white mb-2">Declining Topics</h4>
                  <div className="space-y-1">
                    {momentum.declining_topics.map((t) => (
                      <div key={t} className="flex items-center gap-2 text-sm text-gray-400">
                        <span className="text-red-500">↓</span>
                        {t}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Topic cards */}
              <div className="space-y-3">
                {momentum.topic_forecasts.map((forecast: TrendForecast) => (
                  <div key={forecast.topic} className="card">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-white">{forecast.topic}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">{forecast.forecast}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={clsx('text-sm font-bold', directionColor[forecast.direction])}>
                          {forecast.momentum > 0 ? '+' : ''}{forecast.momentum.toFixed(1)}%
                        </span>
                        <span className={priorityColor[forecast.priority as keyof typeof priorityColor] || 'badge-gray'}>
                          {forecast.priority}
                        </span>
                      </div>
                    </div>
                    {forecast.year_data.length > 1 && (
                      <ResponsiveContainer width="100%" height={80}>
                        <AreaChart data={forecast.year_data}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#6b7280' }} />
                          <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} width={20} />
                          <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8 }} />
                          <Area type="monotone" dataKey="count" stroke="#8b5cf6" fill="#8b5cf620" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
