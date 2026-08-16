import { describe, expect, it } from 'vitest'
import { buildFocusSpecifics } from './buildFocusSpecifics'

const blank = {
  strength_focus_zone: null,
  hybrid_ratio: null,
  target_race_distance: null,
  target_race_distance_custom: null,
  target_race_date: null,
}

describe('buildFocusSpecifics', () => {
  it('builds strength specifics when a focus zone is set', () => {
    expect(
      buildFocusSpecifics({ ...blank, primary_focus: 'strength', strength_focus_zone: 'compound_lifts' }),
    ).toEqual({ primaryFocus: 'strength', strengthFocusZone: 'compound_lifts' })
  })

  it('returns null for strength with no focus zone yet', () => {
    expect(buildFocusSpecifics({ ...blank, primary_focus: 'strength' })).toBeNull()
  })

  it('builds hybrid specifics when a ratio is set', () => {
    expect(buildFocusSpecifics({ ...blank, primary_focus: 'hybrid', hybrid_ratio: '60_40' })).toEqual({
      primaryFocus: 'hybrid',
      hybridRatio: '60_40',
    })
  })

  it('returns null for hybrid with no ratio yet', () => {
    expect(buildFocusSpecifics({ ...blank, primary_focus: 'hybrid' })).toBeNull()
  })

  it('builds running specifics with an optional race date and custom distance', () => {
    expect(
      buildFocusSpecifics({
        ...blank,
        primary_focus: 'running',
        target_race_distance: 'custom',
        target_race_distance_custom: '15K',
        target_race_date: '2026-12-01',
      }),
    ).toEqual({
      primaryFocus: 'running',
      raceDistance: 'custom',
      raceDistanceCustom: '15K',
      raceDate: '2026-12-01',
    })
  })

  it('returns null for running with no race distance yet', () => {
    expect(buildFocusSpecifics({ ...blank, primary_focus: 'running' })).toBeNull()
  })

  it('builds general_health specifics with no extra fields needed', () => {
    expect(buildFocusSpecifics({ ...blank, primary_focus: 'general_health' })).toEqual({
      primaryFocus: 'general_health',
    })
  })
})
