import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { ExercisePicker } from '../components/ExercisePicker'
import { ExerciseAdvice } from '../components/ExerciseAdvice'
import type { Exercise } from '../lib/types'

type DraftSet = {
  key: string
  exerciseId: string
  exercise: Exercise | null
  weight: string
  reps: string
  rir: string
}

function emptySet(): DraftSet {
  return { key: crypto.randomUUID(), exerciseId: '', exercise: null, weight: '', reps: '', rir: '' }
}

const RIR_OPTIONS = ['0', '1', '2', '3', '4+']

export function LogWorkout() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [sets, setSets] = useState<DraftSet[]>([emptySet()])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function updateSet(key: string, patch: Partial<DraftSet>) {
    setSets((prev) => prev.map((s) => (s.key === key ? { ...s, ...patch } : s)))
  }

  function addSet() {
    setSets((prev) => [...prev, emptySet()])
  }

  function removeSet(key: string) {
    setSets((prev) => (prev.length > 1 ? prev.filter((s) => s.key !== key) : prev))
  }

  async function handleSave() {
    if (!user) return
    const validSets = sets.filter(
      (s) => s.exerciseId && s.weight !== '' && s.reps !== '' && s.rir !== '',
    )
    if (validSets.length === 0) {
      setError('Voeg minstens één complete set toe (oefening, gewicht, herhalingen en RIR).')
      return
    }

    setSaving(true)
    setError('')

    const { data: workout, error: workoutError } = await supabase
      .from('workouts')
      .insert({ user_id: user.id, name: name.trim() || null })
      .select('id')
      .single()

    if (workoutError || !workout) {
      setError('Opslaan van workout is mislukt. Probeer opnieuw.')
      setSaving(false)
      return
    }

    const rows = validSets.map((s, index) => ({
      workout_id: workout.id,
      exercise_id: s.exerciseId,
      set_order: index + 1,
      weight_kg: Number(s.weight),
      reps: Number(s.reps),
      rir: s.rir === '4+' ? 4 : Number(s.rir),
    }))

    const { error: setsError } = await supabase.from('workout_sets').insert(rows)

    if (setsError) {
      setError('Opslaan van sets is mislukt. Probeer opnieuw.')
      setSaving(false)
      return
    }

    navigate('/app')
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Nieuwe workout</h1>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Naam (optioneel, bv. Push day)"
        className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
      />

      <div className="mt-6 flex flex-col gap-4">
        {sets.map((set, index) => (
          <div
            key={set.key}
            className="rounded-xl border border-slate-200 p-4 dark:border-slate-800"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">Set {index + 1}</span>
              <button
                type="button"
                onClick={() => removeSet(set.key)}
                className="text-sm text-slate-400 hover:text-red-600"
              >
                Verwijder
              </button>
            </div>
            <div className="mt-2">
              <ExercisePicker
                value={set.exerciseId}
                onChange={(id) => updateSet(set.key, { exerciseId: id })}
                onSelectExercise={(exercise) => updateSet(set.key, { exercise })}
              />
              {set.exercise && <ExerciseAdvice exercise={set.exercise} />}
            </div>
            <div className="mt-2 flex gap-2">
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.5"
                placeholder="Gewicht (kg)"
                value={set.weight}
                onChange={(e) => updateSet(set.key, { weight: e.target.value })}
                className="w-1/3 rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
              <input
                type="number"
                inputMode="numeric"
                min="0"
                placeholder="Herhalingen"
                value={set.reps}
                onChange={(e) => updateSet(set.key, { reps: e.target.value })}
                className="w-1/3 rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
              <select
                value={set.rir}
                onChange={(e) => updateSet(set.key, { rir: e.target.value })}
                className="w-1/3 rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                <option value="" disabled>
                  RIR
                </option>
                {RIR_OPTIONS.map((rir) => (
                  <option key={rir} value={rir}>
                    RIR {rir}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addSet}
        className="mt-4 w-full rounded-lg border border-dashed border-slate-300 py-2 text-sm font-medium text-slate-600 hover:border-brand-600 hover:text-brand-600 dark:border-slate-700 dark:text-slate-400"
      >
        + Set toevoegen
      </button>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="mt-6 w-full rounded-lg bg-brand-600 px-4 py-3 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {saving ? 'Opslaan...' : 'Workout opslaan'}
      </button>
    </div>
  )
}
