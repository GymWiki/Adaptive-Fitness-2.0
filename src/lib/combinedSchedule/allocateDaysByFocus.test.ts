import { describe, expect, it } from 'vitest'
import { allocateDaysByFocus } from './allocateDaysByFocus'
import type { HybridRatio, PrimaryFocus } from './types'

const DAYS = [2, 3, 4, 5, 6] as const
const FOCI: PrimaryFocus[] = ['strength', 'hybrid', 'running', 'general_health']

describe('allocateDaysByFocus', () => {
  it('rejects fewer than 2 or more than 6 available days', () => {
    expect(() => allocateDaysByFocus('strength', 1)).toThrow()
    expect(() => allocateDaysByFocus('strength', 7)).toThrow()
  })

  it('requires a hybridRatio for the hybrid focus', () => {
    expect(() => allocateDaysByFocus('hybrid', 6)).toThrow()
  })

  describe.each(FOCI)('%s', (focus) => {
    it.each(DAYS)('always uses every available day and respects the rest-day invariant (%i days)', (days) => {
      const allocation = allocateDaysByFocus(focus, days, '50_50')
      expect(allocation.strengthDays + allocation.runningDays).toBe(days)
      expect(allocation.restDays).toBe(7 - days)
      expect(allocation.strengthDays + allocation.runningDays).toBeLessThanOrEqual(6)
      expect(allocation.restDays).toBeGreaterThanOrEqual(1)
    })
  })

  it('gives strength the majority of days for the strength focus', () => {
    const allocation = allocateDaysByFocus('strength', 5)
    expect(allocation.strengthDays).toBeGreaterThan(allocation.runningDays)
    expect(allocation.runningDays).toBeLessThanOrEqual(2)
  })

  it('gives running the majority of days for the running focus, strength capped at 2', () => {
    const allocation = allocateDaysByFocus('running', 6)
    expect(allocation.runningDays).toBeGreaterThan(allocation.strengthDays)
    expect(allocation.strengthDays).toBeLessThanOrEqual(2)
  })

  it.each<[HybridRatio, number]>([
    ['50_50', 3],
    ['60_40', 3.6],
    ['40_60', 2.4],
  ])('approximates the %s ratio on 6 available days', (ratio, expectedStrength) => {
    const allocation = allocateDaysByFocus('hybrid', 6, ratio)
    expect(allocation.strengthDays).toBe(Math.round(expectedStrength))
    expect(allocation.strengthDays + allocation.runningDays).toBe(6)
  })

  it('keeps general_health roughly balanced, favoring running on odd day counts', () => {
    const allocation = allocateDaysByFocus('general_health', 5)
    expect(allocation.strengthDays).toBe(2)
    expect(allocation.runningDays).toBe(3)
  })
})
