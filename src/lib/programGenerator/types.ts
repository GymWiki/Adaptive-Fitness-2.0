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

export type ExerciseKind = 'compound' | 'isolation'

export type Goal = 'hypertrophy' | 'strength' | 'fat_loss' | 'conditioning' | 'mix'

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

/** The role a training day plays within its template — drives display, not exercise selection. */
export type TemplateDayKind = 'hit' | 'standard' | 'power' | 'hypertrophy'

// A prescription references a catalog movement pattern by id; the equipment
// substitution layer resolves it to a concrete exercise name at read time.
export type TemplateExercisePrescription = {
  patternId: string
  sets: number
  reps: string
  restSeconds: string
  note?: string
}

export type TemplateDay =
  | { type: 'rest' }
  | { type: 'active_recovery'; description: string }
  | {
      type: 'training'
      label: string
      kind: TemplateDayKind
      exercises: TemplateExercisePrescription[]
    }

// A fixed, literature-named template for a given weekly frequency. Hardcoded
// data, not algorithmically generated — see wetenschappelijk-bronnenoverzicht.md.
export type ProgramTemplate = {
  daysPerWeek: number
  name: string
  source: string
  disclaimer?: string
  // HIT and 5×5 carry their reps as part of their named methodology — goal
  // never rewrites them, it only ever adds cardio. See applyGoal.ts.
  goalOverrideExempt?: boolean
  week: TemplateDay[]
}

export type PlannedExercise = {
  patternId: string
  name: string
  sets: number
  reps: string
  restSeconds: string
  /** Target RIR for this specific exercise — varies by goal and by compound/isolation. */
  rir: string
  note?: string
}

/** A short cardio session attached to an existing training day, when there's no rest day to spare. */
export type CardioAddOn = {
  description: string
  durationMinutes: string
}

export type DaySlot =
  | { type: 'rest' }
  | { type: 'active_recovery'; description: string }
  | {
      type: 'training'
      label: string
      kind: TemplateDayKind
      exercises: PlannedExercise[]
      cardioAddOn?: CardioAddOn
    }
  | { type: 'cardio'; label: string; description: string; durationMinutes: string }

export type WeekProgram = {
  daysPerWeek: number
  equipment: Equipment
  experienceLevel: ExperienceLevel
  goal: Goal
  templateName: string
  source: string
  disclaimer: string | null
  experienceWarning: string | null
  week: DaySlot[]
  notes: string[]
}
