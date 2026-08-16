export type PrimaryFocus = 'strength' | 'hybrid' | 'running' | 'general_health'

export type StrengthFocusZone = 'compound_lifts' | 'general_hypertrophy' | 'upper_lower_balance'

export type HybridRatio = '50_50' | '60_40' | '40_60'

export type RaceDistance = '5k' | '10k' | 'half_marathon' | 'first_10k' | 'custom'

export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'

export type SessionDuration = '30_45' | '45_60' | '60_90'

export type RunningExperienceLevel = 'beginner' | 'intermediate' | 'experienced'

/** Step 2's conditional fields, discriminated by the step 1 choice. */
export type FocusSpecifics =
  | { primaryFocus: 'strength'; strengthFocusZone: StrengthFocusZone }
  | { primaryFocus: 'hybrid'; hybridRatio: HybridRatio }
  | {
      primaryFocus: 'running'
      raceDistance: RaceDistance
      raceDistanceCustom: string | null
      raceDate: string | null
    }
  | { primaryFocus: 'general_health' }

export type DayAllocation = {
  strengthDays: number
  runningDays: number
  restDays: number
}

// Kept separate from the strength side's own `DaySlot` union — a combined
// week's slots are one of exactly these three, never the strength system's
// own 'rest'/'active_recovery'/'cardio' sub-variants (those only make sense
// inside a strength-only WeekProgram; here rest and running are decided one
// layer up). The strength branch is narrowed to 'training' only — the
// strength goal used in combined schedules never produces the others (see
// generateCombinedSchedule.ts's resolveStrengthGoal), and mergeWeeks only
// ever wraps a 'training' day this way.
export type CombinedDaySlot =
  | { type: 'rest' }
  | {
      type: 'strength'
      day: Extract<import('../programGenerator').DaySlot, { type: 'training' }>
    }
  | { type: 'running'; session: import('../runningPlanner/buildRunningPlan').RunningSession }
