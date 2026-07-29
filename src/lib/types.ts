export type Exercise = {
  id: string
  name: string
  muscle_group: string | null
  kind: 'compound' | 'isolation'
  rep_range_min: number
  rep_range_max: number
  target_rir_min: number
  target_rir_max: number
}

export type WorkoutSet = {
  id: string
  exercise_id: string
  set_order: number
  weight_kg: number
  reps: number
  rir: number
  exercise?: Exercise
}

export type Workout = {
  id: string
  name: string | null
  performed_at: string
  workout_sets?: WorkoutSet[]
}
