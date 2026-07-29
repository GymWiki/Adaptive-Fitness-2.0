import { describe, expect, it } from 'vitest'
import { estimateOneRepMax, oneRepMaxTrend } from './estimateOneRepMax'
import type { LoggedSet } from './types'

describe('estimateOneRepMax', () => {
  it('is a no-op multiplier of 1 rep at true failure (Epley approximation, not exact)', () => {
    expect(estimateOneRepMax(100, 1, 0)).toBeCloseTo(103.33, 1)
  })

  it('applies the Epley formula for reps beyond one', () => {
    // 100 * (1 + 10/30) = 133.33...
    expect(estimateOneRepMax(100, 10, 0)).toBeCloseTo(133.33, 1)
  })

  it('adds RIR to the effective reps, since reps-in-reserve sets are submaximal', () => {
    const withoutReserve = estimateOneRepMax(100, 8, 0)
    const withReserve = estimateOneRepMax(100, 8, 3)
    expect(withReserve).toBeGreaterThan(withoutReserve)
    expect(withReserve).toBeCloseTo(estimateOneRepMax(100, 11, 0), 5)
  })
})

describe('oneRepMaxTrend', () => {
  const sets: LoggedSet[] = [
    {
      setId: 's1',
      workoutId: 'w1',
      performedAt: '2026-01-01',
      weightKg: 80,
      reps: 8,
      rir: 2,
    },
    {
      setId: 's2',
      workoutId: 'w1',
      performedAt: '2026-01-01',
      weightKg: 85,
      reps: 5,
      rir: 1,
    },
    {
      setId: 's3',
      workoutId: 'w2',
      performedAt: '2026-01-08',
      weightKg: 90,
      reps: 5,
      rir: 2,
    },
  ]

  it('takes the best estimated 1RM within each workout', () => {
    const trend = oneRepMaxTrend(sets)
    expect(trend).toHaveLength(2)
    expect(trend[0].workoutId).toBe('w1')
    // 80kg×8@RIR2 (effective 10 reps) out-scores 85kg×5@RIR1 (effective 6 reps).
    expect(trend[0].estimated1RM).toBeCloseTo(estimateOneRepMax(80, 8, 2), 5)
  })

  it('sorts points oldest to newest regardless of input order', () => {
    const reversed = [...sets].reverse()
    const trend = oneRepMaxTrend(reversed)
    expect(trend.map((point) => point.workoutId)).toEqual(['w1', 'w2'])
  })

  it('returns an empty trend for no sets', () => {
    expect(oneRepMaxTrend([])).toEqual([])
  })
})
