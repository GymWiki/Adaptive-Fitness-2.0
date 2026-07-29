import { useEffect, useState } from 'react'
import { adviseNextSession } from '../lib/adaptiveAdvice'
import type { Advice } from '../lib/adaptiveAdvice'
import { fetchExerciseHistory } from '../lib/fetchExerciseHistory'
import { useAuth } from '../contexts/AuthContext'
import type { Exercise } from '../lib/types'

type Props = {
  exercise: Exercise
}

const TONE_CLASSES = {
  omhoog: 'bg-accent/15 text-accent',
  omlaag: 'bg-warning/15 text-warning',
  gelijk: 'bg-surface-2 text-ink-dim',
  geen_historie: 'bg-surface-2 text-ink-dim',
} as const

// Color is never the only signal — an arrow/icon carries the same meaning.
const TONE_ICON = {
  omhoog: '↑',
  omlaag: '↓',
  gelijk: '→',
  geen_historie: '＋',
} as const

export function ExerciseAdvice({ exercise }: Props) {
  const { user } = useAuth()
  const [advice, setAdvice] = useState<Advice | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    async function loadAdvice() {
      if (!user) return
      const history = await fetchExerciseHistory(user.id, exercise.id)
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
  }, [exercise, user])

  if (loading) {
    return <div className="mt-2 h-8 animate-pulse rounded-lg bg-surface-2" />
  }
  if (!advice) return null

  return (
    <div
      className={`mt-2 flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs ${TONE_CLASSES[advice.advies]}`}
    >
      <span aria-hidden>{TONE_ICON[advice.advies]}</span>
      {advice.gewicht !== null && <span className="font-semibold">{advice.gewicht} kg —</span>}
      {advice.reden}
    </div>
  )
}
