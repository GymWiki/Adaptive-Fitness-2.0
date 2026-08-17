import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from './useProfile'
import { generateCombinedSchedule } from '../lib/combinedSchedule/generateCombinedSchedule'
import type { CombinedWeekProgram } from '../lib/combinedSchedule/generateCombinedSchedule'
import { buildFocusSpecifics } from '../lib/combinedSchedule/buildFocusSpecifics'
import { buildCustomWeekProgram } from '../lib/customSchedule/buildCustomWeekProgram'
import { listCustomWorkouts } from '../lib/sheets/customWorkouts'
import { getCustomScheduleAssignment } from '../lib/sheets/customSchedule'
import { listExercises } from '../lib/sheets/exercises'
import type { Profile } from '../lib/types'

export type ActiveProgramResult = {
  program: CombinedWeekProgram | null
  loading: boolean
  isCustom: boolean
  /** Monday-first index matching today's real weekday — only set for a custom schedule. */
  todayIndex: number | null
}

/** The user's active schedule, resolved from their profile — either generated or their own custom one. */
export function useActiveProgram(): ActiveProgramResult {
  const { user, sheetsReady } = useAuth()
  const { profile, loading: profileLoading } = useProfile()
  const isCustom = profile?.schedule_source === 'custom'

  const [custom, setCustom] = useState<{ program: CombinedWeekProgram; todayIndex: number } | null>(null)
  const [customLoading, setCustomLoading] = useState(false)

  useEffect(() => {
    if (!isCustom || !user || !sheetsReady) {
      setCustom(null)
      return
    }
    let cancelled = false
    setCustomLoading(true)

    Promise.all([listCustomWorkouts(), getCustomScheduleAssignment(), listExercises()])
      .then(([workouts, assignment, exercises]) => {
        if (cancelled) return
        const exercisesById = new Map(exercises.map((exercise) => [exercise.id, exercise]))
        setCustom(buildCustomWeekProgram(workouts, assignment, exercisesById, new Date()))
      })
      .catch(() => {
        if (!cancelled) setCustom(null)
      })
      .finally(() => {
        if (!cancelled) setCustomLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [isCustom, user, sheetsReady])

  const generatedProgram = useMemo(() => {
    if (isCustom || !isReadyForGeneration(profile)) return null

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
  }, [profile, isCustom])

  if (isCustom) {
    return {
      program: custom?.program ?? null,
      loading: profileLoading || customLoading,
      isCustom: true,
      todayIndex: custom?.todayIndex ?? null,
    }
  }

  return { program: generatedProgram, loading: profileLoading, isCustom: false, todayIndex: null }
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
