import { describe, expect, it } from 'vitest'
import { computeCycleState } from './cycleProgress'
import { generateProgram } from './programGenerator'
import type { DaySlot } from './programGenerator'

const isTraining = (day: DaySlot) => day.type === 'training'

describe('computeCycleState', () => {
  it('recommends the first day and marks nothing done when no workouts are logged', () => {
    const { week } = generateProgram(6, 'full_gym', 'intermediate', 'hypertrophy')
    const state = computeCycleState(week, 0, isTraining)
    expect(state.recommendedIndex).toBe(0)
    expect(state.doneInCycle.every((done) => !done)).toBe(true)
  })

  it('walks through a 6-day PPL cycle one training day at a time, landing on rest at the end', () => {
    const { week } = generateProgram(6, 'full_gym', 'intermediate', 'hypertrophy')
    // Push, Pull, Legs, Push, Pull, Legs, Rest

    const afterOne = computeCycleState(week, 1, isTraining)
    expect(afterOne.doneInCycle).toEqual([true, false, false, false, false, false, false])
    expect(afterOne.recommendedIndex).toBe(1)

    const afterSix = computeCycleState(week, 6, isTraining)
    expect(afterSix.doneInCycle).toEqual([true, true, true, true, true, true, false])
    expect(afterSix.recommendedIndex).toBe(6) // the rest day

    // A 7th workout starts a new cycle: only the first training day is done again.
    const afterSeven = computeCycleState(week, 7, isTraining)
    expect(afterSeven.doneInCycle).toEqual([true, false, false, false, false, false, false])
    expect(afterSeven.recommendedIndex).toBe(1)
  })

  it('can recommend a rest day mid-cycle when the template interleaves rest between training days', () => {
    const { week } = generateProgram(4, 'full_gym', 'intermediate', 'hypertrophy')
    // Upper Power, Lower Power, Rest, Upper Hyp, Lower Hyp, Rest, Rest
    const state = computeCycleState(week, 2, isTraining)
    expect(week[2].type).toBe('rest')
    expect(state.recommendedIndex).toBe(2)
    expect(state.doneInCycle).toEqual([true, true, false, false, false, false, false])
  })

  it('cycles a 1-day/week template back to its single training day each time', () => {
    const { week } = generateProgram(1, 'full_gym', 'intermediate', 'hypertrophy')
    expect(computeCycleState(week, 1, isTraining).recommendedIndex).toBe(1)
    expect(computeCycleState(week, 2, isTraining).recommendedIndex).toBe(1)
    expect(computeCycleState(week, 3, isTraining).recommendedIndex).toBe(1)
  })

  it('never marks the active_recovery day itself as done', () => {
    const { week } = generateProgram(7, 'full_gym', 'intermediate', 'hypertrophy')
    const recoveryIndex = week.findIndex((day) => day.type === 'active_recovery')
    for (let total = 0; total <= 8; total++) {
      expect(computeCycleState(week, total, isTraining).doneInCycle[recoveryIndex]).toBe(false)
    }
  })
})
