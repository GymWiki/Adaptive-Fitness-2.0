import { describe, expect, it } from 'vitest'
import { applyCardio } from './applyCardio'
import type { DaySlot } from './types'

const TRAINING_DAY: DaySlot = { type: 'training', label: 'Day', kind: 'standard', exercises: [] }

function week(...types: Array<'training' | 'rest' | 'active_recovery'>): DaySlot[] {
  return types.map((type) =>
    type === 'active_recovery'
      ? { type: 'active_recovery', description: 'recovery' }
      : type === 'rest'
        ? { type: 'rest' }
        : TRAINING_DAY,
  )
}

describe('applyCardio', () => {
  it('adds no cardio slots and one note bullet for hypertrophy and strength', () => {
    for (const goal of ['hypertrophy', 'strength'] as const) {
      const input = week('training', 'rest', 'training', 'rest')
      const result = applyCardio(input, goal)
      expect(result.week).toEqual(input)
      expect(result.extraNotes).toHaveLength(1)
    }
  })

  it('is a no-op when the week already has an active_recovery day', () => {
    const input = week('training', 'training', 'training', 'active_recovery')
    const result = applyCardio(input, 'conditioning')
    expect(result.week).toEqual(input)
    expect(result.extraNotes).toEqual([])
  })

  it('converts rest days to cardio days while always keeping at least one rest day', () => {
    // 5 rest days available, fat_loss wants 2 sessions — plenty of room.
    const input = week('training', 'rest', 'rest', 'rest', 'rest', 'rest', 'rest')
    const result = applyCardio(input, 'fat_loss')
    const cardioCount = result.week.filter((d) => d.type === 'cardio').length
    const restCount = result.week.filter((d) => d.type === 'rest').length
    expect(cardioCount).toBe(2)
    expect(restCount).toBeGreaterThanOrEqual(1)
  })

  it('never converts the only rest day, falling back to training-day add-ons instead', () => {
    // 4-day-style week: 2 training days, 1 rest day, conditioning wants 3 sessions.
    const input = week('training', 'rest', 'training')
    const result = applyCardio(input, 'conditioning')

    const restCount = result.week.filter((d) => d.type === 'rest').length
    expect(restCount).toBe(1)

    const cardioCount = result.week.filter((d) => d.type === 'cardio').length
    expect(cardioCount).toBe(0) // reservable = restIndices.length - 1 = 0

    const addOnCount = result.week.filter(
      (d) => d.type === 'training' && d.cardioAddOn !== undefined,
    ).length
    expect(addOnCount).toBe(2) // capped at the 2 available training days
  })

  it('splits the dose between a dedicated cardio day and an add-on when rest days are scarce', () => {
    // 2 rest days, 3 training days, conditioning wants 3 sessions:
    // 1 dedicated (reservable = 2-1 = 1), 2 owed as add-ons.
    const input = week('training', 'rest', 'training', 'rest', 'training')
    const result = applyCardio(input, 'conditioning')

    expect(result.week.filter((d) => d.type === 'cardio')).toHaveLength(1)
    expect(result.week.filter((d) => d.type === 'rest')).toHaveLength(1)
    expect(
      result.week.filter((d) => d.type === 'training' && d.cardioAddOn !== undefined),
    ).toHaveLength(2)
  })

  it('never touches training-day exercises, only adds the cardioAddOn field', () => {
    const withExercises: DaySlot = {
      type: 'training',
      label: 'Day',
      kind: 'standard',
      exercises: [{ patternId: 'squat', name: 'Squat', sets: 3, reps: '8-12', restSeconds: '90', rir: 'RIR 2-3' }],
    }
    const result = applyCardio([withExercises, { type: 'rest' }], 'mix')
    const trainingDay = result.week.find((d) => d.type === 'training')
    expect(trainingDay?.type === 'training' && trainingDay.exercises).toEqual(withExercises.exercises)
  })
})
