import { useEffect, useState } from 'react'
import { adviseNextSession } from '../lib/adaptiveAdvice'
import type { Advice } from '../lib/adaptiveAdvice'
import { fetchExerciseHistory } from '../lib/fetchExerciseHistory'
import { useAuth } from '../contexts/AuthContext'
import type { Exercise } from '../lib/types'

/** Weight/direction advice for one exercise, shared between the advice banner and the guided workout's weight prefill. */
export function useExerciseAdvice(exercise: Exercise) {
  const { user, sheetsReady } = useAuth()
  const [advice, setAdvice] = useState<Advice | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !sheetsReady) return
    let cancelled = false
    setLoading(true)

    async function loadAdvice() {
      const history = await fetchExerciseHistory(exercise.id)
      if (cancelled) return
      setAdvice(
        adviseNextSession(
          {
            repRangeMin: exercise.rep_range_min,
            repRangeMax: exercise.rep_range_max,
            targetRirMin: exercise.target_rir_min,
            targetRirMax: exercise.target_rir_max,
            kind: exercise.kind,
          },
          history,
        ),
      )
      setLoading(false)
    }

    loadAdvice()
    return () => {
      cancelled = true
    }
  }, [exercise, user, sheetsReady])

  return { advice, loading }
}
