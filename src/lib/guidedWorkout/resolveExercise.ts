import { findExerciseByName, insertExercise } from '../sheets/exercises'
import type { Exercise } from '../types'
import type { ExerciseKind } from '../programGenerator'

/**
 * Resolves a planned exercise (from the active program) to a row in the
 * user's own spreadsheet, matching by exact name — creating one with
 * sensible compound/isolation defaults if it doesn't exist yet. See
 * docs/superpowers/specs/2026-07-30-guided-workout-logging-design.md and
 * docs/superpowers/specs/2026-08-01-migrate-domains-phase3-design.md.
 */
export async function resolveOrCreateExercise(name: string, kind: ExerciseKind): Promise<Exercise> {
  const existing = await findExerciseByName(name)
  if (existing) return existing
  return insertExercise({ name, kind })
}
