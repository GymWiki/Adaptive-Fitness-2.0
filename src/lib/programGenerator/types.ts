export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'core'

export type Equipment = 'full_gym' | 'home_dumbbells' | 'bodyweight_only'

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced'

export type DayFocus = 'full_body' | 'upper' | 'lower' | 'push' | 'pull' | 'legs'

export type ExerciseKind = 'compound' | 'isolation'

// A movement pattern trains one primary muscle group (plus optional secondaries)
// and lists an exercise name per equipment tier. Not every tier needs an entry —
// a pattern only needs to cover the tiers it makes sense for, as long as every
// muscle group has at least one pattern covering 'bodyweight_only'.
export type MovementPattern = {
  id: string
  muscleGroup: MuscleGroup
  secondaryMuscleGroups: MuscleGroup[]
  kind: ExerciseKind
  variants: Partial<Record<Equipment, string>>
}

export type PlannedExercise = {
  patternId: string
  name: string
  muscleGroup: MuscleGroup
  secondaryMuscleGroups: MuscleGroup[]
  sets: number
  reps: string
  restSeconds: string
  rangeOfMotion: 'full'
  progression: 'double-progression'
}

export type DaySlot =
  | { type: 'rest' }
  | {
      type: 'training'
      focus: DayFocus
      warmup: string
      exercises: PlannedExercise[]
    }

export type WeekProgram = {
  daysPerWeek: number
  equipment: Equipment
  experienceLevel: ExperienceLevel
  week: DaySlot[]
  deloadEveryWeeks: number
  notes: string[]
}

export const MUSCLE_GROUPS: MuscleGroup[] = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'quads',
  'hamstrings',
  'glutes',
  'calves',
  'core',
]

export const FOCUS_MUSCLE_GROUPS: Record<DayFocus, MuscleGroup[]> = {
  full_body: [...MUSCLE_GROUPS],
  upper: ['chest', 'back', 'shoulders', 'biceps', 'triceps'],
  lower: ['quads', 'hamstrings', 'glutes', 'calves', 'core'],
  push: ['chest', 'shoulders', 'triceps'],
  pull: ['back', 'biceps'],
  legs: ['quads', 'hamstrings', 'glutes', 'calves', 'core'],
}
