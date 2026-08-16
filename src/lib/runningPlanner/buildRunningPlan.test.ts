import { describe, expect, it } from 'vitest'
import { buildRunningPlan, weeklyVolumeIncreaseCeiling } from './buildRunningPlan'
import type { PhaseSchedule } from './determineCurrentPhase'

const ONGOING: PhaseSchedule = { mode: 'ongoing' }

function raceTargeted(overrides: Partial<Extract<PhaseSchedule, { mode: 'race_targeted' }>>): PhaseSchedule {
  return {
    mode: 'race_targeted',
    phase: 'build',
    weekInPhase: 1,
    totalWeeksInPhase: 6,
    weeksUntilRace: 8,
    weeksElapsedInPlan: 3,
    ...overrides,
  }
}

describe('buildRunningPlan', () => {
  it('gives beginners only run_walk sessions, in every phase', () => {
    for (const phase of ['base', 'build', 'peak', 'taper'] as const) {
      const plan = buildRunningPlan(raceTargeted({ phase }), 4, 'beginner')
      expect(plan.sessions.every((s) => s.type === 'run_walk')).toBe(true)
    }
    expect(buildRunningPlan(ONGOING, 3, 'beginner').sessions.every((s) => s.type === 'run_walk')).toBe(true)
  })

  it('never gives beginners tempo or interval sessions', () => {
    const plan = buildRunningPlan(raceTargeted({ phase: 'peak' }), 5, 'beginner')
    expect(plan.sessions.some((s) => s.type === 'tempo' || s.type === 'interval')).toBe(false)
  })

  it('gives intermediate/experienced runners quality sessions in build and peak, given enough days', () => {
    const build = buildRunningPlan(raceTargeted({ phase: 'build' }), 4, 'intermediate')
    expect(build.sessions.some((s) => s.type === 'tempo')).toBe(true)
    expect(build.sessions.some((s) => s.type === 'interval')).toBe(true)

    const peak = buildRunningPlan(raceTargeted({ phase: 'peak' }), 4, 'experienced')
    expect(peak.sessions.some((s) => s.type === 'race_pace')).toBe(true)
  })

  it('produces one session per allocated running day', () => {
    for (let days = 1; days <= 5; days++) {
      expect(buildRunningPlan(raceTargeted({}), days, 'intermediate').sessions).toHaveLength(days)
    }
  })

  it('returns no sessions when no running days are allocated', () => {
    expect(buildRunningPlan(raceTargeted({}), 0, 'intermediate').sessions).toEqual([])
  })

  it('reduces volume in taper relative to build, for the same elapsed-weeks anchor', () => {
    const build = buildRunningPlan(raceTargeted({ phase: 'build', weeksElapsedInPlan: 5 }), 3, 'intermediate')
    const taper = buildRunningPlan(raceTargeted({ phase: 'taper', weeksElapsedInPlan: 5 }), 3, 'intermediate')
    expect(taper.totalDistanceKm).toBeLessThan(build.totalDistanceKm)
  })

  it('keeps a constant volume in ongoing mode regardless of experience', () => {
    const first = buildRunningPlan(ONGOING, 3, 'experienced')
    const second = buildRunningPlan(ONGOING, 3, 'experienced')
    expect(first.totalDistanceKm).toBe(second.totalDistanceKm)
  })
})

describe('weeklyVolumeIncreaseCeiling', () => {
  it('caps beginners at the conservative 10% default', () => {
    expect(weeklyVolumeIncreaseCeiling('beginner')).toBe(0.1)
  })

  it('allows intermediate/experienced runners a higher short-term ceiling than beginners', () => {
    expect(weeklyVolumeIncreaseCeiling('intermediate')).toBeGreaterThan(weeklyVolumeIncreaseCeiling('beginner'))
    expect(weeklyVolumeIncreaseCeiling('experienced')).toBeGreaterThanOrEqual(
      weeklyVolumeIncreaseCeiling('intermediate'),
    )
  })
})
