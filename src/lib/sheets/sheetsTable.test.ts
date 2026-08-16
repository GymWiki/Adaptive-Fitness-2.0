import { describe, expect, it } from 'vitest'
import { dataRowToSheetRelativeIndex, dataRowToSheetRowNumber } from './sheetsTable'

describe('dataRowToSheetRowNumber', () => {
  it('offsets by 2: 1-based, plus the header row', () => {
    expect(dataRowToSheetRowNumber(0)).toBe(2) // first data row is sheet row 2
    expect(dataRowToSheetRowNumber(1)).toBe(3)
    expect(dataRowToSheetRowNumber(9)).toBe(11)
  })
})

describe('dataRowToSheetRelativeIndex', () => {
  it('offsets by 1: the header occupies relative index 0', () => {
    expect(dataRowToSheetRelativeIndex(0)).toBe(1)
    expect(dataRowToSheetRelativeIndex(1)).toBe(2)
    expect(dataRowToSheetRelativeIndex(9)).toBe(10)
  })
})
