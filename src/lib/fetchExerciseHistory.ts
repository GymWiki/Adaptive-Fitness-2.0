import { listWorkoutSetsWithPerformedAt } from './sheets/workouts'
import type { SessionLog } from './adaptiveAdvice'

/**
 * Loads the last two logged sessions for a specific exercise (most recent
 * first), grouped by workout — the input `adviseNextSession` needs.
 */
export async function fetchExerciseHistory(exerciseId: string): Promise<SessionLog[]> {
  const sets = await listWorkoutSetsWithPerformedAt()

  const sessionsByWorkoutId = new Map<string, SessionLog>()
  for (const set of sets) {
    if (set.exercise_id !== exerciseId) continue
    const entry = { weightKg: set.weight_kg, reps: set.reps, rir: set.rir }
    const existing = sessionsByWorkoutId.get(set.workout_id)
    if (existing) {
      existing.sets.push(entry)
    } else {
      sessionsByWorkoutId.set(set.workout_id, { date: set.performed_at, sets: [entry] })
    }
  }

  return [...sessionsByWorkoutId.values()]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 2)
}
