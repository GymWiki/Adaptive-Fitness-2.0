import { generateProgram } from '../programGenerator'
import type { DaySlot, Equipment, ExperienceLevel, Goal, WeekProgram } from '../programGenerator'
import { determineCurrentPhase } from '../runningPlanner/determineCurrentPhase'
import { buildRunningPlan } from '../runningPlanner/buildRunningPlan'
import type { RunningWeekPlan } from '../runningPlanner/buildRunningPlan'
import { allocateDaysByFocus } from './allocateDaysByFocus'
import { applyInterferenceSpacing } from './applyInterferenceSpacing'
import type {
  CombinedDaySlot,
  DayAllocation,
  FocusSpecifics,
  PrimaryFocus,
  RunningExperienceLevel,
  Weekday,
} from './types'

export type CombinedWeekProgram = {
  primaryFocus: PrimaryFocus
  allocation: DayAllocation
  strengthProgram: WeekProgram
  runningPlan: RunningWeekPlan | null
  week: CombinedDaySlot[]
}

/**
 * Only 'hypertrophy'/'strength' may be used here — every other Goal value
 * triggers applyCardio's automatic cardio-day injection (built for the old
 * single-modality onboarding), which would conflict with this system's own
 * explicit running allocation. See design doc §6.
 */
function resolveStrengthGoal(specifics: FocusSpecifics): Goal {
  if (specifics.primaryFocus === 'strength' && specifics.strengthFocusZone === 'compound_lifts') {
    return 'strength'
  }
  return 'hypertrophy'
}

function mergeWeeks(strengthWeek: DaySlot[], runningPlan: RunningWeekPlan | null): CombinedDaySlot[] {
  const restIndices = strengthWeek.reduce<number[]>((indices, day, index) => {
    if (day.type === 'rest') indices.push(index)
    return indices
  }, [])

  const runningIndices = new Set(restIndices.slice(0, runningPlan?.sessions.length ?? 0))

  return strengthWeek.map((day, index) => {
    if (day.type === 'training') return { type: 'strength', day }
    if (runningPlan && runningIndices.has(index)) {
      const sessionIndex = restIndices.indexOf(index)
      return { type: 'running', session: runningPlan.sessions[sessionIndex] }
    }
    return { type: 'rest' }
  })
}

export function generateCombinedSchedule(
  primaryFocus: PrimaryFocus,
  specifics: FocusSpecifics,
  availableDays: Weekday[],
  equipment: Equipment,
  strengthExperience: ExperienceLevel,
  runningExperience: RunningExperienceLevel,
  today: Date,
): CombinedWeekProgram {
  const hybridRatio = specifics.primaryFocus === 'hybrid' ? specifics.hybridRatio : undefined
  const allocation = allocateDaysByFocus(primaryFocus, availableDays.length, hybridRatio)

  const strengthGoal = resolveStrengthGoal(specifics)
  const strengthProgram = generateProgram(allocation.strengthDays, equipment, strengthExperience, strengthGoal)

  let runningPlan: RunningWeekPlan | null = null
  if (allocation.runningDays > 0) {
    const raceDate =
      specifics.primaryFocus === 'running' && specifics.raceDate ? new Date(specifics.raceDate) : null
    const raceDistance = specifics.primaryFocus === 'running' ? specifics.raceDistance : '5k'
    const schedule = determineCurrentPhase(today, raceDate, raceDistance, runningExperience)
    runningPlan = buildRunningPlan(schedule, allocation.runningDays, runningExperience)
  }

  const week = applyInterferenceSpacing(mergeWeeks(strengthProgram.week, runningPlan))

  return { primaryFocus, allocation, strengthProgram, runningPlan, week }
}
