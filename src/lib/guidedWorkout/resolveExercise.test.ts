import { describe, expect, it } from 'vitest'
import { pickExerciseMatch } from './resolveExercise'
import type { ExerciseCandidate } from './resolveExercise'

function makeCandidate(overrides: Partial<ExerciseCandidate>): ExerciseCandidate {
  return {
    id: 'id',
    name: 'Barbell Bench Press',
    muscle_group: null,
    kind: 'compound',
    rep_range_min: 6,
    rep_range_max: 10,
    target_rir_min: 2,
    target_rir_max: 3,
    user_id: null,
    ...overrides,
  }
}

describe('pickExerciseMatch', () => {
  it('returns null when there are no candidates', () => {
    expect(pickExerciseMatch([], 'user-1')).toBeNull()
  })

  it('prefers a row the user owns over a shared row', () => {
    const shared = makeCandidate({ id: 'shared', user_id: null })
    const own = makeCandidate({ id: 'own', user_id: 'user-1' })
    expect(pickExerciseMatch([shared, own], 'user-1')?.id).toBe('own')
  })

  it('falls back to the shared row when the user has no own match', () => {
    const shared = makeCandidate({ id: 'shared', user_id: null })
    expect(pickExerciseMatch([shared], 'user-1')?.id).toBe('shared')
  })

  it('falls back to the first candidate when none match the user exactly', () => {
    // RLS already restricts the query to own+shared rows in practice — this
    // just documents the fallback behavior of the pure function itself.
    const someoneElses = makeCandidate({ id: 'other', user_id: 'user-2' })
    expect(pickExerciseMatch([someoneElses], 'user-1')?.id).toBe('other')
  })
})
