import { describe, expect, it } from 'vitest'
import { sortByPerformedAtDesc, toRawWorkout, toRawWorkoutSet } from './workouts'

describe('toRawWorkout', () => {
  it('maps an empty name to null', () => {
    expect(toRawWorkout({ id: 'w1', name: '', performed_at: '2026-01-01T00:00:00Z' })).toEqual({
      id: 'w1',
      name: null,
      performed_at: '2026-01-01T00:00:00Z',
    })
  })

  it('keeps a real name', () => {
    expect(toRawWorkout({ id: 'w1', name: 'Push day', performed_at: '2026-01-01' }).name).toBe('Push day')
  })
})

describe('toRawWorkoutSet', () => {
  it('parses every numeric field', () => {
    expect(
      toRawWorkoutSet({
        id: 's1',
        workout_id: 'w1',
        exercise_id: 'e1',
        set_order: '2',
        weight_kg: '82.5',
        reps: '8',
        rir: '2',
      }),
    ).toEqual({ id: 's1', workout_id: 'w1', exercise_id: 'e1', set_order: 2, weight_kg: 82.5, reps: 8, rir: 2 })
  })
})

describe('sortByPerformedAtDesc', () => {
  it('sorts newest first without mutating the input', () => {
    const input = [
      { id: 'a', name: null, performed_at: '2026-01-01' },
      { id: 'b', name: null, performed_at: '2026-01-15' },
      { id: 'c', name: null, performed_at: '2026-01-08' },
    ]
    const sorted = sortByPerformedAtDesc(input)
    expect(sorted.map((w) => w.id)).toEqual(['b', 'c', 'a'])
    expect(input.map((w) => w.id)).toEqual(['a', 'b', 'c']) // unchanged
  })
})
