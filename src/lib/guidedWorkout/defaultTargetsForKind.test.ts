import { describe, expect, it } from 'vitest'
import { defaultTargetsForKind } from './defaultTargetsForKind'

describe('defaultTargetsForKind', () => {
  it('gives compound lifts a lower rep range', () => {
    expect(defaultTargetsForKind('compound')).toEqual({
      rep_range_min: 6,
      rep_range_max: 10,
      target_rir_min: 2,
      target_rir_max: 3,
    })
  })

  it('gives isolation work a higher rep range', () => {
    expect(defaultTargetsForKind('isolation')).toEqual({
      rep_range_min: 10,
      rep_range_max: 15,
      target_rir_min: 2,
      target_rir_max: 3,
    })
  })
})
