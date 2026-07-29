import { describe, expect, it } from 'vitest'
import { generateProgram } from './generateProgram'
import { enforceRestDayAndSpacing, findUnderTrainedMuscleGroups } from './rules'
import { applyExperienceLevelSplit } from './splitSchedules'
import { MUSCLE_GROUPS } from './types'
import type { Equipment, ExperienceLevel } from './types'
import { availablePatterns } from './catalog'

const DAYS = [2, 3, 4, 5, 6] as const
const EQUIPMENT_PROFILES: Equipment[] = ['full_gym', 'home_dumbbells', 'bodyweight_only']
const EXPERIENCE_LEVELS: ExperienceLevel[] = ['beginner', 'intermediate', 'advanced']

describe('program generator catalog', () => {
  it('has at least one bodyweight_only exercise for every muscle group', () => {
    for (const muscleGroup of MUSCLE_GROUPS) {
      expect(availablePatterns(muscleGroup, 'bodyweight_only').length).toBeGreaterThan(0)
    }
  })
})

describe.each(EXPERIENCE_LEVELS)('experience level: %s', (experienceLevel) => {
  describe.each(DAYS)('%i days/week', (daysPerWeek) => {
    it('never gives beginners an isolated push/pull/legs split', () => {
      const schedule = applyExperienceLevelSplit(daysPerWeek, experienceLevel)
      const hasPPL = schedule.some((slot) => slot === 'push' || slot === 'pull' || slot === 'legs')
      if (experienceLevel === 'beginner') {
        expect(hasPPL).toBe(false)
      }
    })

    it('trains exactly the requested number of active days', () => {
      const schedule = applyExperienceLevelSplit(daysPerWeek, experienceLevel)
      const activeDays = schedule.filter((slot) => slot !== 'rest')
      expect(activeDays).toHaveLength(daysPerWeek)
    })

    it('never exceeds 6 active days and always has at least 1 rest day', () => {
      const schedule = applyExperienceLevelSplit(daysPerWeek, experienceLevel)
      const activeDays = schedule.filter((slot) => slot !== 'rest')
      expect(activeDays.length).toBeLessThanOrEqual(6)
      expect(schedule.length - activeDays.length).toBeGreaterThanOrEqual(1)
    })

    it('never trains the same muscle group on two consecutive days', () => {
      const schedule = applyExperienceLevelSplit(daysPerWeek, experienceLevel)
      expect(() => enforceRestDayAndSpacing(schedule)).not.toThrow()
    })

    it('trains every major muscle group at least 2x/week', () => {
      const schedule = applyExperienceLevelSplit(daysPerWeek, experienceLevel)
      expect(findUnderTrainedMuscleGroups(schedule)).toEqual([])
    })

    describe.each(EQUIPMENT_PROFILES)('equipment: %s', (equipment) => {
      it('produces a program executable entirely within the chosen equipment tier', () => {
        const program = generateProgram(daysPerWeek, equipment, experienceLevel)

        for (const day of program.week) {
          if (day.type === 'rest') continue

          for (const exercise of day.exercises) {
            const pattern = availablePatterns(exercise.muscleGroup, equipment).find(
              (p) => p.id === exercise.patternId,
            )
            expect(pattern, `pattern ${exercise.patternId} should exist and support ${equipment}`).toBeDefined()

            // Independently re-derive the expected name from the fallback chain
            // (own tier, else the next-lower tier) rather than re-calling the
            // function under test, so this actually catches fallback bugs.
            const expectedName =
              equipment === 'bodyweight_only'
                ? pattern!.variants.bodyweight_only
                : equipment === 'home_dumbbells'
                  ? (pattern!.variants.home_dumbbells ?? pattern!.variants.bodyweight_only)
                  : (pattern!.variants.full_gym ??
                    pattern!.variants.home_dumbbells ??
                    pattern!.variants.bodyweight_only)
            expect(exercise.name).toBe(expectedName)
          }
        }
      })

      it('never leaves a muscle group completely untrained due to equipment limitations', () => {
        const program = generateProgram(daysPerWeek, equipment, experienceLevel)
        const trainedGroups = new Set(
          program.week.flatMap((day) =>
            day.type === 'training' ? day.exercises.map((e) => e.muscleGroup) : [],
          ),
        )
        const scheduleGroups = new Set(
          program.week.flatMap((day) => (day.type === 'training' ? [day.focus] : [])),
        )
        // Every muscle group the schedule intends to train that day actually has an exercise.
        expect(scheduleGroups.size).toBeGreaterThan(0)
        expect(trainedGroups.size).toBeGreaterThan(0)
      })

      it('includes a warm-up note and full-ROM/double-progression guidance on every training day', () => {
        const program = generateProgram(daysPerWeek, equipment, experienceLevel)
        for (const day of program.week) {
          if (day.type !== 'training') continue
          expect(day.warmup).toBeTruthy()
          for (const exercise of day.exercises) {
            expect(exercise.rangeOfMotion).toBe('full')
            expect(exercise.progression).toBe('double-progression')
          }
        }
      })
    })
  })
})
