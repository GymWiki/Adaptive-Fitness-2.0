import { useState, type ReactNode } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { supabase } from '../lib/supabase'
import { generateProgram } from '../lib/programGenerator'
import type { Equipment, ExperienceLevel } from '../lib/programGenerator'
import { EQUIPMENT_LABELS, EXPERIENCE_LABELS, summarizeSplit } from '../lib/labels'
import { Button } from '../components/ui/Button'
import { Input, Select } from '../components/ui/Input'
import { ErrorState, Spinner } from '../components/ui/States'

const TOTAL_STEPS = 4

type FormState = {
  displayName: string
  weightKg: string
  heightCm: string
  gender: 'male' | 'female' | 'other' | ''
  birthYear: string
  daysPerWeek: number
  equipment: Equipment
  experienceLevel: ExperienceLevel
}

const initialForm: FormState = {
  displayName: '',
  weightKg: '',
  heightCm: '',
  gender: '',
  birthYear: '',
  daysPerWeek: 3,
  equipment: 'full_gym',
  experienceLevel: 'beginner',
}

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

export function Onboarding() {
  const { user } = useAuth()
  const { profile, loading } = useProfile()
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
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

  function goNext() {
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1)
    } else {
      setPhase('result')
    }
  }

  function goBack() {
    setStep((s) => Math.max(1, s - 1))
  }

  async function handleFinish() {
    if (!user) return
    setSaving(true)
    setError('')

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        display_name: form.displayName.trim() || null,
        weight_kg: form.weightKg ? Number(form.weightKg) : null,
        height_cm: form.heightCm ? Number(form.heightCm) : null,
        gender: form.gender || null,
        birth_year: form.birthYear ? Number(form.birthYear) : null,
        days_per_week: form.daysPerWeek,
        equipment: form.equipment,
        experience_level: form.experienceLevel,
        onboarding_completed: true,
      })
      .eq('id', user.id)

    if (updateError) {
      setError('Opslaan is mislukt. Probeer opnieuw.')
      setSaving(false)
      return
    }

    navigate('/app', { replace: true })
  }

  if (phase === 'result') {
    const program = generateProgram(form.daysPerWeek, form.equipment, form.experienceLevel)
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16 text-center">
        <h1 className="font-display text-2xl font-bold">Klaar!</h1>
        <p className="mt-4 text-ink-dim">
          Jouw schema: <strong className="text-ink">{form.daysPerWeek} dagen/week</strong>,{' '}
          {summarizeSplit(program)}
        </p>
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
        Stap {step} van {TOTAL_STEPS}
      </p>
      <div className="mt-3 flex gap-1.5">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${i < step ? 'bg-accent' : 'bg-surface-2'}`}
          />
        ))}
      </div>

      <div className="mt-10">
        {step === 1 && (
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

        {step === 2 && (
          <div className="flex flex-col gap-3">
            <h1 className="font-display text-xl font-bold">
              Hoeveel dagen per week wil je trainen?
            </h1>
            <div className="grid grid-cols-5 gap-2">
              {[2, 3, 4, 5, 6].map((n) => (
                <OptionButton
                  key={n}
                  selected={form.daysPerWeek === n}
                  onClick={() => update('daysPerWeek', n)}
                >
                  <span className="block text-center">{n}</span>
                </OptionButton>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-3">
            <h1 className="font-display text-xl font-bold">Welke apparatuur heb je?</h1>
            {(Object.keys(EQUIPMENT_LABELS) as Equipment[]).map((key) => (
              <OptionButton
                key={key}
                selected={form.equipment === key}
                onClick={() => update('equipment', key)}
              >
                {EQUIPMENT_LABELS[key]}
              </OptionButton>
            ))}
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-3">
            <h1 className="font-display text-xl font-bold">Wat is je trainingservaring?</h1>
            {(Object.keys(EXPERIENCE_LABELS) as ExperienceLevel[]).map((key) => (
              <OptionButton
                key={key}
                selected={form.experienceLevel === key}
                onClick={() => update('experienceLevel', key)}
              >
                {EXPERIENCE_LABELS[key]}
              </OptionButton>
            ))}
          </div>
        )}
      </div>

      <div className="mt-10 flex gap-2">
        {step > 1 && (
          <Button variant="secondary" onClick={goBack}>
            Vorige
          </Button>
        )}
        <Button onClick={goNext} fullWidth>
          {step < TOTAL_STEPS ? 'Volgende' : 'Bekijk mijn schema'}
        </Button>
      </div>
    </div>
  )
}
