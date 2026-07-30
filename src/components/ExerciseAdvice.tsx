import { useExerciseAdvice } from '../hooks/useExerciseAdvice'
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
  const { advice, loading } = useExerciseAdvice(exercise)

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
