import { FOCUS_MUSCLE_GROUPS, MUSCLE_GROUPS } from './types'
import type { MuscleGroup } from './types'
import type { ScheduleSlot } from './splitSchedules'

/**
 * Guards the supercompensation rule: never train the same muscle group on
 * two immediately consecutive days (source: supercompensation overview, see
 * wetenschappelijk-bronnenoverzicht.md). A gap of one rest day or more
 * already clears the 48h window, so only adjacent slots need checking.
 * Also guards: at most 6 active days, at least 1 rest day.
 */
export function enforceRestDayAndSpacing(schedule: ScheduleSlot[]): void {
  if (schedule.length !== 7) {
    throw new Error(`Schedule must cover exactly 7 days, got ${schedule.length}`)
  }

  const activeDays = schedule.filter((slot) => slot !== 'rest')
  if (activeDays.length > 6) {
    throw new Error(`Schedule has ${activeDays.length} active days, max is 6`)
  }
  if (activeDays.length === schedule.length) {
    throw new Error('Schedule has no rest day')
  }

  for (let i = 0; i < schedule.length - 1; i++) {
    const today = schedule[i]
    const tomorrow = schedule[i + 1]
    if (today === 'rest' || tomorrow === 'rest') continue

    const overlap = FOCUS_MUSCLE_GROUPS[today].filter((group) =>
      FOCUS_MUSCLE_GROUPS[tomorrow].includes(group),
    )
    if (overlap.length > 0) {
      throw new Error(
        `Day ${i + 1} (${today}) and day ${i + 2} (${tomorrow}) train overlapping muscle groups ` +
          `(${overlap.join(', ')}) less than 48h apart`,
      )
    }
  }
}

/**
 * Guards the frequency rule: every major muscle group should be trained at
 * least 2x/week (source: Schoenfeld, Ogborn & Krieger 2016; Schoenfeld,
 * Grgic & Krieger 2019). Returns the muscle groups that fall short so
 * callers can decide whether that's structurally unavoidable at this day count.
 */
export function findUnderTrainedMuscleGroups(schedule: ScheduleSlot[]): MuscleGroup[] {
  const counts = new Map<MuscleGroup, number>(MUSCLE_GROUPS.map((group) => [group, 0]))

  for (const slot of schedule) {
    if (slot === 'rest') continue
    for (const group of FOCUS_MUSCLE_GROUPS[slot]) {
      counts.set(group, (counts.get(group) ?? 0) + 1)
    }
  }

  return MUSCLE_GROUPS.filter((group) => (counts.get(group) ?? 0) < 2)
}

export function ensureMinimumMuscleGroupFrequency(schedule: ScheduleSlot[]): void {
  const underTrained = findUnderTrainedMuscleGroups(schedule)
  if (underTrained.length > 0) {
    throw new Error(
      `Muscle groups trained less than 2x/week: ${underTrained.join(', ')}. ` +
        'Adjust the split schedule for this day count.',
    )
  }
}
