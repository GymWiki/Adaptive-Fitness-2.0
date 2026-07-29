import { estimateOneRepMax } from './estimateOneRepMax'
import type { LoggedSet, PersonalRecord } from './types'

/**
 * Walks a single exercise's sets in chronological order and flags every set
 * whose estimated 1RM strictly beats the best seen so far — i.e. every set
 * that was a personal record at the moment it was logged.
 */
export function detectPRs(sets: LoggedSet[]): PersonalRecord[] {
  const chronological = [...sets].sort((a, b) => a.performedAt.localeCompare(b.performedAt))

  const records: PersonalRecord[] = []
  let best = -Infinity

  for (const set of chronological) {
    const estimated1RM = estimateOneRepMax(set.weightKg, set.reps, set.rir)
    if (estimated1RM > best) {
      best = estimated1RM
      records.push({ ...set, estimated1RM })
    }
  }

  return records
}
