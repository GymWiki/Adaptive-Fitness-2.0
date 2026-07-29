import { describe, expect, it } from 'vitest'
import { detectPRs } from './detectPRs'
import type { LoggedSet } from './types'

function makeSet(overrides: Partial<LoggedSet>): LoggedSet {
  return {
    setId: 's',
    workoutId: 'w',
    performedAt: '2026-01-01',
    weightKg: 100,
    reps: 5,
    rir: 2,
    ...overrides,
  }
}

describe('detectPRs', () => {
  it('flags the very first set as a PR', () => {
    const sets = [makeSet({ setId: 's1' })]
    const records = detectPRs(sets)
    expect(records).toHaveLength(1)
    expect(records[0].setId).toBe('s1')
  })

  it('only flags a set when it beats the running best estimated 1RM', () => {
    const sets = [
      makeSet({ setId: 's1', performedAt: '2026-01-01', weightKg: 80, reps: 8, rir: 2 }),
      makeSet({ setId: 's2', performedAt: '2026-01-08', weightKg: 80, reps: 6, rir: 1 }), // worse
      makeSet({ setId: 's3', performedAt: '2026-01-15', weightKg: 85, reps: 8, rir: 2 }), // new best
    ]
    const records = detectPRs(sets)
    expect(records.map((r) => r.setId)).toEqual(['s1', 's3'])
  })

  it('sorts input chronologically before scanning, regardless of order given', () => {
    const older = makeSet({ setId: 's1', performedAt: '2026-01-01', weightKg: 80, reps: 8, rir: 2 })
    const newer = makeSet({ setId: 's2', performedAt: '2026-01-15', weightKg: 90, reps: 8, rir: 2 })
    const records = detectPRs([newer, older])
    expect(records.map((r) => r.setId)).toEqual(['s1', 's2'])
  })

  it('returns nothing for no sets', () => {
    expect(detectPRs([])).toEqual([])
  })
})
