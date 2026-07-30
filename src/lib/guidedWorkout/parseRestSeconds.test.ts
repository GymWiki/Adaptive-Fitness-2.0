import { describe, expect, it } from 'vitest'
import { parseRestSeconds } from './parseRestSeconds'

describe('parseRestSeconds', () => {
  it('parses a single value', () => {
    expect(parseRestSeconds('90')).toBe(90)
  })

  it('parses the lower bound of a range', () => {
    expect(parseRestSeconds('150-180')).toBe(150)
  })
})
