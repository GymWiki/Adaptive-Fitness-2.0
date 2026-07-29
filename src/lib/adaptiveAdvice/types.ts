export type ExerciseKind = 'compound' | 'isolation'

/** The target zone an exercise is being trained in (from the program generator, or set manually). */
export type ExerciseTarget = {
  repRangeMin: number
  repRangeMax: number
  targetRirMin: number
  targetRirMax: number
  kind: ExerciseKind
}

export type SetPerformance = {
  weightKg: number
  reps: number
  rir: number
}

/** One logged session for a single exercise, most-recent session first when passed as history. */
export type SessionLog = {
  date: string
  sets: SetPerformance[]
}

export type AdviceType = 'omhoog' | 'gelijk' | 'omlaag' | 'geen_historie'

export type Advice = {
  advies: AdviceType
  gewicht: number | null
  reden: string
}
