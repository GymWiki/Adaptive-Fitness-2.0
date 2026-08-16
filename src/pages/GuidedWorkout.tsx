import { useEffect, useReducer, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { insertWorkout, insertWorkoutSet, updateWorkoutSet } from '../lib/sheets/workouts'
import { EXERCISE_CATALOG } from '../lib/programGenerator'
import type { PlannedExercise } from '../lib/programGenerator'
import type { Exercise } from '../lib/types'
import { resolveOrCreateExercise } from '../lib/guidedWorkout/resolveExercise'
import { parseRestSeconds } from '../lib/guidedWorkout/parseRestSeconds'
import {
  createInitialGuidedState,
  guidedWorkoutReducer,
  type GuidedExerciseState,
} from '../lib/guidedWorkout/reducer'
import { useExerciseAdvice } from '../hooks/useExerciseAdvice'
import { RIR_OPTIONS, parseRir } from '../lib/rirOptions'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input, Select } from '../components/ui/Input'
import { ErrorState, Spinner } from '../components/ui/States'

type RouterState = { workoutName?: string; exercises?: PlannedExercise[] } | null

export function GuidedWorkout() {
  const { user, sheetsReady } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const { workoutName, exercises: plannedExercises } = (location.state as RouterState) ?? {}

  const [resolved, setResolved] = useState<GuidedExerciseState['resolved'][] | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!user || !sheetsReady || !plannedExercises) return
    let cancelled = false
    setError(false)
    setResolved(null)

    Promise.all(
      plannedExercises.map((planned) => {
        const kind = EXERCISE_CATALOG.find((p) => p.id === planned.patternId)?.kind ?? 'isolation'
        return resolveOrCreateExercise(planned.name, kind)
      }),
    )
      .then((exercises) => {
        if (!cancelled) setResolved(exercises)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, sheetsReady, plannedExercises])

  if (!plannedExercises || plannedExercises.length === 0) {
    navigate('/app', { replace: true })
    return null
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <ErrorState message="Workout kon niet worden voorbereid. Controleer je verbinding en probeer opnieuw." />
      </div>
    )
  }

  if (!resolved) {
    return <Spinner label="Workout voorbereiden" />
  }

  const exercises = resolved.map((exercise, index) => ({
    resolved: exercise,
    planned: plannedExercises[index],
  }))

  return (
    <GuidedWorkoutSession dayLabel={workoutName ?? 'Workout'} exercises={exercises} />
  )
}

function GuidedWorkoutSession({
  dayLabel,
  exercises,
}: {
  dayLabel: string
  exercises: Array<{ resolved: Exercise; planned: PlannedExercise }>
}) {
  const navigate = useNavigate()
  const [state, dispatch] = useReducer(guidedWorkoutReducer, exercises, createInitialGuidedState)
  const [workoutId, setWorkoutId] = useState<string | null>(null)
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)

  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')
  const [rir, setRir] = useState('')

  const currentExercise = state.exercises[state.exerciseIndex]
  const { advice } = useExerciseAdvice(currentExercise.resolved)

  // Reset the input fields whenever a fresh set becomes active (new exercise,
  // or the next set after resting) — but not while editing a past set.
  useEffect(() => {
    if (state.phase !== 'active' || state.editing) return
    setWeight(advice?.gewicht != null ? String(advice.gewicht) : '')
    setReps('')
    setRir('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.exerciseIndex, currentExercise.loggedSets.length, state.phase])

  // Prefill the weight once advice arrives, if the user hasn't typed one yet.
  useEffect(() => {
    if (state.phase === 'active' && !state.editing && weight === '' && advice?.gewicht != null) {
      setWeight(String(advice.gewicht))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [advice])

  if (state.phase === 'done') {
    const totalSets = state.exercises.reduce((sum, e) => sum + e.loggedSets.length, 0)
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16 text-center">
        <h1 className="font-display text-2xl font-bold">Workout voltooid!</h1>
        <p className="mt-2 text-ink-dim">
          {totalSets} sets gelogd over {state.exercises.length} oefeningen.
        </p>
        <Button className="mt-8" fullWidth onClick={() => navigate('/app')}>
          Naar dashboard
        </Button>
      </div>
    )
  }

  async function ensureWorkoutId(): Promise<string> {
    if (workoutId) return workoutId
    const workout = await insertWorkout(dayLabel)
    setWorkoutId(workout.id)
    return workout.id
  }

  async function handleConfirmSet() {
    if (weight === '' || reps === '' || rir === '') {
      setSaveError('Vul gewicht, herhalingen en RIR in.')
      return
    }
    setSaving(true)
    setSaveError('')
    try {
      const currentWorkoutId = await ensureWorkoutId()
      const setOrder = state.exercises.reduce((sum, e) => sum + e.loggedSets.length, 0) + 1
      const { id } = await insertWorkoutSet({
        workout_id: currentWorkoutId,
        exercise_id: currentExercise.resolved.id,
        set_order: setOrder,
        weight_kg: Number(weight),
        reps: Number(reps),
        rir: parseRir(rir),
      })
      dispatch({ type: 'SET_LOGGED', setRowId: id, weight: Number(weight), reps: Number(reps), rir: parseRir(rir) })
    } catch {
      setSaveError('Set opslaan is mislukt. Probeer opnieuw.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <p className="text-sm font-semibold text-ink-dim">
        Oefening {state.exerciseIndex + 1} van {state.exercises.length}
      </p>
      <h1 className="font-display text-2xl font-bold text-ink">{currentExercise.resolved.name}</h1>
      {currentExercise.planned.note && (
        <p className="mt-1 text-xs text-ink-faint">{currentExercise.planned.note}</p>
      )}
      <p className="mt-1 text-sm text-ink-dim">
        Doel: {currentExercise.planned.sets} × {currentExercise.planned.reps} · {currentExercise.planned.rir}
      </p>

      {currentExercise.loggedSets.length > 0 && (
        <ul className="mt-4 flex flex-col gap-2">
          {currentExercise.loggedSets.map((set, index) =>
            state.editing?.exerciseIndex === state.exerciseIndex && state.editing.setIndex === index ? (
              <EditSetCard
                key={set.setRowId}
                initialWeight={set.weight}
                initialReps={set.reps}
                initialRir={set.rir}
                onCancel={() => dispatch({ type: 'CANCEL_EDIT' })}
                onSave={(edited) =>
                  updateLoggedSet(set.setRowId, edited).then(() =>
                    dispatch({ type: 'SET_UPDATED', exerciseIndex: state.exerciseIndex, setIndex: index, ...edited }),
                  )
                }
              />
            ) : (
              <li key={set.setRowId}>
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'START_EDIT', exerciseIndex: state.exerciseIndex, setIndex: index })}
                  className="flex min-h-11 w-full items-center justify-between rounded-xl border border-border bg-surface-2 px-3 text-sm text-ink-dim"
                >
                  <span>Set {index + 1}: {set.weight} kg × {set.reps} · RIR {set.rir}</span>
                  <span aria-hidden className="text-accent">✓</span>
                </button>
              </li>
            ),
          )}
        </ul>
      )}

      {state.phase === 'active' && !state.editing && (
        <Card className="mt-4">
          {advice && (
            <p className="mb-3 text-xs text-ink-dim">
              {advice.gewicht !== null && <span className="font-semibold">{advice.gewicht} kg — </span>}
              {advice.reden}
            </p>
          )}
          <div className="flex gap-2">
            <Input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.5"
              placeholder="Gewicht (kg)"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-1/3"
            />
            <Input
              type="number"
              inputMode="numeric"
              min="0"
              placeholder="Herhalingen"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              className="w-1/3"
            />
            <Select value={rir} onChange={(e) => setRir(e.target.value)} className="w-1/3">
              <option value="" disabled>
                RIR
              </option>
              {RIR_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  RIR {option}
                </option>
              ))}
            </Select>
          </div>
          {saveError && (
            <div className="mt-3">
              <ErrorState message={saveError} />
            </div>
          )}
          <Button onClick={handleConfirmSet} disabled={saving} fullWidth className="mt-4">
            {saving ? 'Bezig...' : 'Set klaar'}
          </Button>
        </Card>
      )}

      {state.phase === 'resting' && (
        <RestTimer
          seconds={parseRestSeconds(currentExercise.planned.restSeconds)}
          canAddExtraSet={currentExercise.loggedSets.length >= currentExercise.targetSets}
          onAddExtraSet={() => dispatch({ type: 'ADD_EXTRA_SET' })}
          onContinue={() => dispatch({ type: 'CONTINUE' })}
        />
      )}
    </div>
  )

  async function updateLoggedSet(
    setRowId: string,
    edited: { weight: number; reps: number; rir: number },
  ) {
    await updateWorkoutSet(setRowId, { weight_kg: edited.weight, reps: edited.reps, rir: edited.rir })
  }
}

function RestTimer({
  seconds,
  canAddExtraSet,
  onAddExtraSet,
  onContinue,
}: {
  seconds: number
  canAddExtraSet: boolean
  onAddExtraSet: () => void
  onContinue: () => void
}) {
  const [secondsLeft, setSecondsLeft] = useState(seconds)

  useEffect(() => {
    setSecondsLeft(seconds)
  }, [seconds])

  useEffect(() => {
    if (secondsLeft <= 0) {
      onContinue()
      return
    }
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft])

  return (
    <Card className="mt-4 text-center">
      <p className="text-sm font-semibold text-ink-dim">Rust</p>
      <p className="font-display text-5xl font-bold text-ink">{secondsLeft}s</p>
      <div className="mt-5 flex flex-col gap-2">
        <Button onClick={onContinue} fullWidth>
          Door
        </Button>
        {canAddExtraSet && (
          <Button variant="secondary" onClick={onAddExtraSet} fullWidth>
            + Extra set toevoegen
          </Button>
        )}
      </div>
    </Card>
  )
}

function EditSetCard({
  initialWeight,
  initialReps,
  initialRir,
  onCancel,
  onSave,
}: {
  initialWeight: number
  initialReps: number
  initialRir: number
  onCancel: () => void
  onSave: (edited: { weight: number; reps: number; rir: number }) => void
}) {
  const [weight, setWeight] = useState(String(initialWeight))
  const [reps, setReps] = useState(String(initialReps))
  const [rir, setRir] = useState(initialRir === 4 ? '4+' : String(initialRir))

  return (
    <li className="rounded-xl border border-border bg-surface-2 p-3">
      <div className="flex gap-2">
        <Input
          type="number"
          inputMode="decimal"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          className="w-1/3"
        />
        <Input
          type="number"
          inputMode="numeric"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          className="w-1/3"
        />
        <Select value={rir} onChange={(e) => setRir(e.target.value)} className="w-1/3">
          {RIR_OPTIONS.map((option) => (
            <option key={option} value={option}>
              RIR {option}
            </option>
          ))}
        </Select>
      </div>
      <div className="mt-2 flex gap-2">
        <Button variant="secondary" onClick={onCancel}>
          Annuleren
        </Button>
        <Button
          fullWidth
          onClick={() => onSave({ weight: Number(weight), reps: Number(reps), rir: parseRir(rir) })}
        >
          Bijwerken
        </Button>
      </div>
    </li>
  )
}
