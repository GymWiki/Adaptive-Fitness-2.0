import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { updateProfile } from '../lib/sheets/profiles'
import { listExercises } from '../lib/sheets/exercises'
import {
  deleteCustomWorkout,
  insertCustomWorkout,
  listCustomWorkouts,
  updateCustomWorkout,
} from '../lib/sheets/customWorkouts'
import { getCustomScheduleAssignment, setCustomScheduleDay } from '../lib/sheets/customSchedule'
import { WEEKDAY_ORDER } from '../lib/customSchedule/types'
import type { CustomScheduleAssignment, CustomWorkout, CustomWorkoutExercise } from '../lib/customSchedule/types'
import type { Weekday } from '../lib/combinedSchedule/types'
import type { Exercise } from '../lib/types'
import { formatRepRange, formatRirRange } from '../lib/customSchedule/formatTargets'
import { WEEKDAY_LABELS } from '../lib/labels'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input, Select } from '../components/ui/Input'
import { ErrorState, Spinner } from '../components/ui/States'
import { ExercisePicker } from '../components/ExercisePicker'

type EditorState = {
  id: string | null
  name: string
  exercises: CustomWorkoutExercise[]
}

const EMPTY_ASSIGNMENT: CustomScheduleAssignment = {
  mon: null,
  tue: null,
  wed: null,
  thu: null,
  fri: null,
  sat: null,
  sun: null,
}

export function CustomScheduleBuilder() {
  const { user } = useAuth()
  const { profile, loading: profileLoading } = useProfile()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [workouts, setWorkouts] = useState<CustomWorkout[]>([])
  const [assignment, setAssignment] = useState<CustomScheduleAssignment>(EMPTY_ASSIGNMENT)

  const [editor, setEditor] = useState<EditorState | null>(null)
  const [savingWorkout, setSavingWorkout] = useState(false)

  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null)
  const [confirmingActivate, setConfirmingActivate] = useState(false)
  const [activating, setActivating] = useState(false)
  const [activated, setActivated] = useState(false)
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    if (!user) return
    let cancelled = false
    setLoading(true)
    setLoadError(false)

    Promise.all([listExercises(), listCustomWorkouts(), getCustomScheduleAssignment()])
      .then(([loadedExercises, loadedWorkouts, loadedAssignment]) => {
        if (cancelled) return
        setExercises(loadedExercises)
        setWorkouts(loadedWorkouts)
        setAssignment(loadedAssignment)
      })
      .catch(() => {
        if (!cancelled) setLoadError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [user])

  const exerciseById = new Map(exercises.map((exercise) => [exercise.id, exercise]))
  const activeDayCount = WEEKDAY_ORDER.filter((day) => assignment[day]).length
  const isActive = profile?.schedule_source === 'custom'

  function openNewWorkout() {
    setEditor({ id: null, name: '', exercises: [] })
    setActionError('')
  }

  function openEditWorkout(workout: CustomWorkout) {
    setEditor({ id: workout.id, name: workout.name, exercises: workout.exercises })
    setActionError('')
  }

  function closeEditor() {
    setEditor(null)
  }

  function addExerciseToEditor(exercise: Exercise) {
    if (!editor) return
    setExercises((prev) => (prev.some((e) => e.id === exercise.id) ? prev : [...prev, exercise]))
    setEditor({
      ...editor,
      exercises: [...editor.exercises, { exerciseId: exercise.id, sets: 3, restSeconds: '90' }],
    })
  }

  function updateEditorExercise(index: number, patch: Partial<CustomWorkoutExercise>) {
    if (!editor) return
    const nextExercises = editor.exercises.map((entry, i) => (i === index ? { ...entry, ...patch } : entry))
    setEditor({ ...editor, exercises: nextExercises })
  }

  function removeEditorExercise(index: number) {
    if (!editor) return
    setEditor({ ...editor, exercises: editor.exercises.filter((_, i) => i !== index) })
  }

  function moveEditorExercise(index: number, direction: -1 | 1) {
    if (!editor) return
    const target = index + direction
    if (target < 0 || target >= editor.exercises.length) return
    const next = [...editor.exercises]
    ;[next[index], next[target]] = [next[target], next[index]]
    setEditor({ ...editor, exercises: next })
  }

  async function handleSaveWorkout() {
    if (!editor) return
    const name = editor.name.trim()
    if (!name || editor.exercises.length === 0) return

    setSavingWorkout(true)
    setActionError('')
    try {
      if (editor.id) {
        const saved = await updateCustomWorkout(editor.id, { name, exercises: editor.exercises })
        setWorkouts((prev) => prev.map((w) => (w.id === saved.id ? saved : w)).sort((a, b) => a.name.localeCompare(b.name)))
      } else {
        const saved = await insertCustomWorkout({ name, exercises: editor.exercises })
        setWorkouts((prev) => [...prev, saved].sort((a, b) => a.name.localeCompare(b.name)))
      }
      setEditor(null)
    } catch {
      setActionError('Workout opslaan is mislukt. Probeer opnieuw.')
    } finally {
      setSavingWorkout(false)
    }
  }

  async function handleDeleteWorkout(id: string) {
    setActionError('')
    try {
      await deleteCustomWorkout(id)
      setWorkouts((prev) => prev.filter((w) => w.id !== id))
      setAssignment((prev) => {
        const next = { ...prev }
        for (const day of WEEKDAY_ORDER) {
          if (next[day] === id) next[day] = null
        }
        return next
      })
    } catch {
      setActionError('Workout verwijderen is mislukt. Probeer opnieuw.')
    } finally {
      setConfirmingDeleteId(null)
    }
  }

  async function handleAssignDay(day: Weekday, workoutId: string) {
    const value = workoutId || null
    setAssignment((prev) => ({ ...prev, [day]: value }))
    try {
      await setCustomScheduleDay(day, value)
    } catch {
      setActionError('Dag toewijzen is mislukt. Probeer opnieuw.')
    }
  }

  async function handleActivate() {
    if (!user) return
    setActivating(true)
    setActionError('')
    try {
      await updateProfile(user.id, { schedule_source: 'custom' })
    } catch {
      setActionError('Activeren is mislukt. Probeer opnieuw.')
      setActivating(false)
      return
    }
    setActivating(false)
    setConfirmingActivate(false)
    setActivated(true)
  }

  if (loading) return <Spinner />

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-display text-2xl font-bold">Eigen schema</h1>
      <p className="mt-1 text-sm text-ink-dim">
        Bouw je eigen workouts uit je oefeningenlijst en koppel ze aan dagen van de week. Reps en RIR
        komen altijd van de oefening zelf, dus je advies blijft meebewegen zoals je gewend bent.
      </p>

      {loadError && (
        <div className="mt-6">
          <ErrorState message="Laden is mislukt. Controleer je verbinding en probeer opnieuw." />
        </div>
      )}

      {!loadError && (
        <>
          {editor ? (
            <WorkoutEditor
              editor={editor}
              exerciseById={exerciseById}
              saving={savingWorkout}
              error={actionError}
              onNameChange={(name) => setEditor({ ...editor, name })}
              onAddExercise={addExerciseToEditor}
              onUpdateExercise={updateEditorExercise}
              onRemoveExercise={removeEditorExercise}
              onMoveExercise={moveEditorExercise}
              onSave={handleSaveWorkout}
              onCancel={closeEditor}
            />
          ) : (
            <section className="mt-8">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold text-ink">Workouts</h2>
                <Button size="sm" onClick={openNewWorkout}>
                  + Nieuwe workout
                </Button>
              </div>

              {workouts.length === 0 && (
                <p className="mt-3 text-sm text-ink-dim">Nog geen workouts — maak er hierboven een.</p>
              )}

              <ul className="mt-3 flex flex-col gap-3">
                {workouts.map((workout) => (
                  <li key={workout.id}>
                    <Card>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-ink">{workout.name}</p>
                          <p className="text-xs text-ink-faint">{workout.exercises.length} oefeningen</p>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <Button size="sm" variant="secondary" onClick={() => openEditWorkout(workout)}>
                            Bewerken
                          </Button>
                          {confirmingDeleteId === workout.id ? (
                            <>
                              <Button size="sm" variant="ghost" onClick={() => setConfirmingDeleteId(null)}>
                                Annuleren
                              </Button>
                              <Button size="sm" variant="danger" onClick={() => handleDeleteWorkout(workout.id)}>
                                Verwijderen
                              </Button>
                            </>
                          ) : (
                            <Button size="sm" variant="danger" onClick={() => setConfirmingDeleteId(workout.id)}>
                              Verwijderen
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {!editor && (
            <section className="mt-10">
              <h2 className="font-display text-lg font-bold text-ink">Weekplanning</h2>
              <div className="mt-3 flex flex-col gap-2">
                {WEEKDAY_ORDER.map((day) => (
                  <div key={day} className="flex items-center gap-3">
                    <span className="w-10 shrink-0 text-sm font-semibold text-ink-dim">
                      {WEEKDAY_LABELS[day]}
                    </span>
                    <Select
                      value={assignment[day] ?? ''}
                      onChange={(e) => handleAssignDay(day, e.target.value)}
                      className="flex-1"
                    >
                      <option value="">Rust</option>
                      {workouts.map((workout) => (
                        <option key={workout.id} value={workout.id}>
                          {workout.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                ))}
              </div>
            </section>
          )}

          {!editor && (
            <section className="mt-10">
              {actionError && (
                <div className="mb-3">
                  <ErrorState message={actionError} />
                </div>
              )}

              {isActive && !activated ? (
                <p className="text-sm font-semibold text-accent">✓ Dit is je huidige actieve schema.</p>
              ) : activated ? (
                <div className="flex flex-col gap-3">
                  <p className="text-sm font-semibold text-accent">
                    ✓ Geactiveerd! Dit is nu je actieve schema op het dashboard.
                  </p>
                  <Button variant="secondary" onClick={() => navigate('/app')} fullWidth>
                    Naar dashboard
                  </Button>
                </div>
              ) : confirmingActivate ? (
                <Card>
                  <p className="text-sm text-ink">
                    Dit vervangt je huidige actieve schema op het dashboard. Weet je het zeker?
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button variant="secondary" onClick={() => setConfirmingActivate(false)}>
                      Annuleren
                    </Button>
                    <Button onClick={handleActivate} disabled={activating} fullWidth>
                      {activating ? 'Bezig...' : 'Ja, activeer dit schema'}
                    </Button>
                  </div>
                </Card>
              ) : (
                <Button
                  onClick={() => setConfirmingActivate(true)}
                  disabled={activeDayCount === 0 || profileLoading}
                  fullWidth
                >
                  Activeer dit schema
                </Button>
              )}
              {!isActive && !activated && activeDayCount === 0 && (
                <p className="mt-2 text-center text-xs text-ink-faint">
                  Wijs eerst minstens één dag een workout toe.
                </p>
              )}
            </section>
          )}
        </>
      )}
    </div>
  )
}

function WorkoutEditor({
  editor,
  exerciseById,
  saving,
  error,
  onNameChange,
  onAddExercise,
  onUpdateExercise,
  onRemoveExercise,
  onMoveExercise,
  onSave,
  onCancel,
}: {
  editor: EditorState
  exerciseById: Map<string, Exercise>
  saving: boolean
  error: string
  onNameChange: (name: string) => void
  onAddExercise: (exercise: Exercise) => void
  onUpdateExercise: (index: number, patch: Partial<CustomWorkoutExercise>) => void
  onRemoveExercise: (index: number) => void
  onMoveExercise: (index: number, direction: -1 | 1) => void
  onSave: () => void
  onCancel: () => void
}) {
  const canSave = editor.name.trim() !== '' && editor.exercises.length > 0

  return (
    <section className="mt-8">
      <h2 className="font-display text-lg font-bold text-ink">
        {editor.id ? 'Workout bewerken' : 'Nieuwe workout'}
      </h2>

      <Input
        value={editor.name}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder="Naam, bv. Push"
        className="mt-4"
      />

      <ul className="mt-4 flex flex-col gap-3">
        {editor.exercises.map((entry, index) => {
          const exercise = exerciseById.get(entry.exerciseId)
          return (
            <li key={index}>
              <Card>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{exercise?.name ?? 'Onbekende oefening'}</p>
                    {exercise && (
                      <p className="text-xs text-ink-faint">
                        {formatRepRange(exercise.rep_range_min, exercise.rep_range_max)} reps ·{' '}
                        {formatRirRange(exercise.target_rir_min, exercise.target_rir_max)}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => onMoveExercise(index, -1)}
                      disabled={index === 0}
                      aria-label="Omhoog"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-dim disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => onMoveExercise(index, 1)}
                      disabled={index === editor.exercises.length - 1}
                      aria-label="Omlaag"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-dim disabled:opacity-30"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveExercise(index)}
                      aria-label="Verwijderen"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-danger"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <label className="flex-1 text-xs font-semibold text-ink-dim">
                    Sets
                    <Input
                      type="number"
                      inputMode="numeric"
                      min="1"
                      value={entry.sets}
                      onChange={(e) => onUpdateExercise(index, { sets: Number(e.target.value) || 1 })}
                      className="mt-1"
                    />
                  </label>
                  <label className="flex-1 text-xs font-semibold text-ink-dim">
                    Rust (sec)
                    <Input
                      inputMode="numeric"
                      value={entry.restSeconds}
                      onChange={(e) => onUpdateExercise(index, { restSeconds: e.target.value })}
                      className="mt-1"
                    />
                  </label>
                </div>
                <label className="mt-2 block text-xs font-semibold text-ink-dim">
                  Notitie (optioneel)
                  <Input
                    value={entry.note ?? ''}
                    onChange={(e) => onUpdateExercise(index, { note: e.target.value || undefined })}
                    className="mt-1"
                  />
                </label>
              </Card>
            </li>
          )
        })}
      </ul>

      <div className="mt-4 rounded-2xl border border-dashed border-border p-4">
        <p className="text-sm font-semibold text-ink-dim">Oefening toevoegen</p>
        <div className="mt-2">
          <ExercisePicker value="" onChange={() => {}} onSelectExercise={onAddExercise} />
        </div>
      </div>

      {error && (
        <div className="mt-4">
          <ErrorState message={error} />
        </div>
      )}

      <div className="mt-6 flex gap-2">
        <Button variant="secondary" onClick={onCancel}>
          Annuleren
        </Button>
        <Button onClick={onSave} disabled={!canSave || saving} fullWidth>
          {saving ? 'Bezig...' : 'Workout opslaan'}
        </Button>
      </div>
    </section>
  )
}
