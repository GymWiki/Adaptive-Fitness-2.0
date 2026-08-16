import { insert, list } from './sheetsTable'
import type { SheetRow } from './rowMapping'
import type { Exercise } from '../types'
import type { ExerciseKind } from '../programGenerator'
import { defaultTargetsForKind } from '../guidedWorkout/defaultTargetsForKind'

const TAB = 'exercises'

export function toExercise(row: SheetRow): Exercise {
  return {
    id: row.id,
    name: row.name,
    muscle_group: row.muscle_group || null,
    kind: (row.kind || 'isolation') as ExerciseKind,
    rep_range_min: Number(row.rep_range_min) || 0,
    rep_range_max: Number(row.rep_range_max) || 0,
    target_rir_min: Number(row.target_rir_min) || 0,
    target_rir_max: Number(row.target_rir_max) || 0,
  }
}

export type NewExercise = {
  name: string
  muscle_group?: string | null
  kind: ExerciseKind
  rep_range_min: number
  rep_range_max: number
  target_rir_min: number
  target_rir_max: number
}

export function fromNewExercise(exercise: NewExercise): SheetRow {
  return {
    id: crypto.randomUUID(),
    name: exercise.name,
    muscle_group: exercise.muscle_group ?? '',
    kind: exercise.kind,
    rep_range_min: String(exercise.rep_range_min),
    rep_range_max: String(exercise.rep_range_max),
    target_rir_min: String(exercise.target_rir_min),
    target_rir_max: String(exercise.target_rir_max),
  }
}

/** Every exercise in this user's own spreadsheet — no more shared-vs-own split, it's all just theirs. */
export async function listExercises(): Promise<Exercise[]> {
  const rows = await list(TAB)
  return rows.map(toExercise).sort((a, b) => a.name.localeCompare(b.name))
}

export async function findExerciseByName(name: string): Promise<Exercise | null> {
  const rows = await list(TAB)
  const match = rows.find((row) => row.name.toLowerCase() === name.toLowerCase())
  return match ? toExercise(match) : null
}

export async function insertExercise(input: {
  name: string
  kind?: ExerciseKind
  muscle_group?: string | null
}): Promise<Exercise> {
  const kind = input.kind ?? 'isolation'
  const row = fromNewExercise({
    name: input.name,
    muscle_group: input.muscle_group ?? null,
    kind,
    ...defaultTargetsForKind(kind),
  })
  const inserted = await insert(TAB, row)
  return toExercise(inserted)
}
