import type { DayAllocation, HybridRatio, PrimaryFocus } from './types'

const HYBRID_STRENGTH_SHARE: Record<HybridRatio, number> = {
  '50_50': 0.5,
  '60_40': 0.6,
  '40_60': 0.4,
}

/**
 * Splits the user's available days between strength and running per their
 * primary focus — see docs/superpowers/specs/2026-08-02-running-plus-strength-design.md §4.
 * `restDays` falls out of the 2-6 day input range automatically (7 - available),
 * so the "≤6 active days, ≥1 rest day" invariant never needs a separate check.
 */
export function allocateDaysByFocus(
  primaryFocus: PrimaryFocus,
  availableDaysCount: number,
  hybridRatio?: HybridRatio,
): DayAllocation {
  if (availableDaysCount < 2 || availableDaysCount > 6) {
    throw new Error(`availableDaysCount must be between 2 and 6, got ${availableDaysCount}`)
  }

  const restDays = 7 - availableDaysCount
  let strengthDays: number
  let runningDays: number

  switch (primaryFocus) {
    case 'strength': {
      runningDays = availableDaysCount >= 4 ? 2 : 1
      strengthDays = availableDaysCount - runningDays
      break
    }
    case 'running': {
      strengthDays = availableDaysCount <= 2 ? 1 : 2
      runningDays = availableDaysCount - strengthDays
      break
    }
    case 'hybrid': {
      if (!hybridRatio) throw new Error('hybridRatio is required when primaryFocus is "hybrid"')
      strengthDays = Math.round(availableDaysCount * HYBRID_STRENGTH_SHARE[hybridRatio])
      runningDays = availableDaysCount - strengthDays
      break
    }
    case 'general_health': {
      strengthDays = Math.floor(availableDaysCount / 2)
      runningDays = availableDaysCount - strengthDays
      break
    }
  }

  return { strengthDays, runningDays, restDays }
}
