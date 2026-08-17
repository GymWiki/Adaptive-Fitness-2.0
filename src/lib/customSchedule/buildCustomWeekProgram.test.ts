import { describe, expect, it } from 'vitest'
import { buildCustomWeekProgram, todayWeekdayIndex } from './buildCustomWeekProgram'
import type { CustomScheduleAssignment, CustomWorkout } from './types'
import type { Exercise } from '../types'

function exercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: 'ex-1',
    name: 'Bench press',
    muscle_group: 'chest',
    kind: 'compound',
    rep_range_min: 6,
    rep_range_max: 10,
    target_rir_min: 2,
    target_rir_max: 3,
    ...overrides,
  }
}

const REST_ASSIGNMENT: CustomScheduleAssignment = {
  mon: null,
  tue: null,
  wed: null,
  thu: null,
  fri: null,
  sat: null,
  sun: null,
}

// 2024-01-01 was a Monday, so this week's dates map cleanly to weekday indices.
const MONDAY = new Date(2024, 0, 1)
const WEDNESDAY = new Date(2024, 0, 3)
const SUNDAY = new Date(2024, 0, 7)

describe('todayWeekdayIndex', () => {
  it('maps Monday to index 0 and Sunday to index 6', () => {
    expect(todayWeekdayIndex(MONDAY)).toBe(0)
    expect(todayWeekdayIndex(WEDNESDAY)).toBe(2)
    expect(todayWeekdayIndex(SUNDAY)).toBe(6)
  })
})

describe('buildCustomWeekProgram', () => {
  it('renders every unassigned day as rest', () => {
    const { program } = buildCustomWeekProgram([], REST_ASSIGNMENT, new Map(), MONDAY)
    expect(program.week).toHaveLength(7)
    expect(program.week.every((slot) => slot.type === 'rest')).toBe(true)
    expect(program.allocation).toEqual({ strengthDays: 0, runningDays: 0, restDays: 7 })
    expect(program.runningPlan).toBeNull()
  })

  it('builds a strength day whose reps/RIR come from the exercise, not the workout entry', () => {
    const push: CustomWorkout = {
      id: 'w-push',
      name: 'Push',
      exercises: [{ exerciseId: 'ex-1', sets: 3, restSeconds: '90', note: 'Warm up first' }],
    }
    const exercisesById = new Map([['ex-1', exercise({ rep_range_min: 8, rep_range_max: 12, target_rir_min: 1, target_rir_max: 2 })]])
    const assignment: CustomScheduleAssignment = { ...REST_ASSIGNMENT, mon: 'w-push' }

    const { program } = buildCustomWeekProgram([push], assignment, exercisesById, MONDAY)

    const monday = program.week[0]
    expect(monday.type).toBe('strength')
    if (monday.type !== 'strength') throw new Error('expected strength slot')
    expect(monday.day.label).toBe('Push')
    expect(monday.day.exercises).toEqual([
      {
        patternId: 'ex-1',
        name: 'Bench press',
        sets: 3,
        reps: '8-12',
        restSeconds: '90',
        rir: 'RIR 1-2',
        note: 'Warm up first',
      },
    ])
  })

  it('places the same workout on multiple days without duplicating data', () => {
    const push: CustomWorkout = {
      id: 'w-push',
      name: 'Push',
      exercises: [{ exerciseId: 'ex-1', sets: 3, restSeconds: '90' }],
    }
    const assignment: CustomScheduleAssignment = { ...REST_ASSIGNMENT, mon: 'w-push', thu: 'w-push' }
    const { program } = buildCustomWeekProgram([push], assignment, new Map([['ex-1', exercise()]]), MONDAY)

    expect(program.week[0].type).toBe('strength')
    expect(program.week[3].type).toBe('strength')
    expect(program.allocation.strengthDays).toBe(2)
    expect(program.allocation.restDays).toBe(5)
  })

  it('falls back to rest for a day referencing a since-deleted workout', () => {
    const assignment: CustomScheduleAssignment = { ...REST_ASSIGNMENT, tue: 'gone' }
    const { program } = buildCustomWeekProgram([], assignment, new Map(), MONDAY)
    expect(program.week[1]).toEqual({ type: 'rest' })
  })

  it('reports todayIndex matching the given date', () => {
    const { todayIndex } = buildCustomWeekProgram([], REST_ASSIGNMENT, new Map(), WEDNESDAY)
    expect(todayIndex).toBe(2)
  })
})
