import type { ExerciseKind, Goal, PlannedExercise, TemplateDayKind } from './types'

// Day-kind → default RIR label when a goal doesn't override it. Mirrors the
// intensity zone each named day already represents (see templates.ts).
const BASELINE_RIR: Record<TemplateDayKind, string> = {
  hit: 'Tot spierfalen (RIR 0)',
  power: 'RIR 1-2',
  hypertrophy: 'RIR 2-3',
  standard: 'RIR 2-3',
}

// Strength goal tightens compound ("hoofdlift") prescriptions toward low-rep,
// low-RIR, longer rest — ACSM (2009) position stand. Isolation/accessory
// work, and every other goal, keeps the template's own baseline.
const STRENGTH_COMPOUND_OVERRIDE = {
  reps: '3-6',
  rir: 'RIR 1-2',
  restSeconds: '150-180',
}

const MIN_SETS = 2

function applyToExercise(
  exercise: PlannedExercise,
  exerciseKind: ExerciseKind,
  dayKind: TemplateDayKind,
  goal: Goal,
): PlannedExercise {
  const rir = BASELINE_RIR[dayKind]

  if (goal === 'strength' && exerciseKind === 'compound') {
    return { ...exercise, ...STRENGTH_COMPOUND_OVERRIDE }
  }

  if (goal === 'conditioning') {
    return { ...exercise, rir, sets: Math.max(exercise.sets - 1, MIN_SETS) }
  }

  return { ...exercise, rir }
}

/**
 * Applies the goal parameter layer to one training day's exercises — reps,
 * RIR, rest, and set-count all vary by goal within the frequency template's
 * fixed structure. `goalOverrideExempt` templates (HIT, 5×5) skip this
 * entirely — their reps are the methodology, not a tunable parameter.
 */
export function applyGoal(
  exercises: PlannedExercise[],
  exerciseKindByPatternId: Record<string, ExerciseKind>,
  dayKind: TemplateDayKind,
  goal: Goal,
  exempt: boolean,
): PlannedExercise[] {
  if (exempt) {
    return exercises.map((exercise) => ({ ...exercise, rir: BASELINE_RIR[dayKind] }))
  }

  return exercises.map((exercise) =>
    applyToExercise(exercise, exerciseKindByPatternId[exercise.patternId], dayKind, goal),
  )
}
