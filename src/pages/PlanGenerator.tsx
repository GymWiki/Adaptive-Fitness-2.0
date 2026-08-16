import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { generateProgram } from '../lib/programGenerator'
import type { Equipment, ExperienceLevel, Goal, WeekProgram } from '../lib/programGenerator'
import { EQUIPMENT_LABELS, EXPERIENCE_LABELS, GOAL_LABELS } from '../lib/labels'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Select } from '../components/ui/Input'
import { ErrorState } from '../components/ui/States'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { updateProfile } from '../lib/sheets/profiles'

type GeneratedParams = {
  daysPerWeek: number
  equipment: Equipment
  experienceLevel: ExperienceLevel
  goal: Goal
}

export function PlanGenerator() {
  const { user } = useAuth()
  const { profile, loading: profileLoading } = useProfile()

  const navigate = useNavigate()
  const [daysPerWeek, setDaysPerWeek] = useState(4)
  const [equipment, setEquipment] = useState<Equipment>('full_gym')
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('intermediate')
  const [goal, setGoal] = useState<Goal>('hypertrophy')
  const [program, setProgram] = useState<WeekProgram | null>(null)
  const [generatedParams, setGeneratedParams] = useState<GeneratedParams | null>(null)

  const [confirmingAdopt, setConfirmingAdopt] = useState(false)
  const [adopting, setAdopting] = useState(false)
  const [adopted, setAdopted] = useState(false)
  const [adoptError, setAdoptError] = useState('')

  // Pre-fill the form with the user's current active schema, if they have one.
  useEffect(() => {
    if (profile?.days_per_week && profile.equipment && profile.experience_level && profile.goal) {
      setDaysPerWeek(profile.days_per_week)
      setEquipment(profile.equipment)
      setExperienceLevel(profile.experience_level)
      setGoal(profile.goal)
    }
  }, [profile])

  function handleGenerate() {
    setProgram(generateProgram(daysPerWeek, equipment, experienceLevel, goal))
    setGeneratedParams({ daysPerWeek, equipment, experienceLevel, goal })
    setConfirmingAdopt(false)
    setAdopted(false)
    setAdoptError('')
  }

  const isActiveSchema =
    !!profile &&
    !!generatedParams &&
    profile.days_per_week === generatedParams.daysPerWeek &&
    profile.equipment === generatedParams.equipment &&
    profile.experience_level === generatedParams.experienceLevel &&
    profile.goal === generatedParams.goal

  async function handleAdopt() {
    if (!user || !generatedParams) return
    setAdopting(true)
    setAdoptError('')

    try {
      await updateProfile(user.id, {
        days_per_week: generatedParams.daysPerWeek,
        equipment: generatedParams.equipment,
        experience_level: generatedParams.experienceLevel,
        goal: generatedParams.goal,
      })
    } catch {
      setAdoptError('Overnemen is mislukt. Probeer opnieuw.')
      setAdopting(false)
      return
    }

    setAdopting(false)
    setConfirmingAdopt(false)
    setAdopted(true)
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-display text-2xl font-bold">Schema genereren</h1>
      <p className="mt-1 text-sm text-ink-dim">
        Vaste, wetenschappelijk onderbouwde trainingstemplates op basis van je dagen, apparatuur
        en ervaring — je doel bepaalt de reps, RIR, volume en cardio binnen dat schema.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink-dim">
          Doel
          <Select value={goal} onChange={(e) => setGoal(e.target.value as Goal)}>
            {(Object.keys(GOAL_LABELS) as Goal[]).map((key) => (
              <option key={key} value={key}>
                {GOAL_LABELS[key]}
              </option>
            ))}
          </Select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink-dim">
          Dagen per week
          <Select value={daysPerWeek} onChange={(e) => setDaysPerWeek(Number(e.target.value))}>
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
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

      {program && generatedParams && (
        <div className="mt-8 flex flex-col gap-4">
          <div>
            <h2 className="font-display text-lg font-bold text-ink">{program.templateName}</h2>
            <p className="text-xs text-ink-faint">Bron: {program.source}</p>
          </div>

          {!profileLoading && (
            <Card>
              {isActiveSchema ? (
                <p className="text-sm font-semibold text-accent">
                  ✓ Dit is je huidige actieve schema.
                </p>
              ) : adopted ? (
                <p className="text-sm font-semibold text-accent">
                  ✓ Overgenomen! Dit is nu je actieve schema op het dashboard.
                </p>
              ) : confirmingAdopt ? (
                <div>
                  <p className="text-sm text-ink">
                    Dit vervangt je huidige actieve schema op het dashboard. Weet je het zeker?
                  </p>
                  {adoptError && (
                    <div className="mt-3">
                      <ErrorState message={adoptError} />
                    </div>
                  )}
                  <div className="mt-3 flex gap-2">
                    <Button variant="secondary" onClick={() => setConfirmingAdopt(false)}>
                      Annuleren
                    </Button>
                    <Button onClick={handleAdopt} disabled={adopting} fullWidth>
                      {adopting ? 'Bezig...' : 'Ja, vervang mijn schema'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-ink-dim">
                    Nog niet je actieve schema — de dag-slider op je dashboard volgt dit pas als je
                    het overneemt.
                  </p>
                  <Button size="sm" onClick={() => setConfirmingAdopt(true)} className="shrink-0">
                    Neem over
                  </Button>
                </div>
              )}
            </Card>
          )}

          {adopted && (
            <Button variant="secondary" onClick={() => navigate('/app')} fullWidth>
              Naar dashboard
            </Button>
          )}

          {program.experienceWarning && (
            <p className="rounded-lg bg-warning/15 px-3 py-2 text-xs text-warning">
              {program.experienceWarning}
            </p>
          )}
          {program.disclaimer && (
            <p className="rounded-lg bg-surface-2 px-3 py-2 text-xs text-ink-dim">
              {program.disclaimer}
            </p>
          )}

          {program.week.map((day, index) => (
            <Card key={index}>
              <p className="text-sm font-semibold text-ink-dim">Dag {index + 1}</p>
              {day.type === 'rest' && (
                <p className="mt-1 font-display font-bold text-ink">Rustdag</p>
              )}
              {day.type === 'active_recovery' && (
                <>
                  <p className="mt-1 font-display font-bold text-ink">Actieve hersteldag</p>
                  <p className="mt-1 text-xs text-ink-dim">{day.description}</p>
                </>
              )}
              {day.type === 'training' && (
                <>
                  <p className="mt-1 font-display font-bold text-ink">{day.label}</p>
                  <ul className="mt-3 flex flex-col gap-2">
                    {day.exercises.map((exercise, exerciseIndex) => (
                      <li key={exerciseIndex} className="text-sm text-ink-dim">
                        <div className="flex justify-between">
                          <span className="text-ink">{exercise.name}</span>
                          <span>
                            {exercise.sets} × {exercise.reps} · rust {exercise.restSeconds}s
                          </span>
                        </div>
                        {exercise.note && (
                          <p className="mt-0.5 text-xs text-ink-faint">{exercise.note}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </Card>
          ))}

          <div className="rounded-2xl border border-dashed border-border p-4 text-xs text-ink-faint">
            <p className="font-semibold text-ink-dim">Begin elke sessie met 1-2 lichte opbouwsets vóór je werkgewicht.</p>
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
