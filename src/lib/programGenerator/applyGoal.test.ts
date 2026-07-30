import { describe, expect, it } from 'vitest'
import { applyGoal } from './applyGoal'
import type { ExerciseKind, Goal, PlannedExercise } from './types'

const KIND_MAP: Record<string, ExerciseKind> = {
  squat: 'compound',
  curl: 'isolation',
}

function makeExercises(): PlannedExercise[] {
  return [
    { patternId: 'squat', name: 'Squat', sets: 4, reps: '6-10', restSeconds: '120', rir: '' },
    { patternId: 'curl', name: 'Curl', sets: 3, reps: '10-15', restSeconds: '60', rir: '' },
  ]
}

const GOALS: Goal[] = ['hypertrophy', 'strength', 'fat_loss', 'conditioning', 'mix']

describe('applyGoal', () => {
  it('leaves reps/rest/sets untouched for hypertrophy, fat_loss, and mix', () => {
    for (const goal of ['hypertrophy', 'fat_loss', 'mix'] as Goal[]) {
      const result = applyGoal(makeExercises(), KIND_MAP, 'standard', goal, false)
      expect(result[0]).toMatchObject({ reps: '6-10', restSeconds: '120', sets: 4 })
      expect(result[1]).toMatchObject({ reps: '10-15', restSeconds: '60', sets: 3 })
    }
  })

  it('tightens only compound exercises for strength, leaving isolation as-is', () => {
    const result = applyGoal(makeExercises(), KIND_MAP, 'standard', 'strength', false)
    expect(result[0]).toMatchObject({ reps: '3-6', rir: 'RIR 1-2', restSeconds: '150-180' })
    expect(result[1]).toMatchObject({ reps: '10-15', restSeconds: '60' })
  })

  it('reduces every exercise by one set for conditioning, with a floor of 2', () => {
    const result = applyGoal(makeExercises(), KIND_MAP, 'standard', 'conditioning', false)
    expect(result[0].sets).toBe(3)
    expect(result[1].sets).toBe(2)

    const alreadyLow: PlannedExercise[] = [
      { patternId: 'squat', name: 'Squat', sets: 2, reps: '6-10', restSeconds: '120', rir: '' },
    ]
    expect(applyGoal(alreadyLow, KIND_MAP, 'standard', 'conditioning', false)[0].sets).toBe(2)
  })

  it('never changes reps/rest/sets for goalOverrideExempt templates, regardless of goal', () => {
    for (const goal of GOALS) {
      const result = applyGoal(makeExercises(), KIND_MAP, 'hit', goal, true)
      expect(result[0]).toMatchObject({ reps: '6-10', restSeconds: '120', sets: 4 })
      expect(result[1]).toMatchObject({ reps: '10-15', restSeconds: '60', sets: 3 })
    }
  })

  it('assigns the day-kind baseline RIR whenever a goal does not override it', () => {
    const result = applyGoal(makeExercises(), KIND_MAP, 'power', 'hypertrophy', false)
    expect(result[0].rir).toBe('RIR 1-2')
    expect(result[1].rir).toBe('RIR 1-2')
  })
})
