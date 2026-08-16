import { describe, expect, it } from 'vitest'
import { generateCombinedSchedule } from './generateCombinedSchedule'
import type { FocusSpecifics, PrimaryFocus, Weekday } from './types'

const TODAY = new Date('2026-01-01T00:00:00Z')
const SIX_DAYS: Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat']

function days(n: number): Weekday[] {
  return SIX_DAYS.slice(0, n)
}

describe('generateCombinedSchedule', () => {
  it('always produces a 7-slot week', () => {
    const result = generateCombinedSchedule(
      'hybrid',
      { primaryFocus: 'hybrid', hybridRatio: '50_50' },
      days(4),
      'full_gym',
      'intermediate',
      'intermediate',
      TODAY,
    )
    expect(result.week).toHaveLength(7)
  })

  it('the merged week accounts for every allocated strength/running/rest day exactly once', () => {
    const result = generateCombinedSchedule(
      'strength',
      { primaryFocus: 'strength', strengthFocusZone: 'general_hypertrophy' },
      days(5),
      'full_gym',
      'intermediate',
      'beginner',
      TODAY,
    )
    const counts = result.week.reduce(
      (acc, slot) => ({ ...acc, [slot.type]: (acc[slot.type as keyof typeof acc] ?? 0) + 1 }),
      { strength: 0, running: 0, rest: 0 } as Record<'strength' | 'running' | 'rest', number>,
    )
    expect(counts.strength).toBe(result.allocation.strengthDays)
    expect(counts.running).toBe(result.allocation.runningDays)
    expect(counts.rest).toBe(result.allocation.restDays)
  })

  it('always leaves at least one rest day, across every focus', () => {
    const foci: Array<[PrimaryFocus, FocusSpecifics]> = [
      ['strength', { primaryFocus: 'strength', strengthFocusZone: 'compound_lifts' }],
      ['hybrid', { primaryFocus: 'hybrid', hybridRatio: '60_40' }],
      ['running', { primaryFocus: 'running', raceDistance: '10k', raceDistanceCustom: null, raceDate: null }],
      ['general_health', { primaryFocus: 'general_health' }],
    ]
    for (const [focus, specifics] of foci) {
      for (let n = 2; n <= 6; n++) {
        const result = generateCombinedSchedule(focus, specifics, days(n), 'full_gym', 'intermediate', 'intermediate', TODAY)
        expect(result.week.filter((s) => s.type === 'rest').length).toBeGreaterThanOrEqual(1)
      }
    }
  })

  it('applies the strength "3-6 reps" override only for compound_lifts, not general_hypertrophy', () => {
    const compound = generateCombinedSchedule(
      'strength',
      { primaryFocus: 'strength', strengthFocusZone: 'compound_lifts' },
      days(4),
      'full_gym',
      'intermediate',
      'intermediate',
      TODAY,
    )
    const hypertrophy = generateCombinedSchedule(
      'strength',
      { primaryFocus: 'strength', strengthFocusZone: 'general_hypertrophy' },
      days(4),
      'full_gym',
      'intermediate',
      'intermediate',
      TODAY,
    )
    const compoundReps = compound.week
      .filter((s): s is Extract<typeof s, { type: 'strength' }> => s.type === 'strength')
      .flatMap((s) => (s.day.type === 'training' ? s.day.exercises.map((e) => e.reps) : []))
    const hypertrophyReps = hypertrophy.week
      .filter((s): s is Extract<typeof s, { type: 'strength' }> => s.type === 'strength')
      .flatMap((s) => (s.day.type === 'training' ? s.day.exercises.map((e) => e.reps) : []))

    expect(compoundReps).toContain('3-6')
    expect(hypertrophyReps).not.toContain('3-6')
  })

  it('produces a running plan with the allocated number of sessions', () => {
    const result = generateCombinedSchedule(
      'running',
      { primaryFocus: 'running', raceDistance: '10k', raceDistanceCustom: null, raceDate: null },
      days(6),
      'full_gym',
      'beginner',
      'beginner',
      TODAY,
    )
    expect(result.runningPlan?.sessions).toHaveLength(result.allocation.runningDays)
  })

  it('never generates a strength template wider than 6 days (interference/rest invariants stay meaningful)', () => {
    for (let n = 2; n <= 6; n++) {
      const result = generateCombinedSchedule(
        'strength',
        { primaryFocus: 'strength', strengthFocusZone: 'general_hypertrophy' },
        days(n),
        'full_gym',
        'advanced',
        'experienced',
        TODAY,
      )
      expect(result.strengthProgram.daysPerWeek).toBeLessThanOrEqual(6)
    }
  })
})
