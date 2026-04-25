import { useState, useEffect } from 'react'
import { getExams } from '../api/client'
import type { Exam } from '../types'

export function useExams() {
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = () => {
    setLoading(true)
    getExams()
      .then((r) => setExams(r.data.exams || []))
      .catch(() => setExams([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { refresh() }, [])

  return { exams, loading, refresh }
}
