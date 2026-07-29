import type { LoggedSet, OneRepMaxPoint } from './types'

/**
 * Epley formula, with reps adjusted by RIR (reps-in-reserve) so a set left
 * short of failure isn't scored as if it were a max-effort set.
 * Source: Epley (1985); RIR adjustment per Helms et al. (2016).
 */
export function estimateOneRepMax(weightKg: number, reps: number, rir: number): number {
  const effectiveReps = reps + rir
  if (effectiveReps <= 0) return weightKg
  return weightKg * (1 + effectiveReps / 30)
}

/**
 * The best estimated 1RM per workout for a single exercise, sorted oldest
 * to newest — the shape a trend chart needs.
 */
export function oneRepMaxTrend(sets: LoggedSet[]): OneRepMaxPoint[] {
  const byWorkout = new Map<string, OneRepMaxPoint>()

  for (const set of sets) {
    const estimated1RM = estimateOneRepMax(set.weightKg, set.reps, set.rir)
    const existing = byWorkout.get(set.workoutId)
    if (!existing || estimated1RM > existing.estimated1RM) {
      byWorkout.set(set.workoutId, {
        workoutId: set.workoutId,
        performedAt: set.performedAt,
        estimated1RM,
      })
    }
  }

  return [...byWorkout.values()].sort((a, b) => a.performedAt.localeCompare(b.performedAt))
}
