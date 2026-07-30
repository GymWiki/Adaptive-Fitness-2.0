import { describe, expect, it } from 'vitest'
import { generateProgram } from './generateProgram'
import { getTemplate, TEMPLATES } from './templates'
import { availablePatterns, EXERCISE_CATALOG } from './catalog'
import { MUSCLE_GROUPS } from './types'
import type { Equipment, ExperienceLevel, Goal } from './types'

const DAYS = [1, 2, 3, 4, 5, 6, 7] as const
const EQUIPMENT_PROFILES: Equipment[] = ['full_gym', 'home_dumbbells', 'bodyweight_only']
const EXPERIENCE_LEVELS: ExperienceLevel[] = ['beginner', 'intermediate', 'advanced']

describe('program templates catalog', () => {
  it('has at least one bodyweight_only exercise for every muscle group', () => {
    for (const muscleGroup of MUSCLE_GROUPS) {
      expect(availablePatterns(muscleGroup, 'bodyweight_only').length).toBeGreaterThan(0)
    }
  })

  it('every template exercise references a real catalog pattern', () => {
    for (const daysPerWeek of DAYS) {
      const template = getTemplate(daysPerWeek)
      for (const day of template.week) {
        if (day.type !== 'training') continue
        for (const exercise of day.exercises) {
          const pattern = EXERCISE_CATALOG.find((p) => p.id === exercise.patternId)
          expect(pattern, `unknown pattern id ${exercise.patternId}`).toBeDefined()
        }
      }
    }
  })
})

describe('7 days/week template', () => {
  it('has exactly 6 training days and 1 active_recovery day, never 7 full sessions', () => {
    const template = TEMPLATES[7]
    const trainingDays = template.week.filter((day) => day.type === 'training')
    const recoveryDays = template.week.filter((day) => day.type === 'active_recovery')
    const restDays = template.week.filter((day) => day.type === 'rest')

    expect(trainingDays).toHaveLength(6)
    expect(recoveryDays).toHaveLength(1)
    expect(restDays).toHaveLength(0)
    expect(template.week).toHaveLength(7)
  })

  it('carries a disclaimer explaining the active recovery day is not a 7th training day', () => {
    expect(TEMPLATES[7].disclaimer).toBeTruthy()
    expect(TEMPLATES[7].disclaimer).toContain('hersteldag')
  })
})

describe('1 day/week template', () => {
  it('flags itself as a less mainstream approach', () => {
    expect(TEMPLATES[1].disclaimer).toBeTruthy()
  })
})

describe.each(DAYS)('%i days/week', (daysPerWeek) => {
  it('is a fixed template: identical output on repeated calls, not a variable generation', () => {
    const first = generateProgram(daysPerWeek, 'full_gym', 'intermediate', 'hypertrophy')
    const second = generateProgram(daysPerWeek, 'full_gym', 'intermediate', 'hypertrophy')
    expect(second).toEqual(first)
  })

  it('has exactly 7 days in the week', () => {
    const program = generateProgram(daysPerWeek, 'full_gym', 'intermediate', 'hypertrophy')
    expect(program.week).toHaveLength(7)
  })

  describe.each(EQUIPMENT_PROFILES)('equipment: %s', (equipment) => {
    describe.each(EXPERIENCE_LEVELS)('experience: %s', (experienceLevel) => {
      it('resolves every exercise to a concrete, equipment-appropriate name', () => {
        const program = generateProgram(daysPerWeek, equipment, experienceLevel, 'hypertrophy')
        for (const day of program.week) {
          if (day.type !== 'training') continue
          for (const exercise of day.exercises) {
            const pattern = EXERCISE_CATALOG.find((p) => p.id === exercise.patternId)!
            const expectedName =
              equipment === 'bodyweight_only'
                ? pattern.variants.bodyweight_only
                : equipment === 'home_dumbbells'
                  ? (pattern.variants.home_dumbbells ?? pattern.variants.bodyweight_only)
                  : (pattern.variants.full_gym ??
                    pattern.variants.home_dumbbells ??
                    pattern.variants.bodyweight_only)
            expect(exercise.name).toBe(expectedName)
            expect(exercise.sets).toBeGreaterThan(0)
          }
        }
      })
    })
  })

  it('only warns beginners away from high-frequency templates, never intermediate/advanced', () => {
    const beginner = generateProgram(daysPerWeek, 'full_gym', 'beginner', 'hypertrophy')
    const advanced = generateProgram(daysPerWeek, 'full_gym', 'advanced', 'hypertrophy')
    expect(advanced.experienceWarning).toBeNull()
    if (daysPerWeek >= 5) {
      expect(beginner.experienceWarning).toBeTruthy()
    } else {
      expect(beginner.experienceWarning).toBeNull()
    }
  })
})

describe('generateProgram input validation', () => {
  it('rejects day counts outside 1-7', () => {
    expect(() => generateProgram(0, 'full_gym', 'beginner', 'hypertrophy')).toThrow()
    expect(() => generateProgram(8, 'full_gym', 'beginner', 'hypertrophy')).toThrow()
  })
})

describe.each(DAYS)('%i days/week × goal', (daysPerWeek) => {
  const GOALS: Goal[] = ['hypertrophy', 'strength', 'fat_loss', 'conditioning', 'mix']

  it('keeps the same training-day split structure across every goal — only parameters differ', () => {
    // Goal is allowed to convert a spare rest day to cardio (that's the point
    // of §3) — what must stay fixed is which days train what.
    const programs = GOALS.map((goal) => generateProgram(daysPerWeek, 'full_gym', 'intermediate', goal))
    const trainingShape = (program: (typeof programs)[number]) =>
      program.week
        .filter((day): day is Extract<typeof day, { type: 'training' }> => day.type === 'training')
        .map((day) => ({ kind: day.kind, patternIds: day.exercises.map((e) => e.patternId) }))
    const baseline = trainingShape(programs[0])
    for (const program of programs.slice(1)) {
      expect(trainingShape(program)).toEqual(baseline)
    }
  })

  it('never changes reps for goalOverrideExempt templates (1 and 3 days/week)', () => {
    if (daysPerWeek !== 1 && daysPerWeek !== 3) return
    const programs = GOALS.map((goal) => generateProgram(daysPerWeek, 'full_gym', 'intermediate', goal))
    const reps = (program: (typeof programs)[number]) =>
      program.week
        .filter((day): day is Extract<typeof day, { type: 'training' }> => day.type === 'training')
        .map((day) => day.exercises.map((e) => e.reps))
    const baseline = reps(programs[0])
    for (const program of programs.slice(1)) {
      expect(reps(program)).toEqual(baseline)
    }
  })

  it('respects the rest-day invariant for every goal', () => {
    for (const goal of GOALS) {
      const program = generateProgram(daysPerWeek, 'full_gym', 'intermediate', goal)
      // "Active" = training or cardio; active_recovery and rest are the
      // genuine down days and never count toward the 6-day ceiling.
      const activeDays = program.week.filter(
        (day) => day.type === 'training' || day.type === 'cardio',
      ).length
      const downDays = program.week.filter(
        (day) => day.type === 'rest' || day.type === 'active_recovery',
      ).length
      expect(activeDays).toBeLessThanOrEqual(6)
      expect(downDays).toBeGreaterThanOrEqual(1)
    }
  })
})
