import { useMemo } from 'react'
import { useProfile } from './useProfile'
import { generateProgram } from '../lib/programGenerator'
import type { WeekProgram } from '../lib/programGenerator'

/** The user's active template, resolved from their onboarding profile. */
export function useActiveProgram(): { program: WeekProgram | null; loading: boolean } {
  const { profile, loading } = useProfile()

  const program = useMemo(() => {
    if (!profile || !profile.days_per_week || !profile.equipment || !profile.experience_level) {
      return null
    }
    return generateProgram(profile.days_per_week, profile.equipment, profile.experience_level)
  }, [profile])

  return { program, loading }
}
