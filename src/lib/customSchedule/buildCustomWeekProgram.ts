import type { PlannedExercise, WeekProgram } from '../programGenerator'
import type { CombinedDaySlot } from '../combinedSchedule/types'
import type { CombinedWeekProgram } from '../combinedSchedule/generateCombinedSchedule'
import type { Exercise } from '../types'
import type { CustomScheduleAssignment, CustomWorkout, CustomWorkoutExercise } from './types'
import { WEEKDAY_ORDER } from './types'
import { formatRepRange, formatRirRange } from './formatTargets'

export type CustomWeekResult = {
  program: CombinedWeekProgram
  /** Index (0-6, Monday-first) into `program.week` matching today's real weekday. */
  todayIndex: number
}

function toPlannedExercise(entry: CustomWorkoutExercise, exercise: Exercise | undefined): PlannedExercise {
  return {
    patternId: entry.exerciseId,
    name: exercise?.name ?? 'Verwijderde oefening',
    sets: entry.sets,
    // Reps/RIR always come live from the exercise's own stored targets —
    // never duplicated onto the workout — so advice and displayed goal can
    // never drift apart. See design doc §"Context".
    reps: exercise ? formatRepRange(exercise.rep_range_min, exercise.rep_range_max) : '',
    restSeconds: entry.restSeconds,
    rir: exercise ? formatRirRange(exercise.target_rir_min, exercise.target_rir_max) : '',
    note: entry.note,
  }
}

/** Monday-first index (0-6) matching `today`'s real weekday. JS `getDay()` is Sunday-first (0). */
export function todayWeekdayIndex(today: Date): number {
  const jsDay = today.getDay()
  return jsDay === 0 ? 6 : jsDay - 1
}

/**
 * Builds a CombinedWeekProgram-shaped week from a user's own workout blocks
 * and weekday assignment, reusing the same rendering/logging path as a
 * generated schedule. See design doc §2.
 */
export function buildCustomWeekProgram(
  workouts: CustomWorkout[],
  assignment: CustomScheduleAssignment,
  exercisesById: Map<string, Exercise>,
  today: Date,
): CustomWeekResult {
  const workoutsById = new Map(workouts.map((workout) => [workout.id, workout]))

  const week: CombinedDaySlot[] = WEEKDAY_ORDER.map((weekday) => {
    const workoutId = assignment[weekday]
    const workout = workoutId ? workoutsById.get(workoutId) : undefined
    if (!workout) return { type: 'rest' }

    return {
      type: 'strength',
      day: {
        type: 'training',
        label: workout.name,
        kind: 'standard',
        exercises: workout.exercises.map((entry) => toPlannedExercise(entry, exercisesById.get(entry.exerciseId))),
      },
    }
  })

  const strengthDays = week.filter((slot) => slot.type === 'strength').length

  // Placeholder fields the shared WeekProgram type requires but that the
  // combined-schedule rendering layer never reads for a custom program
  // (only strengthProgram.templateName/source are shown) — see design §2.
  const strengthProgram: WeekProgram = {
    daysPerWeek: strengthDays,
    equipment: 'full_gym',
    experienceLevel: 'intermediate',
    goal: 'hypertrophy',
    templateName: 'Mijn schema',
    source: 'Zelf samengesteld',
    disclaimer: null,
    experienceWarning: null,
    week: [],
    notes: [],
  }

  const program: CombinedWeekProgram = {
    primaryFocus: 'strength',
    allocation: { strengthDays, runningDays: 0, restDays: 7 - strengthDays },
    strengthProgram,
    runningPlan: null,
    week,
  }

  return { program, todayIndex: todayWeekdayIndex(today) }
}
