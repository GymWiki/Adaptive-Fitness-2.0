import { describe, expect, it } from 'vitest'
import { createInitialGuidedState, guidedWorkoutReducer } from './reducer'
import type { GuidedState } from './reducer'
import type { Exercise } from '../types'
import type { PlannedExercise } from '../programGenerator'

function makeExercise(id: string, sets: number): { resolved: Exercise; planned: PlannedExercise } {
  return {
    resolved: {
      id,
      name: id,
      muscle_group: null,
      kind: 'compound',
      rep_range_min: 6,
      rep_range_max: 10,
      target_rir_min: 2,
      target_rir_max: 3,
    },
    planned: { patternId: id, name: id, sets, reps: '6-10', restSeconds: '90', rir: 'RIR 2-3' },
  }
}

function logSet(state: GuidedState, setRowId: string) {
  return guidedWorkoutReducer(state, { type: 'SET_LOGGED', setRowId, weight: 80, reps: 8, rir: 2 })
}

describe('createInitialGuidedState', () => {
  it('starts active on the first exercise with no logged sets', () => {
    const state = createInitialGuidedState([makeExercise('a', 3), makeExercise('b', 2)])
    expect(state.phase).toBe('active')
    expect(state.exerciseIndex).toBe(0)
    expect(state.exercises[0].targetSets).toBe(3)
    expect(state.exercises[0].loggedSets).toEqual([])
  })

  it('starts done when there are no exercises', () => {
    expect(createInitialGuidedState([]).phase).toBe('done')
  })
})

describe('guidedWorkoutReducer', () => {
  it('moves to resting after a non-final set', () => {
    const state = createInitialGuidedState([makeExercise('a', 2), makeExercise('b', 1)])
    const next = logSet(state, 'set-1')
    expect(next.phase).toBe('resting')
    expect(next.exercises[0].loggedSets).toHaveLength(1)
  })

  it('stays in resting (not done) after the final set of a non-final exercise', () => {
    const state = createInitialGuidedState([makeExercise('a', 1), makeExercise('b', 1)])
    const next = logSet(state, 'set-1')
    expect(next.phase).toBe('resting')
    expect(next.exerciseIndex).toBe(0)
  })

  it('goes straight to done on the final set of the final exercise, skipping resting', () => {
    const state = createInitialGuidedState([makeExercise('a', 1)])
    const next = logSet(state, 'set-1')
    expect(next.phase).toBe('done')
  })

  it('CONTINUE is a no-op outside of resting', () => {
    const state = createInitialGuidedState([makeExercise('a', 2)])
    const next = guidedWorkoutReducer(state, { type: 'CONTINUE' })
    expect(next).toEqual(state)
  })

  it('CONTINUE returns to active on the same exercise when its target is not yet reached', () => {
    let state = createInitialGuidedState([makeExercise('a', 2), makeExercise('b', 1)])
    state = logSet(state, 'set-1') // 1 of 2 logged, still resting
    const next = guidedWorkoutReducer(state, { type: 'CONTINUE' })
    expect(next.phase).toBe('active')
    expect(next.exerciseIndex).toBe(0)
  })

  it('CONTINUE advances to the next exercise once the target is reached', () => {
    let state = createInitialGuidedState([makeExercise('a', 1), makeExercise('b', 1)])
    state = logSet(state, 'set-1')
    const next = guidedWorkoutReducer(state, { type: 'CONTINUE' })
    expect(next.phase).toBe('active')
    expect(next.exerciseIndex).toBe(1)
  })

  it('ADD_EXTRA_SET raises the target for only the current exercise', () => {
    const state = createInitialGuidedState([makeExercise('a', 1), makeExercise('b', 1)])
    const next = guidedWorkoutReducer(state, { type: 'ADD_EXTRA_SET' })
    expect(next.exercises[0].targetSets).toBe(2)
    expect(next.exercises[1].targetSets).toBe(1)
  })

  it('adding an extra set after the would-be-final set delays advancing to the next exercise', () => {
    let state = createInitialGuidedState([makeExercise('a', 1), makeExercise('b', 1)])
    state = logSet(state, 'set-1') // reaches original target of 1, phase: resting
    state = guidedWorkoutReducer(state, { type: 'ADD_EXTRA_SET' }) // target now 2
    const afterContinue = guidedWorkoutReducer(state, { type: 'CONTINUE' })
    expect(afterContinue.phase).toBe('active')
    expect(afterContinue.exerciseIndex).toBe(0) // stayed, since 1 logged < 2 target

    const afterSecondSet = logSet(afterContinue, 'set-2')
    expect(afterSecondSet.phase).toBe('resting')
    const afterSecondContinue = guidedWorkoutReducer(afterSecondSet, { type: 'CONTINUE' })
    expect(afterSecondContinue.exerciseIndex).toBe(1) // now advances
  })

  it('START_EDIT/CANCEL_EDIT set and clear the editing pointer without touching phase', () => {
    const state = createInitialGuidedState([makeExercise('a', 2)])
    const editing = guidedWorkoutReducer(state, { type: 'START_EDIT', exerciseIndex: 0, setIndex: 0 })
    expect(editing.editing).toEqual({ exerciseIndex: 0, setIndex: 0 })
    expect(editing.phase).toBe('active')

    const cancelled = guidedWorkoutReducer(editing, { type: 'CANCEL_EDIT' })
    expect(cancelled.editing).toBeNull()
  })

  it('SET_UPDATED overwrites a specific logged set and clears editing', () => {
    let state = createInitialGuidedState([makeExercise('a', 2)])
    state = logSet(state, 'set-1')
    state = guidedWorkoutReducer(state, { type: 'START_EDIT', exerciseIndex: 0, setIndex: 0 })

    const updated = guidedWorkoutReducer(state, {
      type: 'SET_UPDATED',
      exerciseIndex: 0,
      setIndex: 0,
      weight: 82.5,
      reps: 7,
      rir: 1,
    })
    expect(updated.exercises[0].loggedSets[0]).toEqual({
      setRowId: 'set-1',
      weight: 82.5,
      reps: 7,
      rir: 1,
    })
    expect(updated.editing).toBeNull()
    expect(updated.phase).toBe('resting') // unaffected by the edit
  })
})
