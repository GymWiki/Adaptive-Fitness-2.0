import { insert, list, remove, update } from './sheetsTable'
import { setCustomScheduleWorkoutToRest } from './customSchedule'
import type { SheetRow } from './rowMapping'
import type { CustomWorkout, CustomWorkoutExercise } from '../customSchedule/types'

const TAB = 'custom_workouts'

export function toCustomWorkout(row: SheetRow): CustomWorkout {
  let exercises: CustomWorkoutExercise[] = []
  try {
    exercises = row.exercises_json ? JSON.parse(row.exercises_json) : []
  } catch {
    exercises = []
  }
  return { id: row.id, name: row.name, exercises }
}

function fromCustomWorkout(workout: Omit<CustomWorkout, 'id'>): SheetRow {
  return { name: workout.name, exercises_json: JSON.stringify(workout.exercises) }
}

export async function listCustomWorkouts(): Promise<CustomWorkout[]> {
  const rows = await list(TAB)
  return rows.map(toCustomWorkout).sort((a, b) => a.name.localeCompare(b.name))
}

export async function insertCustomWorkout(workout: Omit<CustomWorkout, 'id'>): Promise<CustomWorkout> {
  const id = crypto.randomUUID()
  await insert(TAB, { id, ...fromCustomWorkout(workout) })
  return { id, ...workout }
}

export async function updateCustomWorkout(id: string, workout: Omit<CustomWorkout, 'id'>): Promise<CustomWorkout> {
  await update(TAB, id, fromCustomWorkout(workout))
  return { id, ...workout }
}

/** Deletes a workout and clears any weekday still assigned to it, so the schedule never keeps an orphan reference. */
export async function deleteCustomWorkout(id: string): Promise<void> {
  await remove(TAB, id)
  await setCustomScheduleWorkoutToRest(id)
}
