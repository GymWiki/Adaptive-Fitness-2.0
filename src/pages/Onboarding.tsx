import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { supabase } from '../lib/supabase'
import { generateProgram } from '../lib/programGenerator'
import type { Equipment, ExperienceLevel } from '../lib/programGenerator'
import { EQUIPMENT_LABELS, EXPERIENCE_LABELS, summarizeSplit } from '../lib/labels'

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

export function Onboarding() {
  const { user } = useAuth()
  const { profile, loading } = useProfile()
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [phase, setPhase] = useState<'steps' | 'result'>('steps')
  const [form, setForm] = useState<FormState>(initialForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-slate-500">Laden...</p>
      </div>
    )
  }

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
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Klaar!</h1>
        <p className="mt-4 text-slate-600 dark:text-slate-400">
          Jouw schema: {form.daysPerWeek} dagen/week, {summarizeSplit(program)}
        </p>
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        <button
          type="button"
          onClick={handleFinish}
          disabled={saving}
          className="mt-8 w-full rounded-lg bg-brand-600 px-4 py-3 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {saving ? 'Opslaan...' : 'Naar dashboard'}
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-16">
      <p className="text-center text-sm font-medium text-slate-500">
        Stap {step} van {TOTAL_STEPS}
      </p>
      <div className="mt-2 flex gap-1">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${
              i < step ? 'bg-brand-600' : 'bg-slate-200 dark:bg-slate-800'
            }`}
          />
        ))}
      </div>

      <div className="mt-8">
        {step === 1 && (
          <div className="flex flex-col gap-3">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Over jou</h1>
            <p className="text-sm text-slate-500">Allemaal optioneel — vul in wat je wilt.</p>
            <input
              value={form.displayName}
              onChange={(e) => update('displayName', e.target.value)}
              placeholder="Naam"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
            <div className="flex gap-2">
              <input
                type="number"
                inputMode="decimal"
                value={form.weightKg}
                onChange={(e) => update('weightKg', e.target.value)}
                placeholder="Gewicht (kg)"
                className="w-1/2 rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
              <input
                type="number"
                inputMode="decimal"
                value={form.heightCm}
                onChange={(e) => update('heightCm', e.target.value)}
                placeholder="Lengte (cm)"
                className="w-1/2 rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={form.gender}
                onChange={(e) => update('gender', e.target.value as FormState['gender'])}
                className="w-1/2 rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                <option value="">Geslacht</option>
                <option value="male">Man</option>
                <option value="female">Vrouw</option>
                <option value="other">Anders</option>
              </select>
              <input
                type="number"
                inputMode="numeric"
                value={form.birthYear}
                onChange={(e) => update('birthYear', e.target.value)}
                placeholder="Geboortejaar"
                className="w-1/2 rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-3">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Hoeveel dagen per week wil je trainen?
            </h1>
            <div className="grid grid-cols-5 gap-2">
              {[2, 3, 4, 5, 6].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => update('daysPerWeek', n)}
                  className={`rounded-lg border py-3 text-sm font-medium ${
                    form.daysPerWeek === n
                      ? 'border-brand-600 bg-brand-600 text-white'
                      : 'border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-300'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-3">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Welke apparatuur heb je?
            </h1>
            {(Object.keys(EQUIPMENT_LABELS) as Equipment[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => update('equipment', key)}
                className={`rounded-lg border px-4 py-3 text-left text-sm font-medium ${
                  form.equipment === key
                    ? 'border-brand-600 bg-brand-600 text-white'
                    : 'border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-300'
                }`}
              >
                {EQUIPMENT_LABELS[key]}
              </button>
            ))}
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-3">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Wat is je trainingservaring?
            </h1>
            {(Object.keys(EXPERIENCE_LABELS) as ExperienceLevel[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => update('experienceLevel', key)}
                className={`rounded-lg border px-4 py-3 text-left text-sm font-medium ${
                  form.experienceLevel === key
                    ? 'border-brand-600 bg-brand-600 text-white'
                    : 'border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-300'
                }`}
              >
                {EXPERIENCE_LABELS[key]}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 flex gap-2">
        {step > 1 && (
          <button
            type="button"
            onClick={goBack}
            className="rounded-lg border border-slate-300 px-4 py-3 text-sm font-medium text-slate-600 dark:border-slate-700 dark:text-slate-400"
          >
            Vorige
          </button>
        )}
        <button
          type="button"
          onClick={goNext}
          className="flex-1 rounded-lg bg-brand-600 px-4 py-3 text-sm font-medium text-white hover:bg-brand-700"
        >
          {step < TOTAL_STEPS ? 'Volgende' : 'Bekijk mijn schema'}
        </button>
      </div>
    </div>
  )
}
