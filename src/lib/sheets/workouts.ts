import { insert, insertMany, list, update } from './sheetsTable'
import type { SheetRow } from './rowMapping'
import { toExercise } from './exercises'
import type { Workout } from '../types'

const WORKOUTS_TAB = 'workouts'
const SETS_TAB = 'workout_sets'

type RawWorkout = { id: string; name: string | null; performed_at: string }
type RawWorkoutSet = {
  id: string
  workout_id: string
  exercise_id: string
  set_order: number
  weight_kg: number
  reps: number
  rir: number
}

export function toRawWorkout(row: SheetRow): RawWorkout {
  return { id: row.id, name: row.name || null, performed_at: row.performed_at }
}

export function toRawWorkoutSet(row: SheetRow): RawWorkoutSet {
  return {
    id: row.id,
    workout_id: row.workout_id,
    exercise_id: row.exercise_id,
    set_order: Number(row.set_order) || 0,
    weight_kg: Number(row.weight_kg) || 0,
    reps: Number(row.reps) || 0,
    rir: Number(row.rir) || 0,
  }
}

export async function insertWorkout(name: string | null): Promise<RawWorkout> {
  const now = new Date().toISOString()
  const workout: RawWorkout = { id: crypto.randomUUID(), name, performed_at: now }
  await insert(WORKOUTS_TAB, { id: workout.id, name: name ?? '', performed_at: now, created_at: now })
  return workout
}

export type NewWorkoutSet = {
  workout_id: string
  exercise_id: string
  set_order: number
  weight_kg: number
  reps: number
  rir: number
}

function newSetToRow(set: NewWorkoutSet): SheetRow {
  return {
    id: crypto.randomUUID(),
    workout_id: set.workout_id,
    exercise_id: set.exercise_id,
    set_order: String(set.set_order),
    weight_kg: String(set.weight_kg),
    reps: String(set.reps),
    rir: String(set.rir),
    created_at: new Date().toISOString(),
  }
}

/** Logs one set immediately — the guided workout flow's per-set incremental save. */
export async function insertWorkoutSet(set: NewWorkoutSet): Promise<{ id: string }> {
  const row = newSetToRow(set)
  await insert(SETS_TAB, row)
  return { id: row.id }
}

/** Logs every set of a manually-built workout in one call — LogWorkout's bulk save. */
export async function insertWorkoutSets(sets: NewWorkoutSet[]): Promise<void> {
  await insertMany(SETS_TAB, sets.map(newSetToRow))
}

export async function updateWorkoutSet(
  id: string,
  patch: { weight_kg?: number; reps?: number; rir?: number },
): Promise<void> {
  const row: SheetRow = {}
  if (patch.weight_kg !== undefined) row.weight_kg = String(patch.weight_kg)
  if (patch.reps !== undefined) row.reps = String(patch.reps)
  if (patch.rir !== undefined) row.rir = String(patch.rir)
  await update(SETS_TAB, id, row)
}

export async function countWorkouts(): Promise<number> {
  const rows = await list(WORKOUTS_TAB)
  return rows.length
}

export function sortByPerformedAtDesc(workouts: RawWorkout[]): RawWorkout[] {
  return [...workouts].sort((a, b) => (a.performed_at < b.performed_at ? 1 : -1))
}

/** Dashboard's need: most recent workouts with just a set count, no exercise detail. */
export async function listRecentWorkouts(limitCount: number): Promise<Workout[]> {
  const [workoutRows, setRows] = await Promise.all([list(WORKOUTS_TAB), list(SETS_TAB)])
  const workouts = sortByPerformedAtDesc(workoutRows.map(toRawWorkout)).slice(0, limitCount)
  const sets = setRows.map(toRawWorkoutSet)

  return workouts.map((workout) => ({
    id: workout.id,
    name: workout.name,
    performed_at: workout.performed_at,
    workout_sets: sets
      .filter((set) => set.workout_id === workout.id)
      .map((set) => ({ id: set.id, exercise_id: set.exercise_id, set_order: set.set_order, weight_kg: set.weight_kg, reps: set.reps, rir: set.rir })),
  }))
}

export type SetWithPerformedAt = RawWorkoutSet & { performed_at: string }

/** Every logged set, joined with its workout's performed_at — the shared join fetchExerciseHistory needs. */
export async function listWorkoutSetsWithPerformedAt(): Promise<SetWithPerformedAt[]> {
  const [workoutRows, setRows] = await Promise.all([list(WORKOUTS_TAB), list(SETS_TAB)])
  const performedAtByWorkoutId = new Map(workoutRows.map((row) => [row.id, row.performed_at]))
  return setRows
    .map(toRawWorkoutSet)
    .map((set) => ({ ...set, performed_at: performedAtByWorkoutId.get(set.workout_id) ?? '' }))
}

/** History's need: every workout, every set, each set's exercise name/muscle group. */
export async function listWorkoutsWithDetail(): Promise<Workout[]> {
  const [workoutRows, setRows, exerciseRows] = await Promise.all([
    list(WORKOUTS_TAB),
    list(SETS_TAB),
    list('exercises'),
  ])
  const workouts = sortByPerformedAtDesc(workoutRows.map(toRawWorkout))
  const sets = setRows.map(toRawWorkoutSet)
  const exercisesById = new Map(exerciseRows.map((row) => [row.id, toExercise(row)]))

  return workouts.map((workout) => ({
    id: workout.id,
    name: workout.name,
    performed_at: workout.performed_at,
    workout_sets: sets
      .filter((set) => set.workout_id === workout.id)
      .map((set) => ({
        id: set.id,
        exercise_id: set.exercise_id,
        set_order: set.set_order,
        weight_kg: set.weight_kg,
        reps: set.reps,
        rir: set.rir,
        exercise: exercisesById.get(set.exercise_id),
      })),
  }))
}
