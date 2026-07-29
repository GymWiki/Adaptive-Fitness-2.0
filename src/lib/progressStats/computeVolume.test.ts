import { describe, expect, it } from 'vitest'
import { computeVolume } from './computeVolume'
import type { LoggedSet } from './types'

describe('computeVolume', () => {
  it('sums weight × reps across sets within the same workout', () => {
    const sets: LoggedSet[] = [
      { setId: 's1', workoutId: 'w1', performedAt: '2026-01-01', weightKg: 80, reps: 8, rir: 2 },
      { setId: 's2', workoutId: 'w1', performedAt: '2026-01-01', weightKg: 80, reps: 6, rir: 1 },
    ]
    const volume = computeVolume(sets)
    expect(volume).toHaveLength(1)
    expect(volume[0].volumeKg).toBe(80 * 8 + 80 * 6)
  })

  it('keeps separate workouts as separate points, sorted oldest to newest', () => {
    const sets: LoggedSet[] = [
      { setId: 's2', workoutId: 'w2', performedAt: '2026-01-08', weightKg: 90, reps: 5, rir: 2 },
      { setId: 's1', workoutId: 'w1', performedAt: '2026-01-01', weightKg: 80, reps: 8, rir: 2 },
    ]
    const volume = computeVolume(sets)
    expect(volume.map((v) => v.workoutId)).toEqual(['w1', 'w2'])
  })

  it('returns an empty list for no sets', () => {
    expect(computeVolume([])).toEqual([])
  })
})
