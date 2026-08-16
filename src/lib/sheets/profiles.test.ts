import { describe, expect, it } from 'vitest'
import { fromProfilePatch, toProfile } from './profiles'

describe('toProfile', () => {
  it('parses numeric, boolean, and weekday-list fields', () => {
    expect(
      toProfile({
        id: 'u1',
        display_name: 'Jane',
        weight_kg: '72.5',
        height_cm: '170',
        gender: 'female',
        birth_year: '1995',
        primary_focus: 'hybrid',
        strength_focus_zone: '',
        hybrid_ratio: '60_40',
        target_race_distance: '',
        target_race_distance_custom: '',
        target_race_date: '',
        available_days: 'mon,wed,fri',
        session_duration: '45_60',
        running_experience_level: 'intermediate',
        equipment: 'full_gym',
        experience_level: 'intermediate',
        onboarding_completed: 'true',
      }),
    ).toEqual({
      id: 'u1',
      display_name: 'Jane',
      weight_kg: 72.5,
      height_cm: 170,
      gender: 'female',
      birth_year: 1995,
      primary_focus: 'hybrid',
      strength_focus_zone: null,
      hybrid_ratio: '60_40',
      target_race_distance: null,
      target_race_distance_custom: null,
      target_race_date: null,
      available_days: ['mon', 'wed', 'fri'],
      session_duration: '45_60',
      running_experience_level: 'intermediate',
      equipment: 'full_gym',
      experience_level: 'intermediate',
      onboarding_completed: true,
    })
  })

  it('maps an empty available_days string to an empty array, other blanks to null/false', () => {
    const result = toProfile({
      id: 'u1',
      display_name: '',
      weight_kg: '',
      height_cm: '',
      gender: '',
      birth_year: '',
      primary_focus: '',
      strength_focus_zone: '',
      hybrid_ratio: '',
      target_race_distance: '',
      target_race_distance_custom: '',
      target_race_date: '',
      available_days: '',
      session_duration: '',
      running_experience_level: '',
      equipment: '',
      experience_level: '',
      onboarding_completed: '',
    })
    expect(result.available_days).toEqual([])
    expect(result.primary_focus).toBeNull()
    expect(result.onboarding_completed).toBe(false)
  })
})

describe('fromProfilePatch', () => {
  it('only includes keys present in the patch', () => {
    expect(fromProfilePatch({ primary_focus: 'strength' })).toEqual({ primary_focus: 'strength' })
  })

  it('joins available_days into a comma-separated string', () => {
    expect(fromProfilePatch({ available_days: ['mon', 'wed', 'fri'] })).toEqual({
      available_days: 'mon,wed,fri',
    })
  })

  it('stringifies numbers and booleans, nulls to empty string', () => {
    expect(
      fromProfilePatch({
        weight_kg: 80,
        onboarding_completed: true,
        display_name: null,
      }),
    ).toEqual({
      weight_kg: '80',
      onboarding_completed: 'true',
      display_name: '',
    })
  })
})
