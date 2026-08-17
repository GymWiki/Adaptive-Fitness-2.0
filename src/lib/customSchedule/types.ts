import type { Weekday } from '../combinedSchedule/types'

export type CustomWorkoutExercise = {
  exerciseId: string
  sets: number
  restSeconds: string
  note?: string
}

export type CustomWorkout = {
  id: string
  name: string
  exercises: CustomWorkoutExercise[]
}

/** One entry per weekday; `null` means a rest day. */
export type CustomScheduleAssignment = Record<Weekday, string | null>

export const WEEKDAY_ORDER: Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
