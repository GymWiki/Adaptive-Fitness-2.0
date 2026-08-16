import { describe, expect, it } from 'vitest'
import { applyInterferenceSpacing, isLegHeavyStrengthDay } from './applyInterferenceSpacing'
import type { CombinedDaySlot } from './types'
import type { DaySlot, PlannedExercise } from '../programGenerator'

function exercise(patternId: string): PlannedExercise {
  return { patternId, name: patternId, sets: 3, reps: '8-12', restSeconds: '90', rir: 'RIR 2-3' }
}

function legDay(): Extract<DaySlot, { type: 'training' }> {
  return { type: 'training', label: 'Legs', kind: 'hypertrophy', exercises: [exercise('quad-squat')] }
}

function upperDay(): Extract<DaySlot, { type: 'training' }> {
  return { type: 'training', label: 'Upper', kind: 'hypertrophy', exercises: [exercise('chest-press')] }
}

function hardRun(): CombinedDaySlot {
  return { type: 'running', session: { type: 'tempo', label: 'Tempotraining', distanceKm: 8, description: '' } }
}

function easyRun(): CombinedDaySlot {
  return { type: 'running', session: { type: 'easy', label: 'Rustige duurloop', distanceKm: 5, description: '' } }
}

const REST: CombinedDaySlot = { type: 'rest' }
const strength = (day: Extract<DaySlot, { type: 'training' }>): CombinedDaySlot => ({ type: 'strength', day })

describe('isLegHeavyStrengthDay', () => {
  it('flags a day with a leg exercise', () => {
    expect(isLegHeavyStrengthDay(legDay())).toBe(true)
  })

  it('does not flag an upper-body-only day', () => {
    expect(isLegHeavyStrengthDay(upperDay())).toBe(false)
  })

  it('does not flag rest/active_recovery/cardio slots', () => {
    expect(isLegHeavyStrengthDay({ type: 'rest' })).toBe(false)
  })
})

describe('applyInterferenceSpacing', () => {
  it('leaves a week with no conflicts unchanged', () => {
    const week = [strength(upperDay()), REST, easyRun(), REST, strength(legDay()), REST, REST]
    expect(applyInterferenceSpacing(week)).toEqual(week)
  })

  it('swaps a hard running session away from a day adjacent to a leg day, into a free rest slot', () => {
    const week = [strength(legDay()), hardRun(), REST, REST, REST, REST, REST]
    const result = applyInterferenceSpacing(week)

    expect(result[1]).toEqual(REST) // no longer adjacent to the leg day
    expect(result.some((slot) => slot.type === 'running' && slot.session.type === 'tempo')).toBe(true)
    // the hard run must not end up adjacent to the leg day (index 0) after the swap either
    const newHardIndex = result.findIndex((slot) => slot.type === 'running' && slot.session.type === 'tempo')
    expect(Math.abs(newHardIndex - 0)).toBeGreaterThan(1)
  })

  it('leaves the conflict in place when no valid alternative rest slot exists', () => {
    const week = [strength(legDay()), hardRun(), strength(legDay()), strength(legDay()), strength(legDay()), strength(legDay()), strength(legDay())]
    const result = applyInterferenceSpacing(week)
    expect(result).toEqual(week) // no rest slot anywhere to swap into
  })

  it('does not touch easy running sessions even next to a leg day', () => {
    const week = [strength(legDay()), easyRun(), REST, REST, REST, REST, REST]
    expect(applyInterferenceSpacing(week)).toEqual(week)
  })
})
