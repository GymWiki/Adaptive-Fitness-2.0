import { supabase } from './supabase'
import type { SessionLog } from './adaptiveAdvice'

/**
 * Loads the last two logged sessions for a specific exercise (most recent
 * first), grouped by workout — the input `adviseNextSession` needs.
 */
export async function fetchExerciseHistory(
  userId: string,
  exerciseId: string,
): Promise<SessionLog[]> {
  const { data, error } = await supabase
    .from('workout_sets')
    .select('weight_kg, reps, rir, workout:workouts!inner(id, performed_at, user_id)')
    .eq('exercise_id', exerciseId)
    .eq('workout.user_id', userId)
    .order('performed_at', { referencedTable: 'workout', ascending: false })

  if (error || !data) return []

  const sessionsByWorkoutId = new Map<string, SessionLog>()
  for (const row of data as unknown as {
    weight_kg: number
    reps: number
    rir: number
    workout: { id: string; performed_at: string }
  }[]) {
    const existing = sessionsByWorkoutId.get(row.workout.id)
    const set = { weightKg: row.weight_kg, reps: row.reps, rir: row.rir }
    if (existing) {
      existing.sets.push(set)
    } else {
      sessionsByWorkoutId.set(row.workout.id, { date: row.workout.performed_at, sets: [set] })
    }
  }

  return [...sessionsByWorkoutId.values()]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 2)
}
