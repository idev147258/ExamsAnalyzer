import { useState } from 'react'
import { BookOpen, Layers, GitBranch, ChevronDown, ChevronUp, Zap } from 'lucide-react'
import { generateFlashcards, generateCloze, generateConceptMap } from '../api/client'
import { useExams } from '../hooks/useExams'
import type { Flashcard, ConceptMap } from '../types'
import clsx from 'clsx'

type Tab = 'flashcards' | 'cloze' | 'conceptmap'

const difficultyColor = {
  easy: 'badge-green',
  medium: 'badge-yellow',
  hard: 'badge-red',
} as const

export default function GeneratorPage() {
  const { exams } = useExams()
  const [tab, setTab] = useState<Tab>('flashcards')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Shared
  const [text, setText] = useState('')
  const [topic, setTopic] = useState('')
  const [examId, setExamId] = useState('')

  // Flashcards state
  const [numCards, setNumCards] = useState(8)
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set())

  // Cloze state
  const [numSentences, setNumSentences] = useState(5)
  const [clozeList, setClozeList] = useState<{ original: string; cloze: string; difficulty: string }[]>([])

  // Concept map state
  const [concept, setConcept] = useState('')
  const [depth, setDepth] = useState(2)
  const [conceptMap, setConceptMap] = useState<ConceptMap | null>(null)

  const handleFlashcards = async () => {
    if (!text || !topic) return
    setLoading(true); setError('')
    try {
      const r = await generateFlashcards({ text, topic, exam_id: examId ? +examId : undefined, num_cards: numCards })
      setFlashcards(r.data.flashcards)
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Error generating flashcards')
    } finally { setLoading(false) }
  }

  const handleCloze = async () => {
    if (!text || !topic) return
    setLoading(true); setError('')
    try {
      const r = await generateCloze({ text, topic, exam_id: examId ? +examId : undefined, num_sentences: numSentences })
      setClozeList(r.data.cloze_sentences)
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Error generating cloze')
    } finally { setLoading(false) }
  }

  const handleConceptMap = async () => {
    if (!concept) return
    setLoading(true); setError('')
    try {
      const r = await generateConceptMap({ primary_concept: concept, supporting_text: text, exam_id: examId ? +examId : undefined, depth })
      setConceptMap(r.data)
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Error generating concept map')
    } finally { setLoading(false) }
  }

  const toggleCard = (idx: number) => {
    setFlippedCards((prev) => {
      const next = new Set(prev)
      next.has(idx) ? next.delete(idx) : next.add(idx)
      return next
    })
  }

  const formatCloze = (text: string) =>
    text.replace(/\{\{c\d+::(.*?)\}\}/g, '<span class="bg-brand-700 text-brand-200 px-1 rounded">$1</span>')

  const tabs = [
    { id: 'flashcards' as Tab, label: 'Flashcards', icon: Layers },
    { id: 'cloze' as Tab, label: 'Cloze Deletion', icon: BookOpen },
    { id: 'conceptmap' as Tab, label: 'Concept Map', icon: GitBranch },
  ]

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BookOpen className="text-blue-400" size={24} /> Generator
          <span className="text-sm font-normal text-gray-500 ml-1">Knowledge Engine</span>
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Transform dense study material into active-recall flashcards, spaced-repetition cloze sentences, and an interconnected knowledge graph.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-900 border border-gray-800 rounded-lg p-1 w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
              tab === id ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-gray-200'
            )}
          >
            <Icon size={15} />{label}
          </button>
        ))}
      </div>

      {/* Shared inputs */}
      <div className="card mb-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">Exam (optional)</label>
            <select className="input" value={examId} onChange={(e) => setExamId(e.target.value)}>
              <option value="">— None —</option>
              {exams.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Topic *</label>
            <input className="input" placeholder="e.g. Women's Rights Legislation" value={topic} onChange={(e) => setTopic(e.target.value)} />
          </div>
          {tab === 'flashcards' && (
            <div>
              <label className="label">Number of cards</label>
              <input className="input" type="number" min={1} max={50} value={numCards} onChange={(e) => setNumCards(+e.target.value)} />
            </div>
          )}
          {tab === 'cloze' && (
            <div>
              <label className="label">Number of sentences</label>
              <input className="input" type="number" min={1} max={30} value={numSentences} onChange={(e) => setNumSentences(+e.target.value)} />
            </div>
          )}
          {tab === 'conceptmap' && (
            <div>
              <label className="label">Depth (1-4)</label>
              <input className="input" type="number" min={1} max={4} value={depth} onChange={(e) => setDepth(+e.target.value)} />
            </div>
          )}
        </div>
        {tab === 'conceptmap' ? (
          <div className="mt-4">
            <label className="label">Primary Concept *</label>
            <input className="input mb-3" placeholder="e.g. Vishaka Guidelines 1997" value={concept} onChange={(e) => setConcept(e.target.value)} />
            <label className="label">Supporting Context (optional)</label>
            <textarea className="textarea" rows={3} placeholder="Paste additional context or notes..." value={text} onChange={(e) => setText(e.target.value)} />
          </div>
        ) : (
          <div className="mt-4">
            <label className="label">Study Material *</label>
            <textarea className="textarea" rows={6} placeholder="Paste your study notes, textbook excerpts, or any text here..." value={text} onChange={(e) => setText(e.target.value)} />
          </div>
        )}
      </div>

      {error && <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg p-3 mb-4 text-sm">{error}</div>}

      <button
        onClick={tab === 'flashcards' ? handleFlashcards : tab === 'cloze' ? handleCloze : handleConceptMap}
        disabled={loading}
        className="btn-primary flex items-center gap-2 mb-6"
      >
        <Zap size={16} />
        {loading ? 'Generating with Claude AI...' : `Generate ${tabs.find(t => t.id === tab)?.label}`}
      </button>

      {/* Flashcards output */}
      {tab === 'flashcards' && flashcards.length > 0 && (
        <div>
          <h3 className="text-white font-semibold mb-3">{flashcards.length} Flashcards Generated</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {flashcards.map((card, i) => (
              <div
                key={i}
                className="card cursor-pointer hover:border-gray-700 transition-all"
                onClick={() => toggleCard(i)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex gap-1.5 flex-wrap">
                    <span className={difficultyColor[card.difficulty as keyof typeof difficultyColor] || 'badge-gray'}>{card.difficulty}</span>
                    {card.tags?.slice(0, 2).map((t) => <span key={t} className="badge-gray">{t}</span>)}
                  </div>
                  {flippedCards.has(i) ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
                </div>
                <p className="text-sm font-medium text-gray-200">{card.front}</p>
                {flippedCards.has(i) && (
                  <div className="mt-3 pt-3 border-t border-gray-800">
                    <p className="text-sm text-green-300">{card.back}</p>
                    {card.cloze_text && (
                      <div className="mt-2 text-xs text-gray-400 bg-gray-800 rounded p-2"
                        dangerouslySetInnerHTML={{ __html: formatCloze(card.cloze_text) }} />
                    )}
                    {card.concept_links && card.concept_links.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {card.concept_links.map((link) => (
                          <span key={link} className="badge-blue">{link}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cloze output */}
      {tab === 'cloze' && clozeList.length > 0 && (
        <div>
          <h3 className="text-white font-semibold mb-3">{clozeList.length} Cloze Sentences</h3>
          <div className="space-y-3">
            {clozeList.map((item, i) => (
              <div key={i} className="card">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-gray-500 font-medium">#{i + 1}</span>
                  <span className={difficultyColor[item.difficulty as keyof typeof difficultyColor] || 'badge-gray'}>{item.difficulty}</span>
                </div>
                <div className="text-sm text-gray-300 mb-2"
                  dangerouslySetInnerHTML={{ __html: formatCloze(item.cloze) }} />
                <div className="text-xs text-gray-600 italic">{item.original}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Concept map output */}
      {tab === 'conceptmap' && conceptMap && (
        <div className="space-y-4">
          <div className="card">
            <h3 className="text-white font-semibold mb-2">Summary</h3>
            <p className="text-sm text-gray-300">{conceptMap.summary}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="card">
              <h3 className="text-white font-semibold mb-3">Concept Nodes ({conceptMap.nodes.length})</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {conceptMap.nodes.map((node, i) => (
                  <div key={i} className="bg-gray-800 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-white text-sm">{node.name}</span>
                      {node.year && <span className="badge-gray">{node.year}</span>}
                      <span className="badge-purple">{node.category}</span>
                    </div>
                    <p className="text-xs text-gray-400">{node.description}</p>
                    {node.source_body && <p className="text-xs text-brand-400 mt-1">Body: {node.source_body}</p>}
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <h3 className="text-white font-semibold mb-3">Relationships ({conceptMap.edges.length})</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {conceptMap.edges.map((edge, i) => (
                  <div key={i} className="bg-gray-800 rounded-lg p-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-blue-300 font-medium">{edge.source}</span>
                      <span className="text-xs text-gray-500">→</span>
                      <span className="badge-green text-xs">{edge.relation_type}</span>
                      <span className="text-xs text-gray-500">→</span>
                      <span className="text-sm text-purple-300 font-medium">{edge.target}</span>
                    </div>
                    {edge.description && <p className="text-xs text-gray-500 mt-1">{edge.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
