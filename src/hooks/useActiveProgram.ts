import { useMemo } from 'react'
import { useProfile } from './useProfile'
import { generateCombinedSchedule } from '../lib/combinedSchedule/generateCombinedSchedule'
import type { CombinedWeekProgram } from '../lib/combinedSchedule/generateCombinedSchedule'
import { buildFocusSpecifics } from '../lib/combinedSchedule/buildFocusSpecifics'
import type { Profile } from '../lib/types'

/** The user's active combined schedule, resolved from their onboarding profile. */
export function useActiveProgram(): { program: CombinedWeekProgram | null; loading: boolean } {
  const { profile, loading } = useProfile()

  const program = useMemo(() => {
    if (!isReadyForGeneration(profile)) return null

    const specifics = buildFocusSpecifics(profile)
    if (!specifics) return null

    return generateCombinedSchedule(
      profile.primary_focus,
      specifics,
      profile.available_days,
      profile.equipment,
      profile.experience_level,
      profile.running_experience_level,
      new Date(),
    )
  }, [profile])

  return { program, loading }
}

type ReadyProfile = Profile & {
  primary_focus: NonNullable<Profile['primary_focus']>
  equipment: NonNullable<Profile['equipment']>
  experience_level: NonNullable<Profile['experience_level']>
  running_experience_level: NonNullable<Profile['running_experience_level']>
}

function isReadyForGeneration(profile: Profile | null): profile is ReadyProfile {
  return (
    !!profile &&
    !!profile.primary_focus &&
    profile.available_days.length >= 2 &&
    profile.available_days.length <= 6 &&
    !!profile.equipment &&
    !!profile.experience_level &&
    !!profile.running_experience_level
  )
}
