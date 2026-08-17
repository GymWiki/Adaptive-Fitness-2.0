import { describe, expect, it } from 'vitest'
import { filterEntries, groupByMuscleGroup, mergeExerciseSources } from './exercisePicker'
import type { PickerEntry } from './exercisePicker'
import type { LibraryExercise } from './exerciseLibrary'
import type { Exercise } from './types'

function exercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: 'ex-1',
    name: 'Bench Press',
    muscle_group: 'chest',
    kind: 'compound',
    rep_range_min: 6,
    rep_range_max: 10,
    target_rir_min: 2,
    target_rir_max: 3,
    ...overrides,
  }
}

const library: LibraryExercise[] = [
  { name: 'Bench Press', muscleGroup: 'chest', kind: 'compound' },
  { name: 'Barbell Row', muscleGroup: 'back', kind: 'compound' },
  { name: 'Plank', muscleGroup: 'core', kind: 'isolation' },
]

describe('mergeExerciseSources', () => {
  it('includes every personal exercise', () => {
    const personal = [exercise({ id: 'ex-1', name: 'Squat' })]
    const merged = mergeExerciseSources(personal, [])
    expect(merged).toEqual([{ source: 'personal', exercise: personal[0] }])
  })

  it('includes library entries that have no matching personal exercise', () => {
    const merged = mergeExerciseSources([], library)
    expect(merged).toHaveLength(3)
    expect(merged.every((entry) => entry.source === 'library')).toBe(true)
  })

  it('drops a library entry when a personal exercise already has that name, case-insensitively', () => {
    const personal = [exercise({ id: 'ex-1', name: 'bench press' })]
    const merged = mergeExerciseSources(personal, library)
    expect(merged).toHaveLength(3) // 1 personal + 2 remaining library entries
    expect(merged.filter((entry) => entry.source === 'personal')).toHaveLength(1)
    expect(merged.some((entry) => entry.source === 'library' && entry.name === 'Bench Press')).toBe(false)
  })
})

describe('filterEntries', () => {
  const entries = mergeExerciseSources([exercise({ name: 'Squat' })], library)

  it('returns everything for a blank query', () => {
    expect(filterEntries(entries, '  ')).toEqual(entries)
  })

  it('matches a case-insensitive substring of the name', () => {
    const result = filterEntries(entries, 'bar')
    expect(result).toHaveLength(1)
    expect(result[0].source === 'library' && result[0].name).toBe('Barbell Row')
  })

  it('returns nothing when no name matches', () => {
    expect(filterEntries(entries, 'zzz')).toEqual([])
  })
})

describe('groupByMuscleGroup', () => {
  it('groups library entries under their muscle group', () => {
    const groups = groupByMuscleGroup(mergeExerciseSources([], library))
    expect(groups.get('chest')?.map((e) => (e.source === 'library' ? e.name : ''))).toEqual(['Bench Press'])
    expect(groups.get('back')?.map((e) => (e.source === 'library' ? e.name : ''))).toEqual(['Barbell Row'])
    expect(groups.get('core')?.map((e) => (e.source === 'library' ? e.name : ''))).toEqual(['Plank'])
  })

  it('sorts entries within a group by name', () => {
    const twoChest: PickerEntry[] = [
      { source: 'library', name: 'Push-up', muscleGroup: 'chest', kind: 'compound' },
      { source: 'library', name: 'Dumbbell Fly', muscleGroup: 'chest', kind: 'isolation' },
    ]
    const groups = groupByMuscleGroup(twoChest)
    expect(groups.get('chest')?.map((e) => (e.source === 'library' ? e.name : ''))).toEqual([
      'Dumbbell Fly',
      'Push-up',
    ])
  })

  it('buckets a personal exercise with an unmatched muscle_group under null ("Overig")', () => {
    const groups = groupByMuscleGroup([{ source: 'personal', exercise: exercise({ muscle_group: 'Borst' }) }])
    expect(groups.get(null)).toHaveLength(1)
    expect(groups.get('chest')).toBeUndefined()
  })

  it('buckets a personal exercise with no muscle_group under null too', () => {
    const groups = groupByMuscleGroup([{ source: 'personal', exercise: exercise({ muscle_group: null }) }])
    expect(groups.get(null)).toHaveLength(1)
  })

  it('recognizes a personal exercise whose muscle_group matches a known key', () => {
    const groups = groupByMuscleGroup([{ source: 'personal', exercise: exercise({ muscle_group: 'chest' }) }])
    expect(groups.get('chest')).toHaveLength(1)
    expect(groups.get(null)).toBeUndefined()
  })
})
