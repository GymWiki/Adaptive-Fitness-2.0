import type { RaceDistance, RunningExperienceLevel } from '../combinedSchedule/types'

export type TrainingPhase = 'base' | 'build' | 'peak' | 'taper'

export type PhaseSchedule =
  | {
      mode: 'race_targeted'
      phase: TrainingPhase
      weekInPhase: number
      totalWeeksInPhase: number
      weeksUntilRace: number
      /** 0-based weeks since the start of the plan (start of Base) — the anchor buildRunningPlan compounds volume from. */
      weeksElapsedInPlan: number
    }
  | { mode: 'ongoing' }

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000

// Total plan length by experience × distance — realistic, commonly-used plan
// durations (not derived from the 25%/45% figures, which describe how a
// plan of *this* length gets split, not how long it should be). "Beginners
// longer (10-12 weken), ervaren korter" is honored specifically inside the
// base-phase share below. Documented judgment call, not a literal spec value.
const TOTAL_PLAN_WEEKS: Record<RaceDistance, Record<RunningExperienceLevel, number>> = {
  half_marathon: { beginner: 16, intermediate: 12, experienced: 10 },
  '5k': { beginner: 12, intermediate: 9, experienced: 7 },
  '10k': { beginner: 12, intermediate: 9, experienced: 7 },
  first_10k: { beginner: 12, intermediate: 9, experienced: 7 },
  custom: { beginner: 12, intermediate: 9, experienced: 7 },
}

function taperWeeksFor(distance: RaceDistance): number {
  return distance === 'half_marathon' ? 2 : 1
}

/**
 * Splits a fixed total plan length into Base/Build/Peak/Taper week counts.
 * Peak and Taper are fixed-duration blocks; whatever remains is split
 * Base:Build in the source spec's 25:45 ratio (≈36:64 of the remainder) —
 * see the design doc §3 for why percentages of the same total can't apply
 * to all four phases at once.
 */
function splitPhases(totalWeeks: number, distance: RaceDistance) {
  const taperWeeks = taperWeeksFor(distance)
  const peakWeeks = totalWeeks >= 12 ? 2 : 1
  const remainder = Math.max(totalWeeks - taperWeeks - peakWeeks, 2)
  const baseWeeks = Math.max(1, Math.round(remainder * (25 / 70)))
  const buildWeeks = Math.max(1, remainder - baseWeeks)
  return { baseWeeks, buildWeeks, peakWeeks, taperWeeks }
}

/**
 * Determines which training phase "today" falls into, given an optional
 * race date. No plan is persisted anywhere — this recomputes from scratch
 * every call, anchored on a fixed total-plan-length (by experience ×
 * distance) counted backward from the race date, not on "weeks remaining"
 * alone (which would incorrectly place today at the start of Base on every
 * single call). See design doc §3.
 */
export function determineCurrentPhase(
  today: Date,
  raceDate: Date | null,
  raceDistance: RaceDistance,
  experienceLevel: RunningExperienceLevel,
): PhaseSchedule {
  if (!raceDate) return { mode: 'ongoing' }

  const weeksUntilRace = Math.max(
    0,
    Math.ceil((raceDate.getTime() - today.getTime()) / MS_PER_WEEK),
  )
  const totalWeeks = TOTAL_PLAN_WEEKS[raceDistance][experienceLevel]
  const { baseWeeks, buildWeeks, peakWeeks, taperWeeks } = splitPhases(totalWeeks, raceDistance)

  // Race farther away than the plan needs — hasn't "properly" started yet;
  // simplest honest answer without a persisted start date is "still base".
  const elapsedWeeks = Math.min(Math.max(totalWeeks - weeksUntilRace, 0), totalWeeks - 1)

  if (elapsedWeeks < baseWeeks) {
    return {
      mode: 'race_targeted',
      phase: 'base',
      weekInPhase: elapsedWeeks + 1,
      totalWeeksInPhase: baseWeeks,
      weeksUntilRace,
      weeksElapsedInPlan: elapsedWeeks,
    }
  }
  if (elapsedWeeks < baseWeeks + buildWeeks) {
    return {
      mode: 'race_targeted',
      phase: 'build',
      weekInPhase: elapsedWeeks - baseWeeks + 1,
      totalWeeksInPhase: buildWeeks,
      weeksUntilRace,
      weeksElapsedInPlan: elapsedWeeks,
    }
  }
  if (elapsedWeeks < baseWeeks + buildWeeks + peakWeeks) {
    return {
      mode: 'race_targeted',
      phase: 'peak',
      weekInPhase: elapsedWeeks - baseWeeks - buildWeeks + 1,
      totalWeeksInPhase: peakWeeks,
      weeksUntilRace,
      weeksElapsedInPlan: elapsedWeeks,
    }
  }
  return {
    mode: 'race_targeted',
    phase: 'taper',
    weekInPhase: elapsedWeeks - baseWeeks - buildWeeks - peakWeeks + 1,
    totalWeeksInPhase: taperWeeks,
    weeksUntilRace,
    weeksElapsedInPlan: elapsedWeeks,
  }
}
