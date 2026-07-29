/** One logged set for a single exercise, enriched with which workout/day it belongs to. */
export type LoggedSet = {
  setId: string
  workoutId: string
  performedAt: string
  weightKg: number
  reps: number
  rir: number
}

/** A logged set that represents a new estimated-1RM best at the time it was performed. */
export type PersonalRecord = LoggedSet & {
  estimated1RM: number
}

/** Estimated-1RM trend point — the best estimated 1RM seen in a single workout. */
export type OneRepMaxPoint = {
  workoutId: string
  performedAt: string
  estimated1RM: number
}

/** Total volume (weight × reps, summed) lifted for one exercise in a single workout. */
export type VolumePoint = {
  workoutId: string
  performedAt: string
  volumeKg: number
}
