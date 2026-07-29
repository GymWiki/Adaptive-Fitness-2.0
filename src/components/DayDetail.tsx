import { useNavigate } from 'react-router-dom'
import type { DaySlot, TemplateDayKind } from '../lib/programGenerator'
import { Button } from './ui/Button'
import { Card } from './ui/Card'

const KIND_RIR_LABEL: Record<TemplateDayKind, string> = {
  hit: 'Tot spierfalen (RIR 0)',
  power: 'RIR 1-2',
  hypertrophy: 'RIR 2-3',
  standard: 'RIR 2-3',
}

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

  return (
    <Card>
      <div className="flex items-center justify-between">
        <p className="font-display text-lg font-bold text-ink">{day.label}</p>
        <span className="rounded-lg bg-surface-2 px-2 py-1 text-xs font-semibold text-ink-dim">
          {KIND_RIR_LABEL[day.kind]}
        </span>
      </div>
      <ul className="mt-4 flex flex-col gap-2">
        {day.exercises.map((exercise, index) => (
          <li key={index} className="text-sm">
            <div className="flex justify-between">
              <span className="text-ink">{exercise.name}</span>
              <span className="text-ink-dim">
                {exercise.sets} × {exercise.reps}
              </span>
            </div>
            {exercise.note && <p className="mt-0.5 text-xs text-ink-faint">{exercise.note}</p>}
          </li>
        ))}
      </ul>

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
