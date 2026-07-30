import { supabase } from '../supabase'
import { EXERCISE_COLUMNS } from '../exerciseColumns'
import { defaultTargetsForKind } from './defaultTargetsForKind'
import type { Exercise } from '../types'
import type { ExerciseKind } from '../programGenerator'

export type ExerciseCandidate = Exercise & { user_id: string | null }

/**
 * Among exercises visible to the user (own + shared, already name-filtered
 * by the caller), prefers a row the user owns over the shared library, and
 * returns null when there's no match at all — the caller then creates one.
 */
export function pickExerciseMatch(
  candidates: ExerciseCandidate[],
  userId: string,
): ExerciseCandidate | null {
  return candidates.find((exercise) => exercise.user_id === userId) ?? candidates[0] ?? null
}

/**
 * Resolves a planned exercise (from the active program) to a row in the
 * user's exercise list, matching by exact name — creating one with sensible
 * compound/isolation defaults if it doesn't exist yet. See
 * docs/superpowers/specs/2026-07-30-guided-workout-logging-design.md.
 */
export async function resolveOrCreateExercise(
  userId: string,
  name: string,
  kind: ExerciseKind,
): Promise<Exercise> {
  const { data } = await supabase
    .from('exercises')
    .select(`${EXERCISE_COLUMNS}, user_id`)
    .ilike('name', name)

  const match = pickExerciseMatch((data as ExerciseCandidate[] | null) ?? [], userId)
  if (match) return match

  const { data: created, error } = await supabase
    .from('exercises')
    .insert({ name, user_id: userId, kind, ...defaultTargetsForKind(kind) })
    .select(EXERCISE_COLUMNS)
    .single()

  if (error || !created) {
    throw new Error(`Could not create exercise "${name}"`)
  }
  return created
}
