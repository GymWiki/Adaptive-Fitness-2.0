import type { CombinedWeekProgram } from '../lib/combinedSchedule/generateCombinedSchedule'
import { Card } from './ui/Card'

/** A plain, no-CTA list of all 7 days — used by Onboarding's preview and PlanGenerator. */
export function CombinedWeekList({ program }: { program: CombinedWeekProgram }) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="font-display text-lg font-bold text-ink">{program.strengthProgram.templateName}</h2>
        <p className="text-xs text-ink-faint">Bron: {program.strengthProgram.source}</p>
        {program.runningPlan && (
          <p className="mt-1 text-xs text-ink-faint">
            Hardlopen: {program.runningPlan.weekLabel} · {program.runningPlan.totalDistanceKm} km deze week
          </p>
        )}
      </div>

      {program.week.map((slot, index) => (
        <Card key={index}>
          <p className="text-sm font-semibold text-ink-dim">Dag {index + 1}</p>

          {slot.type === 'rest' && <p className="mt-1 font-display font-bold text-ink">Rustdag</p>}

          {slot.type === 'strength' && (
            <>
              <p className="mt-1 font-display font-bold text-ink">{slot.day.label}</p>
              <ul className="mt-3 flex flex-col gap-2">
                {slot.day.exercises.map((exercise, exerciseIndex) => (
                  <li key={exerciseIndex} className="text-sm text-ink-dim">
                    <div className="flex justify-between">
                      <span className="text-ink">{exercise.name}</span>
                      <span>
                        {exercise.sets} × {exercise.reps} · {exercise.rir}
                      </span>
                    </div>
                    {exercise.note && <p className="mt-0.5 text-xs text-ink-faint">{exercise.note}</p>}
                  </li>
                ))}
              </ul>
            </>
          )}

          {slot.type === 'running' && (
            <>
              <p className="mt-1 font-display font-bold text-ink">{slot.session.label}</p>
              <p className="mt-1 text-sm text-ink-dim">{slot.session.distanceKm} km</p>
              {slot.session.description && (
                <p className="mt-1 text-xs text-ink-faint">{slot.session.description}</p>
              )}
            </>
          )}
        </Card>
      ))}

      {program.runningPlan && program.runningPlan.notes.length > 0 && (
        <div className="rounded-2xl border border-dashed border-border p-4 text-xs text-ink-faint">
          <ul className="list-disc pl-4">
            {program.runningPlan.notes.map((note, index) => (
              <li key={index}>{note}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
