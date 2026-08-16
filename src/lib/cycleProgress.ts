export type CycleState = {
  /** Index (0-6) into `week` that should be selected by default. */
  recommendedIndex: number
  /** For each index in `week`, whether that training day is already done in the current cycle. */
  doneInCycle: boolean[]
}

/**
 * Determines where the user is in their template's repeating cycle, using
 * only the total number of logged workouts — no calendar dates involved.
 * Each logged workout is assumed to complete "the next loggable day in the
 * cycle" (per `isTrainingDay`); every other slot is never "done", it's just
 * passed through, so the recommended day can land on one of those. Generic
 * over the slot type so it works for both a plain strength `WeekProgram`
 * ('training' slots) and a combined running+strength week ('strength'
 * slots — running days are informational-only, never loggable).
 */
export function computeCycleState<T>(
  week: T[],
  totalWorkoutsLogged: number,
  isTrainingDay: (day: T) => boolean,
): CycleState {
  const trainingIndices: number[] = []
  week.forEach((day, index) => {
    if (isTrainingDay(day)) trainingIndices.push(index)
  })

  const doneInCycle = week.map(() => false)

  if (trainingIndices.length === 0 || totalWorkoutsLogged <= 0) {
    return { recommendedIndex: 0, doneInCycle }
  }

  const lastCompletedOrdinal = (totalWorkoutsLogged - 1) % trainingIndices.length
  for (let ordinal = 0; ordinal <= lastCompletedOrdinal; ordinal++) {
    doneInCycle[trainingIndices[ordinal]] = true
  }

  const lastCompletedIndex = trainingIndices[lastCompletedOrdinal]
  const recommendedIndex = (lastCompletedIndex + 1) % week.length

  return { recommendedIndex, doneInCycle }
}
