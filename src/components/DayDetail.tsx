import { useNavigate } from 'react-router-dom'
import type { DaySlot } from '../lib/programGenerator'
import { Button } from './ui/Button'
import { Card } from './ui/Card'

type Props = {
  day: DaySlot
  isDone: boolean
}

export function DayDetail({ day, isDone }: Props) {
  const navigate = useNavigate()

  if (day.type === 'rest') {
    return (
      <Card className="text-center">
        <p className="font-display text-lg font-bold text-ink">Rustdag</p>
        <p className="mt-1 text-sm text-ink-dim">
          Geen training vandaag — je spieren herstellen en groeien juist nu.
        </p>
      </Card>
    )
  }

  if (day.type === 'active_recovery') {
    return (
      <Card>
        <p className="font-display text-lg font-bold text-ink">Actieve hersteldag</p>
        <p className="mt-1 text-sm text-ink-dim">{day.description}</p>
      </Card>
    )
  }

  if (day.type === 'cardio') {
    return (
      <Card>
        <div className="flex items-center justify-between">
          <p className="font-display text-lg font-bold text-ink">{day.label}</p>
          <span className="rounded-lg bg-surface-2 px-2 py-1 text-xs font-semibold text-ink-dim">
            {day.durationMinutes} min
          </span>
        </div>
        <p className="mt-1 text-sm text-ink-dim">{day.description}</p>
      </Card>
    )
  }

  return (
    <Card>
      <p className="font-display text-lg font-bold text-ink">{day.label}</p>
      <ul className="mt-4 flex flex-col gap-2">
        {day.exercises.map((exercise, index) => (
          <li key={index} className="text-sm">
            <div className="flex justify-between">
              <span className="text-ink">{exercise.name}</span>
              <span className="text-ink-dim">
                {exercise.sets} × {exercise.reps} · {exercise.rir}
              </span>
            </div>
            {exercise.note && <p className="mt-0.5 text-xs text-ink-faint">{exercise.note}</p>}
          </li>
        ))}
      </ul>

      {day.cardioAddOn && (
        <p className="mt-3 rounded-lg bg-surface-2 px-3 py-2 text-xs text-ink-dim">
          + Cardio ({day.cardioAddOn.durationMinutes} min): {day.cardioAddOn.description}
        </p>
      )}

      <Button
        fullWidth
        variant={isDone ? 'secondary' : 'primary'}
        className="mt-5"
        onClick={() =>
          isDone
            ? navigate('/app/history')
            : navigate('/app/log', { state: { workoutName: day.label } })
        }
      >
        {isDone ? 'Bekijk resultaat' : 'Start training'}
      </Button>
    </Card>
  )
}
