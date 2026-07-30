import type { ExerciseKind } from '../programGenerator'

export type ExerciseTargets = {
  rep_range_min: number
  rep_range_max: number
  target_rir_min: number
  target_rir_max: number
}

// Matches the convention already used for the seeded exercise library
// (see 20260729010000_adaptive_advice.sql): compound lifts get a lower rep
// range and a bigger progression step, isolation work stays higher-rep.
const DEFAULTS: Record<ExerciseKind, ExerciseTargets> = {
  compound: { rep_range_min: 6, rep_range_max: 10, target_rir_min: 2, target_rir_max: 3 },
  isolation: { rep_range_min: 10, rep_range_max: 15, target_rir_min: 2, target_rir_max: 3 },
}

/** Default rep-range/RIR targets for a newly auto-created exercise entry. */
export function defaultTargetsForKind(kind: ExerciseKind): ExerciseTargets {
  return DEFAULTS[kind]
}
