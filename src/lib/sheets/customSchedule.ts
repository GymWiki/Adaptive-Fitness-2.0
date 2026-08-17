import { list, update } from './sheetsTable'
import { WEEKDAY_ORDER } from '../customSchedule/types'
import type { CustomScheduleAssignment } from '../customSchedule/types'
import type { Weekday } from '../combinedSchedule/types'

const TAB = 'custom_schedule'

/** Reads all 7 weekday rows into a weekday → workout id map (`null` = rest). */
export async function getCustomScheduleAssignment(): Promise<CustomScheduleAssignment> {
  const rows = await list(TAB)
  const workoutIdByWeekday = new Map(rows.map((row) => [row.id, row.workout_id || null]))

  return WEEKDAY_ORDER.reduce((assignment, weekday) => {
    assignment[weekday] = workoutIdByWeekday.get(weekday) ?? null
    return assignment
  }, {} as CustomScheduleAssignment)
}

/** Assigns (or clears, with `null`) the workout for one weekday. */
export async function setCustomScheduleDay(weekday: Weekday, workoutId: string | null): Promise<void> {
  await update(TAB, weekday, { workout_id: workoutId ?? '' })
}

/** Clears every weekday still pointing at a workout that's being deleted. */
export async function setCustomScheduleWorkoutToRest(workoutId: string): Promise<void> {
  const rows = await list(TAB)
  const affected = rows.filter((row) => row.workout_id === workoutId)
  for (const row of affected) {
    await update(TAB, row.id, { workout_id: '' })
  }
}
