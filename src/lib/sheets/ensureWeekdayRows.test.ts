import { describe, expect, it } from 'vitest'
import { missingWeekdayRows } from './ensureWeekdayRows'

describe('missingWeekdayRows', () => {
  it('returns all 7 weekdays when none exist yet', () => {
    expect(missingWeekdayRows([])).toEqual(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])
  })

  it('returns nothing when all 7 already exist', () => {
    expect(missingWeekdayRows(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])).toEqual([])
  })

  it('returns only the missing weekdays, in Monday-first order', () => {
    expect(missingWeekdayRows(['wed', 'mon', 'fri'])).toEqual(['tue', 'thu', 'sat', 'sun'])
  })

  it('ignores unrelated extra ids', () => {
    expect(missingWeekdayRows(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun', 'bogus'])).toEqual([])
  })
})
