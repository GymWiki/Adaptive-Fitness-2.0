import { MUSCLE_GROUPS } from './programGenerator'
import type { ExerciseKind, MuscleGroup } from './programGenerator'
import type { LibraryExercise } from './exerciseLibrary'
import type { Exercise } from './types'

export type PickerEntry =
  | { source: 'personal'; exercise: Exercise }
  | { source: 'library'; name: string; muscleGroup: MuscleGroup; kind: ExerciseKind }

function entryName(entry: PickerEntry): string {
  return entry.source === 'personal' ? entry.exercise.name : entry.name
}

/** Merges the user's own exercises with the static library, de-duplicating by name (case-insensitive) — a personal record always wins over a library entry with the same name. */
export function mergeExerciseSources(personal: Exercise[], library: LibraryExercise[]): PickerEntry[] {
  const personalNames = new Set(personal.map((exercise) => exercise.name.toLowerCase()))
  const personalEntries: PickerEntry[] = personal.map((exercise) => ({ source: 'personal', exercise }))
  const libraryEntries: PickerEntry[] = library
    .filter((item) => !personalNames.has(item.name.toLowerCase()))
    .map((item) => ({ source: 'library', name: item.name, muscleGroup: item.muscleGroup, kind: item.kind }))
  return [...personalEntries, ...libraryEntries]
}

/** Case-insensitive substring match on name; an empty/blank query returns everything. */
export function filterEntries(entries: PickerEntry[], query: string): PickerEntry[] {
  const trimmed = query.trim().toLowerCase()
  if (!trimmed) return entries
  return entries.filter((entry) => entryName(entry).toLowerCase().includes(trimmed))
}

function resolveMuscleGroup(entry: PickerEntry): MuscleGroup | null {
  if (entry.source === 'library') return entry.muscleGroup
  const value = entry.exercise.muscle_group
  return value && (MUSCLE_GROUPS as string[]).includes(value) ? (value as MuscleGroup) : null
}

/** Groups entries by muscle group, each bucket sorted by name. A personal exercise whose stored muscle_group doesn't match one of the 10 known groups (freeform/legacy text, or empty) lands under `null` ("Overig"). */
export function groupByMuscleGroup(entries: PickerEntry[]): Map<MuscleGroup | null, PickerEntry[]> {
  const groups = new Map<MuscleGroup | null, PickerEntry[]>()
  for (const entry of entries) {
    const key = resolveMuscleGroup(entry)
    const bucket = groups.get(key)
    if (bucket) bucket.push(entry)
    else groups.set(key, [entry])
  }
  for (const bucket of groups.values()) {
    bucket.sort((a, b) => entryName(a).localeCompare(entryName(b)))
  }
  return groups
}
