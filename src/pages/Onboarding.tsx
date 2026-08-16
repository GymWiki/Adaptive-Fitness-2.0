import { useState, type ReactNode } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { updateProfile } from '../lib/sheets/profiles'
import { generateCombinedSchedule } from '../lib/combinedSchedule/generateCombinedSchedule'
import type {
  FocusSpecifics,
  HybridRatio,
  PrimaryFocus,
  RaceDistance,
  RunningExperienceLevel,
  SessionDuration,
  StrengthFocusZone,
  Weekday,
} from '../lib/combinedSchedule/types'
import type { Equipment, ExperienceLevel } from '../lib/programGenerator'
import {
  EQUIPMENT_LABELS,
  EXPERIENCE_LABELS,
  HYBRID_RATIO_LABELS,
  PRIMARY_FOCUS_DESCRIPTIONS,
  PRIMARY_FOCUS_LABELS,
  RACE_DISTANCE_LABELS,
  RUNNING_EXPERIENCE_LABELS,
  SESSION_DURATION_LABELS,
  STRENGTH_FOCUS_ZONE_LABELS,
  WEEKDAY_LABELS,
} from '../lib/labels'
import { Button } from '../components/ui/Button'
import { Input, Select } from '../components/ui/Input'
import { ErrorState, Spinner } from '../components/ui/States'
import { CombinedWeekList } from '../components/CombinedWeekList'

type StepId = 'about' | 'focus' | 'specifics' | 'practical'

function stepsFor(primaryFocus: PrimaryFocus | ''): StepId[] {
  const steps: StepId[] = ['about', 'focus']
  if (primaryFocus && primaryFocus !== 'general_health') steps.push('specifics')
  steps.push('practical')
  return steps
}

type FormState = {
  displayName: string
  weightKg: string
  heightCm: string
  gender: 'male' | 'female' | 'other' | ''
  birthYear: string
  primaryFocus: PrimaryFocus | ''
  strengthFocusZone: StrengthFocusZone | ''
  hybridRatio: HybridRatio | ''
  raceDistance: RaceDistance | ''
  raceDistanceCustom: string
  raceDate: string
  availableDays: Weekday[]
  sessionDuration: SessionDuration | ''
  runningExperienceLevel: RunningExperienceLevel | ''
  experienceLevel: ExperienceLevel | ''
  equipment: Equipment | ''
}

const initialForm: FormState = {
  displayName: '',
  weightKg: '',
  heightCm: '',
  gender: '',
  birthYear: '',
  primaryFocus: '',
  strengthFocusZone: '',
  hybridRatio: '',
  raceDistance: '',
  raceDistanceCustom: '',
  raceDate: '',
  availableDays: [],
  sessionDuration: '',
  runningExperienceLevel: '',
  experienceLevel: '',
  equipment: '',
}

const WEEKDAYS: Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

function OptionButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-14 rounded-xl border px-4 text-left text-[15px] font-semibold transition-colors ${
        selected
          ? 'border-accent bg-accent text-accent-ink'
          : 'border-border bg-surface-2 text-ink hover:border-border-strong'
      }`}
    >
      {children}
    </button>
  )
}

function buildFocusSpecifics(form: FormState): FocusSpecifics | null {
  if (form.primaryFocus === 'strength') {
    if (!form.strengthFocusZone) return null
    return { primaryFocus: 'strength', strengthFocusZone: form.strengthFocusZone }
  }
  if (form.primaryFocus === 'hybrid') {
    if (!form.hybridRatio) return null
    return { primaryFocus: 'hybrid', hybridRatio: form.hybridRatio }
  }
  if (form.primaryFocus === 'running') {
    if (!form.raceDistance) return null
    return {
      primaryFocus: 'running',
      raceDistance: form.raceDistance,
      raceDistanceCustom: form.raceDistance === 'custom' ? form.raceDistanceCustom.trim() || null : null,
      raceDate: form.raceDate || null,
    }
  }
  if (form.primaryFocus === 'general_health') {
    return { primaryFocus: 'general_health' }
  }
  return null
}

function canProceed(stepId: StepId, form: FormState): boolean {
  if (stepId === 'focus') return form.primaryFocus !== ''
  if (stepId === 'specifics') {
    if (form.primaryFocus === 'strength') return form.strengthFocusZone !== ''
    if (form.primaryFocus === 'hybrid') return form.hybridRatio !== ''
    if (form.primaryFocus === 'running') {
      return form.raceDistance !== '' && (form.raceDistance !== 'custom' || form.raceDistanceCustom.trim() !== '')
    }
    return true
  }
  if (stepId === 'practical') {
    return (
      form.availableDays.length >= 2 &&
      form.availableDays.length <= 6 &&
      form.sessionDuration !== '' &&
      form.runningExperienceLevel !== '' &&
      form.experienceLevel !== '' &&
      form.equipment !== ''
    )
  }
  return true
}

export function Onboarding() {
  const { user } = useAuth()
  const { profile, loading } = useProfile()
  const navigate = useNavigate()

  const [step, setStep] = useState(0)
  const [phase, setPhase] = useState<'steps' | 'result'>('steps')
  const [form, setForm] = useState<FormState>(initialForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  if (loading) return <Spinner />

  if (profile?.onboarding_completed) {
    return <Navigate to="/app" replace />
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function toggleDay(day: Weekday) {
    setForm((prev) => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter((d) => d !== day)
        : [...prev.availableDays, day],
    }))
  }

  const steps = stepsFor(form.primaryFocus)
  const currentStepId = steps[step]

  function goNext() {
    if (step < steps.length - 1) {
      setStep((s) => s + 1)
    } else {
      setPhase('result')
    }
  }

  function goBack() {
    setStep((s) => Math.max(0, s - 1))
  }

  async function handleFinish() {
    if (!user) return
    setSaving(true)
    setError('')

    try {
      await updateProfile(user.id, {
        display_name: form.displayName.trim() || null,
        weight_kg: form.weightKg ? Number(form.weightKg) : null,
        height_cm: form.heightCm ? Number(form.heightCm) : null,
        gender: form.gender || null,
        birth_year: form.birthYear ? Number(form.birthYear) : null,
        primary_focus: form.primaryFocus || null,
        strength_focus_zone: form.strengthFocusZone || null,
        hybrid_ratio: form.hybridRatio || null,
        target_race_distance: form.raceDistance || null,
        target_race_distance_custom: form.raceDistanceCustom.trim() || null,
        target_race_date: form.raceDate || null,
        available_days: form.availableDays,
        session_duration: form.sessionDuration || null,
        running_experience_level: form.runningExperienceLevel || null,
        equipment: form.equipment || null,
        experience_level: form.experienceLevel || null,
        onboarding_completed: true,
      })
    } catch {
      setError('Opslaan is mislukt. Probeer opnieuw.')
      setSaving(false)
      return
    }

    navigate('/app', { replace: true })
  }

  if (phase === 'result') {
    const specifics = buildFocusSpecifics(form)
    const program =
      specifics && form.equipment && form.experienceLevel && form.runningExperienceLevel
        ? generateCombinedSchedule(
            form.primaryFocus as PrimaryFocus,
            specifics,
            form.availableDays,
            form.equipment,
            form.experienceLevel,
            form.runningExperienceLevel,
            new Date(),
          )
        : null

    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-center font-display text-2xl font-bold">Klaar!</h1>
        <p className="mt-2 text-center text-ink-dim">Jouw schema, op basis van je antwoorden:</p>

        {program && (
          <div className="mt-6">
            <CombinedWeekList program={program} />
          </div>
        )}

        {error && (
          <div className="mt-4">
            <ErrorState message={error} />
          </div>
        )}
        <Button onClick={handleFinish} disabled={saving} fullWidth className="mt-8">
          {saving ? 'Opslaan...' : 'Naar dashboard'}
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <p className="text-center text-sm font-semibold text-ink-dim">
        Stap {step + 1} van {steps.length}
      </p>
      <div className="mt-3 flex gap-1.5">
        {steps.map((id, i) => (
          <div
            key={id}
            className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-accent' : 'bg-surface-2'}`}
          />
        ))}
      </div>

      <div className="mt-10">
        {currentStepId === 'about' && (
          <div className="flex flex-col gap-3">
            <h1 className="font-display text-xl font-bold">Over jou</h1>
            <p className="text-sm text-ink-dim">Allemaal optioneel — vul in wat je wilt.</p>
            <Input
              value={form.displayName}
              onChange={(e) => update('displayName', e.target.value)}
              placeholder="Naam"
              className="mt-2"
            />
            <div className="flex gap-2">
              <Input
                type="number"
                inputMode="decimal"
                value={form.weightKg}
                onChange={(e) => update('weightKg', e.target.value)}
                placeholder="Gewicht (kg)"
              />
              <Input
                type="number"
                inputMode="decimal"
                value={form.heightCm}
                onChange={(e) => update('heightCm', e.target.value)}
                placeholder="Lengte (cm)"
              />
            </div>
            <div className="flex gap-2">
              <Select
                value={form.gender}
                onChange={(e) => update('gender', e.target.value as FormState['gender'])}
              >
                <option value="">Geslacht</option>
                <option value="male">Man</option>
                <option value="female">Vrouw</option>
                <option value="other">Anders</option>
              </Select>
              <Input
                type="number"
                inputMode="numeric"
                value={form.birthYear}
                onChange={(e) => update('birthYear', e.target.value)}
                placeholder="Geboortejaar"
              />
            </div>
          </div>
        )}

        {currentStepId === 'focus' && (
          <div className="flex flex-col gap-3">
            <h1 className="font-display text-xl font-bold">Wat is je primaire focus?</h1>
            <p className="text-sm text-ink-dim">
              Dit is het dominante anker — het voorkomt conflicterende trainingsprikkels.
            </p>
            {(Object.keys(PRIMARY_FOCUS_LABELS) as PrimaryFocus[]).map((key) => (
              <OptionButton
                key={key}
                selected={form.primaryFocus === key}
                onClick={() => update('primaryFocus', key)}
              >
                <span className="block">{PRIMARY_FOCUS_LABELS[key]}</span>
                <span className="mt-0.5 block text-xs font-normal text-ink-dim">
                  {PRIMARY_FOCUS_DESCRIPTIONS[key]}
                </span>
              </OptionButton>
            ))}
          </div>
        )}

        {currentStepId === 'specifics' && form.primaryFocus === 'strength' && (
          <div className="flex flex-col gap-3">
            <h1 className="font-display text-xl font-bold">Focuszone</h1>
            {(Object.keys(STRENGTH_FOCUS_ZONE_LABELS) as StrengthFocusZone[]).map((key) => (
              <OptionButton
                key={key}
                selected={form.strengthFocusZone === key}
                onClick={() => update('strengthFocusZone', key)}
              >
                {STRENGTH_FOCUS_ZONE_LABELS[key]}
              </OptionButton>
            ))}
          </div>
        )}

        {currentStepId === 'specifics' && form.primaryFocus === 'hybrid' && (
          <div className="flex flex-col gap-3">
            <h1 className="font-display text-xl font-bold">Gewenste verhouding kracht : hardlopen</h1>
            {(Object.keys(HYBRID_RATIO_LABELS) as HybridRatio[]).map((key) => (
              <OptionButton
                key={key}
                selected={form.hybridRatio === key}
                onClick={() => update('hybridRatio', key)}
              >
                {HYBRID_RATIO_LABELS[key]}
              </OptionButton>
            ))}
          </div>
        )}

        {currentStepId === 'specifics' && form.primaryFocus === 'running' && (
          <div className="flex flex-col gap-3">
            <h1 className="font-display text-xl font-bold">Doelafstand</h1>
            {(Object.keys(RACE_DISTANCE_LABELS) as RaceDistance[]).map((key) => (
              <OptionButton
                key={key}
                selected={form.raceDistance === key}
                onClick={() => update('raceDistance', key)}
              >
                {RACE_DISTANCE_LABELS[key]}
              </OptionButton>
            ))}
            {form.raceDistance === 'custom' && (
              <Input
                value={form.raceDistanceCustom}
                onChange={(e) => update('raceDistanceCustom', e.target.value)}
                placeholder="Welke afstand?"
              />
            )}
            <label className="mt-2 flex flex-col gap-1.5 text-sm font-semibold text-ink-dim">
              Streefdatum (optioneel)
              <Input
                type="date"
                value={form.raceDate}
                onChange={(e) => update('raceDate', e.target.value)}
              />
            </label>
          </div>
        )}

        {currentStepId === 'practical' && (
          <div className="flex flex-col gap-5">
            <h1 className="font-display text-xl font-bold">Praktische randvoorwaarden</h1>

            <div>
              <p className="text-sm font-semibold text-ink-dim">
                Beschikbare dagen (min. 2, max. 6)
              </p>
              <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-7">
                {WEEKDAYS.map((day) => (
                  <OptionButton
                    key={day}
                    selected={form.availableDays.includes(day)}
                    onClick={() => toggleDay(day)}
                  >
                    <span className="block text-center">{WEEKDAY_LABELS[day]}</span>
                  </OptionButton>
                ))}
              </div>
            </div>

            <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink-dim">
              Sessieduur
              <Select
                value={form.sessionDuration}
                onChange={(e) => update('sessionDuration', e.target.value as SessionDuration)}
              >
                <option value="" disabled>
                  Kies een duur
                </option>
                {(Object.keys(SESSION_DURATION_LABELS) as SessionDuration[]).map((key) => (
                  <option key={key} value={key}>
                    {SESSION_DURATION_LABELS[key]}
                  </option>
                ))}
              </Select>
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink-dim">
              Ervaringsniveau hardlopen
              <Select
                value={form.runningExperienceLevel}
                onChange={(e) => update('runningExperienceLevel', e.target.value as RunningExperienceLevel)}
              >
                <option value="" disabled>
                  Kies je niveau
                </option>
                {(Object.keys(RUNNING_EXPERIENCE_LABELS) as RunningExperienceLevel[]).map((key) => (
                  <option key={key} value={key}>
                    {RUNNING_EXPERIENCE_LABELS[key]}
                  </option>
                ))}
              </Select>
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink-dim">
              Ervaringsniveau kracht
              <Select
                value={form.experienceLevel}
                onChange={(e) => update('experienceLevel', e.target.value as ExperienceLevel)}
              >
                <option value="" disabled>
                  Kies je niveau
                </option>
                {(Object.keys(EXPERIENCE_LABELS) as ExperienceLevel[]).map((key) => (
                  <option key={key} value={key}>
                    {EXPERIENCE_LABELS[key]}
                  </option>
                ))}
              </Select>
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink-dim">
              Apparatuur
              <Select value={form.equipment} onChange={(e) => update('equipment', e.target.value as Equipment)}>
                <option value="" disabled>
                  Kies je apparatuur
                </option>
                {(Object.keys(EQUIPMENT_LABELS) as Equipment[]).map((key) => (
                  <option key={key} value={key}>
                    {EQUIPMENT_LABELS[key]}
                  </option>
                ))}
              </Select>
            </label>
          </div>
        )}
      </div>

      <div className="mt-10 flex gap-2">
        {step > 0 && (
          <Button variant="secondary" onClick={goBack}>
            Vorige
          </Button>
        )}
        <Button onClick={goNext} disabled={!canProceed(currentStepId, form)} fullWidth>
          {step < steps.length - 1 ? 'Volgende' : 'Bekijk mijn schema'}
        </Button>
      </div>
    </div>
  )
}
