import { useState } from 'react'
import { generateProgram } from '../lib/programGenerator'
import type { DayFocus, Equipment, ExperienceLevel, WeekProgram } from '../lib/programGenerator'

const EQUIPMENT_LABELS: Record<Equipment, string> = {
  full_gym: 'Volledige sportschool',
  home_dumbbells: 'Thuis met dumbbells',
  bodyweight_only: 'Alleen lichaamsgewicht',
}

const EXPERIENCE_LABELS: Record<ExperienceLevel, string> = {
  beginner: 'Beginner (< 6 maanden)',
  intermediate: 'Intermediate (6+ maanden)',
  advanced: 'Advanced (1+ jaar, consistent)',
}

const FOCUS_LABELS: Record<DayFocus, string> = {
  full_body: 'Full Body',
  upper: 'Upper Body',
  lower: 'Lower Body',
  push: 'Push',
  pull: 'Pull',
  legs: 'Legs',
}

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
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Schema genereren</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        Wetenschappelijk onderbouwd trainingsschema op basis van je dagen, apparatuur en ervaring.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700 dark:text-slate-300">
          Dagen per week
          <select
            value={daysPerWeek}
            onChange={(e) => setDaysPerWeek(Number(e.target.value))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            {[2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700 dark:text-slate-300">
          Apparatuur
          <select
            value={equipment}
            onChange={(e) => setEquipment(e.target.value as Equipment)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            {(Object.keys(EQUIPMENT_LABELS) as Equipment[]).map((key) => (
              <option key={key} value={key}>
                {EQUIPMENT_LABELS[key]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700 dark:text-slate-300">
          Ervaring
          <select
            value={experienceLevel}
            onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            {(Object.keys(EXPERIENCE_LABELS) as ExperienceLevel[]).map((key) => (
              <option key={key} value={key}>
                {EXPERIENCE_LABELS[key]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <button
        type="button"
        onClick={handleGenerate}
        className="mt-6 w-full rounded-lg bg-brand-600 px-4 py-3 text-sm font-medium text-white hover:bg-brand-700"
      >
        Genereer schema
      </button>

      {program && (
        <div className="mt-8 flex flex-col gap-4">
          {program.week.map((day, index) => (
            <div
              key={index}
              className="rounded-xl border border-slate-200 p-4 dark:border-slate-800"
            >
              <p className="text-sm font-medium text-slate-500">Dag {index + 1}</p>
              {day.type === 'rest' ? (
                <p className="mt-1 font-semibold text-slate-900 dark:text-white">Rustdag</p>
              ) : (
                <>
                  <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                    {FOCUS_LABELS[day.focus]}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{day.warmup}</p>
                  <ul className="mt-3 flex flex-col gap-2">
                    {day.exercises.map((exercise, exerciseIndex) => (
                      <li
                        key={exerciseIndex}
                        className="flex justify-between text-sm text-slate-700 dark:text-slate-300"
                      >
                        <span>{exercise.name}</span>
                        <span className="text-slate-500">
                          {exercise.sets} × {exercise.reps} · rust {exercise.restSeconds}s
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          ))}

          <div className="rounded-xl border border-dashed border-slate-300 p-4 text-xs text-slate-500 dark:border-slate-700">
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
