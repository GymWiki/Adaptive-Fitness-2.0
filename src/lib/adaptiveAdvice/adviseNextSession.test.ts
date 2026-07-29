import { describe, expect, it } from 'vitest'
import { adviseNextSession } from './adviseNextSession'
import type { ExerciseTarget, SessionLog } from './types'

const HYPERTROPHY_ISOLATION: ExerciseTarget = {
  repRangeMin: 8,
  repRangeMax: 12,
  targetRirMin: 2,
  targetRirMax: 3,
  kind: 'isolation',
}

const HYPERTROPHY_COMPOUND: ExerciseTarget = {
  ...HYPERTROPHY_ISOLATION,
  kind: 'compound',
}

function session(weightKg: number, reps: number[], rir: number[]): SessionLog {
  return {
    date: '2026-07-01',
    sets: reps.map((r, i) => ({ weightKg, reps: r, rir: rir[i] })),
  }
}

describe('adviseNextSession — geen historie', () => {
  it('advises geen_historie with no weight suggestion for a brand-new exercise', () => {
    const advice = adviseNextSession(HYPERTROPHY_ISOLATION, [])
    expect(advice.advies).toBe('geen_historie')
    expect(advice.gewicht).toBeNull()
    expect(advice.reden.toLowerCase()).toContain('startgewicht')
  })
})

describe('adviseNextSession — omhoog', () => {
  it('advises a real weight increase for isolation exercises that hit the top of the range with reserve', () => {
    const last = session(20, [12, 12, 12], [2, 2, 3])
    const advice = adviseNextSession(HYPERTROPHY_ISOLATION, [last])
    expect(advice.advies).toBe('omhoog')
    expect(advice.gewicht).toBeGreaterThan(20)
  })

  it('advises a bigger step for compound exercises than isolation exercises', () => {
    const last = session(60, [12, 12, 12], [2, 3, 2])
    const advice = adviseNextSession(HYPERTROPHY_COMPOUND, [last])
    expect(advice.advies).toBe('omhoog')
    const isolationAdvice = adviseNextSession(HYPERTROPHY_ISOLATION, [
      session(60, [12, 12, 12], [2, 3, 2]),
    ])
    expect(advice.gewicht! - 60).toBeGreaterThan(isolationAdvice.gewicht! - 60)
  })

  it('still advises omhoog when RIR came in higher than the target (too easy)', () => {
    const last = session(20, [12, 12, 12], [5, 5, 5])
    const advice = adviseNextSession(HYPERTROPHY_ISOLATION, [last])
    expect(advice.advies).toBe('omhoog')
  })

  it('includes a reason referencing the actual last performance', () => {
    const last = session(20, [12, 12, 12, 12], [2, 2, 2, 2])
    const advice = adviseNextSession(HYPERTROPHY_ISOLATION, [last])
    expect(advice.reden).toContain('4×12')
    expect(advice.reden).toContain('RIR 2')
  })
})

describe('adviseNextSession — gelijk', () => {
  it('advises the same weight when the rep range was not fully hit', () => {
    const last = session(20, [11, 10, 9], [2, 2, 1])
    const advice = adviseNextSession(HYPERTROPHY_ISOLATION, [last])
    expect(advice.advies).toBe('gelijk')
    expect(advice.gewicht).toBe(20)
    expect(advice.reden).toContain('tekort')
  })

  it('advises the same weight when reps hit max but RIR was lower than target (too close to failure)', () => {
    const last = session(20, [12, 12, 12], [1, 1, 1])
    const advice = adviseNextSession(HYPERTROPHY_ISOLATION, [last])
    expect(advice.advies).toBe('gelijk')
    expect(advice.gewicht).toBe(20)
    expect(advice.reden.toLowerCase()).toContain('falen')
  })

  it('does not advise omlaag off a single below-range session', () => {
    const last = session(20, [5, 5, 5], [0, 0, 0])
    const advice = adviseNextSession(HYPERTROPHY_ISOLATION, [last])
    expect(advice.advies).toBe('gelijk')
  })
})

describe('adviseNextSession — omlaag', () => {
  it('advises a ~10% reduction after two consecutive sessions below the rep floor', () => {
    const last = session(20, [6, 5, 5], [0, 0, 0])
    const previous = session(20, [7, 6, 5], [0, 0, 1])
    const advice = adviseNextSession(HYPERTROPHY_ISOLATION, [last, previous])
    expect(advice.advies).toBe('omlaag')
    expect(advice.gewicht).toBeLessThan(20)
    expect(advice.gewicht).toBeGreaterThan(16)
    expect(advice.reden).toContain('-10%')
    expect(advice.reden).toContain('8 reps')
  })

  it('does not advise omlaag if only the most recent session missed the floor', () => {
    const last = session(20, [6, 5, 5], [0, 0, 0])
    const previous = session(20, [12, 12, 12], [3, 3, 3])
    const advice = adviseNextSession(HYPERTROPHY_ISOLATION, [last, previous])
    expect(advice.advies).not.toBe('omlaag')
  })
})
