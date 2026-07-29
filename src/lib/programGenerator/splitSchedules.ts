import type { DayFocus, ExperienceLevel } from './types'

export type ScheduleSlot = DayFocus | 'rest'

/**
 * Fixed 7-day week lookup per experience level and requested training-day
 * count. Source: ACSM (2009) "Progression Models in Resistance Training for
 * Healthy Adults" — novice 2-3d full body, intermediate 4d upper/lower,
 * advanced 4-6d split routine (see wetenschappelijk-bronnenoverzicht.md).
 *
 * Each 7-slot row is hand-verified to satisfy, by construction:
 *  - no two ADJACENT slots train an overlapping muscle group (>=48h rule —
 *    only immediately consecutive days can violate it, anything with a
 *    rest/gap of >=1 day in between already clears 48h)
 *  - at most 6 active days, at least 1 rest day
 *  - every muscle group is trained >=2x/week
 *
 * Beginners are deliberately capped at full_body/upper/lower splits, even at
 * 5-6 days/week, and never receive an isolated Push/Pull/Legs split — that's
 * the ACSM-driven distinction between novice and advanced programming this
 * generator is built around.
 */
export const SPLIT_SCHEDULES: Record<ExperienceLevel, Record<number, ScheduleSlot[]>> = {
  beginner: {
    2: ['full_body', 'rest', 'full_body', 'rest', 'rest', 'rest', 'rest'],
    3: ['full_body', 'rest', 'full_body', 'rest', 'full_body', 'rest', 'rest'],
    4: ['full_body', 'rest', 'full_body', 'rest', 'full_body', 'rest', 'full_body'],
    5: ['upper', 'lower', 'upper', 'lower', 'rest', 'full_body', 'rest'],
    6: ['upper', 'lower', 'upper', 'lower', 'upper', 'lower', 'rest'],
  },
  intermediate: {
    2: ['full_body', 'rest', 'full_body', 'rest', 'rest', 'rest', 'rest'],
    3: ['full_body', 'rest', 'full_body', 'rest', 'full_body', 'rest', 'rest'],
    4: ['upper', 'lower', 'upper', 'lower', 'rest', 'rest', 'rest'],
    5: ['push', 'pull', 'legs', 'rest', 'upper', 'rest', 'lower'],
    6: ['push', 'pull', 'legs', 'push', 'pull', 'legs', 'rest'],
  },
  advanced: {
    2: ['full_body', 'rest', 'full_body', 'rest', 'rest', 'rest', 'rest'],
    3: ['full_body', 'rest', 'full_body', 'rest', 'full_body', 'rest', 'rest'],
    4: ['upper', 'lower', 'upper', 'lower', 'rest', 'rest', 'rest'],
    5: ['push', 'pull', 'legs', 'rest', 'upper', 'rest', 'lower'],
    6: ['push', 'pull', 'legs', 'push', 'pull', 'legs', 'rest'],
  },
}

export function applyExperienceLevelSplit(
  daysPerWeek: number,
  experienceLevel: ExperienceLevel,
): ScheduleSlot[] {
  const schedule = SPLIT_SCHEDULES[experienceLevel][daysPerWeek]
  if (!schedule) {
    throw new Error(`No split schedule defined for ${daysPerWeek} days/week (${experienceLevel})`)
  }
  return schedule
}
