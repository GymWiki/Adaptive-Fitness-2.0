export type Exercise = {
  id: string
  name: string
  muscle_group: string | null
}

export type WorkoutSet = {
  id: string
  exercise_id: string
  set_order: number
  weight_kg: number
  reps: number
  exercise?: Exercise
}

export type Workout = {
  id: string
  name: string | null
  performed_at: string
  workout_sets?: WorkoutSet[]
}
