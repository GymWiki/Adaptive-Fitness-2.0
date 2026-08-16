import { describe, expect, it } from 'vitest'
import { fromProfilePatch, toProfile } from './profiles'

describe('toProfile', () => {
  it('parses numeric and boolean fields, empty strings to null/false', () => {
    expect(
      toProfile({
        id: 'u1',
        display_name: 'Jane',
        weight_kg: '72.5',
        height_cm: '170',
        gender: 'female',
        birth_year: '1995',
        goal: 'hypertrophy',
        days_per_week: '4',
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
      goal: 'hypertrophy',
      days_per_week: 4,
      equipment: 'full_gym',
      experience_level: 'intermediate',
      onboarding_completed: true,
    })
  })

  it('maps empty strings to null and onboarding_completed to false', () => {
    expect(
      toProfile({
        id: 'u1',
        display_name: '',
        weight_kg: '',
        height_cm: '',
        gender: '',
        birth_year: '',
        goal: '',
        days_per_week: '',
        equipment: '',
        experience_level: '',
        onboarding_completed: '',
      }),
    ).toEqual({
      id: 'u1',
      display_name: null,
      weight_kg: null,
      height_cm: null,
      gender: null,
      birth_year: null,
      goal: null,
      days_per_week: null,
      equipment: null,
      experience_level: null,
      onboarding_completed: false,
    })
  })
})

describe('fromProfilePatch', () => {
  it('only includes keys present in the patch', () => {
    expect(fromProfilePatch({ goal: 'strength' })).toEqual({ goal: 'strength' })
  })

  it('stringifies numbers and booleans, nulls to empty string', () => {
    expect(
      fromProfilePatch({
        weight_kg: 80,
        days_per_week: 4,
        onboarding_completed: true,
        display_name: null,
      }),
    ).toEqual({
      weight_kg: '80',
      days_per_week: '4',
      onboarding_completed: 'true',
      display_name: '',
    })
  })
})
