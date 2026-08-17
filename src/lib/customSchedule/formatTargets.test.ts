import { describe, expect, it } from 'vitest'
import { formatRepRange, formatRirRange } from './formatTargets'

describe('formatRepRange', () => {
  it('formats a range as min-max', () => {
    expect(formatRepRange(8, 12)).toBe('8-12')
  })

  it('formats a single value without a dash when min equals max', () => {
    expect(formatRepRange(10, 10)).toBe('10')
  })
})

describe('formatRirRange', () => {
  it('formats a range as "RIR min-max"', () => {
    expect(formatRirRange(2, 3)).toBe('RIR 2-3')
  })

  it('formats a single value as "RIR n" when min equals max', () => {
    expect(formatRirRange(1, 1)).toBe('RIR 1')
  })
})
