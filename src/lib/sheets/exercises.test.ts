import { describe, expect, it } from 'vitest'
import { fromNewExercise, toExercise } from './exercises'

describe('toExercise', () => {
  it('parses numeric fields and defaults kind to isolation when blank', () => {
    expect(
      toExercise({
        id: 'e1',
        name: 'Bench press',
        muscle_group: 'Borst',
        kind: 'compound',
        rep_range_min: '6',
        rep_range_max: '10',
        target_rir_min: '2',
        target_rir_max: '3',
      }),
    ).toEqual({
      id: 'e1',
      name: 'Bench press',
      muscle_group: 'Borst',
      kind: 'compound',
      rep_range_min: 6,
      rep_range_max: 10,
      target_rir_min: 2,
      target_rir_max: 3,
    })
  })

  it('maps an empty muscle_group to null', () => {
    expect(toExercise({ id: 'e1', name: 'Plank', muscle_group: '', kind: 'isolation' }).muscle_group).toBeNull()
  })
})

describe('fromNewExercise', () => {
  it('generates an id and stringifies numeric fields', () => {
    const row = fromNewExercise({
      name: 'Squat',
      muscle_group: 'Benen',
      kind: 'compound',
      rep_range_min: 6,
      rep_range_max: 10,
      target_rir_min: 2,
      target_rir_max: 3,
    })
    expect(row.id).toMatch(/^[0-9a-f-]{36}$/)
    expect(row).toMatchObject({
      name: 'Squat',
      muscle_group: 'Benen',
      kind: 'compound',
      rep_range_min: '6',
      rep_range_max: '10',
    })
  })
})
