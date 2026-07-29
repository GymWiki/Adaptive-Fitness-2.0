import type { LoggedSet, VolumePoint } from './types'

/**
 * Total volume (weight × reps, summed across sets) lifted per workout for a
 * single exercise, sorted oldest to newest.
 */
export function computeVolume(sets: LoggedSet[]): VolumePoint[] {
  const byWorkout = new Map<string, VolumePoint>()

  for (const set of sets) {
    const existing = byWorkout.get(set.workoutId)
    const setVolume = set.weightKg * set.reps
    if (existing) {
      existing.volumeKg += setVolume
    } else {
      byWorkout.set(set.workoutId, {
        workoutId: set.workoutId,
        performedAt: set.performedAt,
        volumeKg: setVolume,
      })
    }
  }

  return [...byWorkout.values()].sort((a, b) => a.performedAt.localeCompare(b.performedAt))
}
