import type { Weekday } from '../combinedSchedule/types'
import { WEEKDAY_ORDER } from '../customSchedule/types'

/** Weekday ids missing from an already-provisioned `custom_schedule` tab, in Monday-first order. */
export function missingWeekdayRows(existingIds: string[]): Weekday[] {
  const existing = new Set(existingIds)
  return WEEKDAY_ORDER.filter((weekday) => !existing.has(weekday))
}
