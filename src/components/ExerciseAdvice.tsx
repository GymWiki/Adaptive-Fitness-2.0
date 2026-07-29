import { useEffect, useState } from 'react'
import { adviseNextSession } from '../lib/adaptiveAdvice'
import type { Advice } from '../lib/adaptiveAdvice'
import { fetchExerciseHistory } from '../lib/fetchExerciseHistory'
import { useAuth } from '../contexts/AuthContext'
import type { Exercise } from '../lib/types'

type Props = {
  exercise: Exercise
}

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

  if (loading) return null
  if (!advice) return null

  const badgeClasses =
    advice.advies === 'omhoog'
      ? 'bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-300'
      : advice.advies === 'omlaag'
        ? 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'

  return (
    <div className={`mt-2 rounded-lg px-3 py-2 text-xs ${badgeClasses}`}>
      {advice.gewicht !== null && (
        <span className="font-semibold">{advice.gewicht} kg — </span>
      )}
      {advice.reden}
    </div>
  )
}
