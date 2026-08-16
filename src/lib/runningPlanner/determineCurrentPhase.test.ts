import { describe, expect, it } from 'vitest'
import { determineCurrentPhase } from './determineCurrentPhase'

const TODAY = new Date('2026-01-01T00:00:00Z')

function weeksFromToday(weeks: number): Date {
  return new Date(TODAY.getTime() + weeks * 7 * 24 * 60 * 60 * 1000)
}

describe('determineCurrentPhase', () => {
  it('returns ongoing mode when there is no race date', () => {
    expect(determineCurrentPhase(TODAY, null, '5k', 'intermediate')).toEqual({ mode: 'ongoing' })
  })

  it('treats a race far beyond the plan length as still-base, week 1', () => {
    const result = determineCurrentPhase(TODAY, weeksFromToday(52), '5k', 'beginner')
    expect(result).toMatchObject({ mode: 'race_targeted', phase: 'base', weekInPhase: 1 })
  })

  it('lands in taper the week immediately before a 5K/10K (1-week taper)', () => {
    const result = determineCurrentPhase(TODAY, weeksFromToday(1), '5k', 'beginner')
    expect(result).toMatchObject({
      mode: 'race_targeted',
      phase: 'taper',
      weekInPhase: 1,
      totalWeeksInPhase: 1,
      weeksUntilRace: 1,
    })
  })

  it('lands in taper for the full 2 weeks before a half marathon', () => {
    const twoWeeksOut = determineCurrentPhase(TODAY, weeksFromToday(2), 'half_marathon', 'intermediate')
    expect(twoWeeksOut).toMatchObject({ phase: 'taper', weekInPhase: 1, totalWeeksInPhase: 2 })

    const oneWeekOut = determineCurrentPhase(TODAY, weeksFromToday(1), 'half_marathon', 'intermediate')
    expect(oneWeekOut).toMatchObject({ phase: 'taper', weekInPhase: 2, totalWeeksInPhase: 2 })
  })

  it('progresses base → build → peak → taper as the race approaches, for one fixed plan', () => {
    // Beginner 5K: total 12 weeks → base 3, build 6, peak 2, taper 1 (see
    // determineCurrentPhase.ts comments). weeksOut = 12 - elapsedWeeks, one
    // sample per phase: elapsed 0 (base start), 3 (build start),
    // 9 (peak start), 11 (taper, its only possible week here).
    const phaseAt = (weeksOut: number) => {
      const result = determineCurrentPhase(TODAY, weeksFromToday(weeksOut), '5k', 'beginner')
      return result.mode === 'race_targeted' ? result.phase : null
    }
    expect([phaseAt(12), phaseAt(9), phaseAt(3), phaseAt(1)]).toEqual(['base', 'build', 'peak', 'taper'])
  })

  it('never returns a negative week-in-phase or a phase beyond taper', () => {
    for (let weeksOut = 0; weeksOut <= 20; weeksOut++) {
      const result = determineCurrentPhase(TODAY, weeksFromToday(weeksOut), 'half_marathon', 'experienced')
      if (result.mode === 'race_targeted') {
        expect(result.weekInPhase).toBeGreaterThanOrEqual(1)
        expect(result.weekInPhase).toBeLessThanOrEqual(result.totalWeeksInPhase)
      }
    }
  })
})
