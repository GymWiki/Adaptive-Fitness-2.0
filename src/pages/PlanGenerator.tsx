import { useState } from 'react'
import { generateProgram } from '../lib/programGenerator'
import type { Equipment, ExperienceLevel, WeekProgram } from '../lib/programGenerator'
import { EQUIPMENT_LABELS, EXPERIENCE_LABELS, FOCUS_LABELS } from '../lib/labels'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Select } from '../components/ui/Input'

export function PlanGenerator() {
  const [daysPerWeek, setDaysPerWeek] = useState(4)
  const [equipment, setEquipment] = useState<Equipment>('full_gym')
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('intermediate')
  const [program, setProgram] = useState<WeekProgram | null>(null)

  function handleGenerate() {
    setProgram(generateProgram(daysPerWeek, equipment, experienceLevel))
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-display text-2xl font-bold">Schema genereren</h1>
      <p className="mt-1 text-sm text-ink-dim">
        Wetenschappelijk onderbouwd trainingsschema op basis van je dagen, apparatuur en ervaring.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink-dim">
          Dagen per week
          <Select value={daysPerWeek} onChange={(e) => setDaysPerWeek(Number(e.target.value))}>
            {[2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink-dim">
          Apparatuur
          <Select value={equipment} onChange={(e) => setEquipment(e.target.value as Equipment)}>
            {(Object.keys(EQUIPMENT_LABELS) as Equipment[]).map((key) => (
              <option key={key} value={key}>
                {EQUIPMENT_LABELS[key]}
              </option>
            ))}
          </Select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink-dim">
          Ervaring
          <Select
            value={experienceLevel}
            onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel)}
          >
            {(Object.keys(EXPERIENCE_LABELS) as ExperienceLevel[]).map((key) => (
              <option key={key} value={key}>
                {EXPERIENCE_LABELS[key]}
              </option>
            ))}
          </Select>
        </label>
      </div>

      <Button onClick={handleGenerate} fullWidth className="mt-6">
        Genereer schema
      </Button>

      {program && (
        <div className="mt-8 flex flex-col gap-4">
          {program.week.map((day, index) => (
            <Card key={index}>
              <p className="text-sm font-semibold text-ink-dim">Dag {index + 1}</p>
              {day.type === 'rest' ? (
                <p className="mt-1 font-display font-bold text-ink">Rustdag</p>
              ) : (
                <>
                  <p className="mt-1 font-display font-bold text-ink">
                    {FOCUS_LABELS[day.focus]}
                  </p>
                  <p className="mt-1 text-xs text-ink-faint">{day.warmup}</p>
                  <ul className="mt-3 flex flex-col gap-2">
                    {day.exercises.map((exercise, exerciseIndex) => (
                      <li
                        key={exerciseIndex}
                        className="flex justify-between text-sm text-ink-dim"
                      >
                        <span className="text-ink">{exercise.name}</span>
                        <span>
                          {exercise.sets} × {exercise.reps} · rust {exercise.restSeconds}s
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </Card>
          ))}

          <div className="rounded-2xl border border-dashed border-border p-4 text-xs text-ink-faint">
            <p>Deload elke {program.deloadEveryWeeks} weken.</p>
            <ul className="mt-2 list-disc pl-4">
              {program.notes.map((note, index) => (
                <li key={index}>{note}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
