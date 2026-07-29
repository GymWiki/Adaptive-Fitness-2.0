import type { Equipment, MovementPattern, MuscleGroup } from './types'

/**
 * Fixed substitution mapping: each movement pattern lists its exercise name
 * per equipment tier. Source: ACSM (2009) progression models + standard
 * strength-training exercise selection (see wetenschappelijk-bronnenoverzicht.md).
 *
 * Every muscle group has at least one pattern with a `bodyweight_only`
 * variant, so no muscle group ever becomes untrainable on a low equipment tier.
 */
export const EXERCISE_CATALOG: MovementPattern[] = [
  // Chest
  {
    id: 'chest-press',
    muscleGroup: 'chest',
    secondaryMuscleGroups: ['shoulders', 'triceps'],
    kind: 'compound',
    variants: {
      full_gym: 'Barbell Bench Press',
      home_dumbbells: 'Dumbbell Bench Press',
      bodyweight_only: 'Push-ups',
    },
  },
  {
    id: 'chest-incline',
    muscleGroup: 'chest',
    secondaryMuscleGroups: ['shoulders', 'triceps'],
    kind: 'isolation',
    variants: {
      full_gym: 'Incline Barbell Press',
      home_dumbbells: 'Incline Dumbbell Press',
      bodyweight_only: 'Decline Push-ups',
    },
  },
  // Back
  {
    id: 'back-row',
    muscleGroup: 'back',
    secondaryMuscleGroups: ['biceps'],
    kind: 'compound',
    variants: {
      full_gym: 'Barbell Row',
      home_dumbbells: 'Dumbbell Row',
      bodyweight_only: 'Inverted Row',
    },
  },
  {
    id: 'back-vertical-pull',
    muscleGroup: 'back',
    secondaryMuscleGroups: ['biceps'],
    kind: 'isolation',
    variants: {
      full_gym: 'Lat Pulldown',
      home_dumbbells: 'Dumbbell Pullover',
      bodyweight_only: 'Pull-up / Chin-up',
    },
  },
  // Shoulders
  {
    id: 'shoulder-press',
    muscleGroup: 'shoulders',
    secondaryMuscleGroups: ['triceps'],
    kind: 'compound',
    variants: {
      full_gym: 'Barbell Overhead Press',
      home_dumbbells: 'Dumbbell Shoulder Press',
      bodyweight_only: 'Pike Push-ups',
    },
  },
  {
    id: 'shoulder-lateral',
    muscleGroup: 'shoulders',
    secondaryMuscleGroups: [],
    kind: 'isolation',
    variants: {
      full_gym: 'Cable Lateral Raise',
      home_dumbbells: 'Dumbbell Lateral Raise',
      bodyweight_only: 'Prone Y-Raise',
    },
  },
  // Biceps
  {
    id: 'biceps-curl',
    muscleGroup: 'biceps',
    secondaryMuscleGroups: [],
    kind: 'compound',
    variants: {
      full_gym: 'Barbell Curl',
      home_dumbbells: 'Dumbbell Curl',
      bodyweight_only: 'Chin-ups',
    },
  },
  {
    id: 'biceps-hammer',
    muscleGroup: 'biceps',
    secondaryMuscleGroups: [],
    kind: 'isolation',
    variants: {
      full_gym: 'Cable Hammer Curl',
      home_dumbbells: 'Dumbbell Hammer Curl',
      bodyweight_only: 'Neutral-Grip Chin-ups',
    },
  },
  // Triceps
  {
    id: 'triceps-pushdown',
    muscleGroup: 'triceps',
    secondaryMuscleGroups: [],
    kind: 'compound',
    variants: {
      full_gym: 'Cable Triceps Pushdown',
      home_dumbbells: 'Dumbbell Overhead Triceps Extension',
      bodyweight_only: 'Diamond Push-ups',
    },
  },
  {
    id: 'triceps-dip',
    muscleGroup: 'triceps',
    secondaryMuscleGroups: ['chest', 'shoulders'],
    kind: 'isolation',
    variants: {
      full_gym: 'Assisted Dip Machine',
      home_dumbbells: 'Bench Dips',
      bodyweight_only: 'Bench Dips',
    },
  },
  // Quads
  {
    id: 'quad-squat',
    muscleGroup: 'quads',
    secondaryMuscleGroups: ['glutes'],
    kind: 'compound',
    variants: {
      full_gym: 'Barbell Back Squat',
      home_dumbbells: 'Goblet Squat',
      bodyweight_only: 'Bodyweight Squat',
    },
  },
  {
    id: 'quad-lunge',
    muscleGroup: 'quads',
    secondaryMuscleGroups: ['glutes'],
    kind: 'isolation',
    variants: {
      full_gym: 'Leg Press',
      home_dumbbells: 'Dumbbell Lunge',
      bodyweight_only: 'Bodyweight Lunge',
    },
  },
  // Hamstrings
  {
    id: 'hamstring-hinge',
    muscleGroup: 'hamstrings',
    secondaryMuscleGroups: ['glutes'],
    kind: 'compound',
    variants: {
      full_gym: 'Barbell Romanian Deadlift',
      home_dumbbells: 'Dumbbell Romanian Deadlift',
      bodyweight_only: 'Single-Leg Glute Bridge',
    },
  },
  {
    id: 'hamstring-curl',
    muscleGroup: 'hamstrings',
    secondaryMuscleGroups: [],
    kind: 'isolation',
    variants: {
      full_gym: 'Machine Leg Curl',
      home_dumbbells: 'Dumbbell Leg Curl (heel-supported)',
      bodyweight_only: 'Nordic Curl',
    },
  },
  // Glutes
  {
    id: 'glute-bridge',
    muscleGroup: 'glutes',
    secondaryMuscleGroups: ['hamstrings'],
    kind: 'compound',
    variants: {
      full_gym: 'Barbell Hip Thrust',
      home_dumbbells: 'Dumbbell Hip Thrust',
      bodyweight_only: 'Bodyweight Hip Thrust',
    },
  },
  {
    id: 'glute-abduction',
    muscleGroup: 'glutes',
    secondaryMuscleGroups: [],
    kind: 'isolation',
    variants: {
      full_gym: 'Machine Hip Abduction',
      home_dumbbells: 'Dumbbell Side-lying Hip Abduction',
      bodyweight_only: 'Side-lying Hip Abduction',
    },
  },
  // Calves
  {
    id: 'calf-raise',
    muscleGroup: 'calves',
    secondaryMuscleGroups: [],
    kind: 'compound',
    variants: {
      full_gym: 'Machine Calf Raise',
      home_dumbbells: 'Dumbbell Calf Raise',
      bodyweight_only: 'Bodyweight Calf Raise',
    },
  },
  // Core
  {
    id: 'core-anti-extension',
    muscleGroup: 'core',
    secondaryMuscleGroups: [],
    kind: 'compound',
    variants: {
      full_gym: 'Cable Pallof Press',
      home_dumbbells: 'Weighted Plank',
      bodyweight_only: 'Plank',
    },
  },
  {
    id: 'core-flexion',
    muscleGroup: 'core',
    secondaryMuscleGroups: [],
    kind: 'isolation',
    variants: {
      full_gym: 'Cable Crunch',
      home_dumbbells: 'Dumbbell Weighted Crunch',
      bodyweight_only: 'Bicycle Crunch',
    },
  },
]

// Equipment tiers ordered from most to least equipment required. A profile
// may use its own tier or fall back to a lower one, never a higher one.
const FALLBACK_CHAIN: Record<Equipment, Equipment[]> = {
  full_gym: ['full_gym', 'home_dumbbells', 'bodyweight_only'],
  home_dumbbells: ['home_dumbbells', 'bodyweight_only'],
  bodyweight_only: ['bodyweight_only'],
}

/** Resolves a movement pattern to a concrete exercise name for the given equipment profile. */
export function substituteForEquipment(
  pattern: MovementPattern,
  equipment: Equipment,
): string | null {
  for (const tier of FALLBACK_CHAIN[equipment]) {
    const name = pattern.variants[tier]
    if (name) return name
  }
  return null
}

export function patternsForMuscleGroup(muscleGroup: MuscleGroup): MovementPattern[] {
  return EXERCISE_CATALOG.filter((pattern) => pattern.muscleGroup === muscleGroup)
}

/** Movement patterns from the catalog that resolve to a real exercise for this equipment profile. */
export function availablePatterns(
  muscleGroup: MuscleGroup,
  equipment: Equipment,
): MovementPattern[] {
  return patternsForMuscleGroup(muscleGroup).filter(
    (pattern) => substituteForEquipment(pattern, equipment) !== null,
  )
}
