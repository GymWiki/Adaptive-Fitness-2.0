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

export type Profile = {
  id: string
  display_name: string | null
  weight_kg: number | null
  height_cm: number | null
  gender: 'male' | 'female' | 'other' | null
  birth_year: number | null
  primary_focus: import('./combinedSchedule/types').PrimaryFocus | null
  strength_focus_zone: import('./combinedSchedule/types').StrengthFocusZone | null
  hybrid_ratio: import('./combinedSchedule/types').HybridRatio | null
  target_race_distance: import('./combinedSchedule/types').RaceDistance | null
  target_race_distance_custom: string | null
  target_race_date: string | null
  available_days: import('./combinedSchedule/types').Weekday[]
  session_duration: import('./combinedSchedule/types').SessionDuration | null
  running_experience_level: import('./combinedSchedule/types').RunningExperienceLevel | null
  equipment: 'full_gym' | 'home_dumbbells' | 'bodyweight_only' | null
  experience_level: 'beginner' | 'intermediate' | 'advanced' | null
  onboarding_completed: boolean
  schedule_source: 'generated' | 'custom' | null
}
