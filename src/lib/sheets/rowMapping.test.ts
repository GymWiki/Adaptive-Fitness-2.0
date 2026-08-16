import { describe, expect, it } from 'vitest'
import { columnLetter, objectToRow, rowsToObjects } from './rowMapping'

describe('rowsToObjects', () => {
  const header = ['id', 'name', 'weight_kg']

  it('maps rows to header-keyed objects', () => {
    expect(rowsToObjects(header, [['1', 'Bench', '80']])).toEqual([
      { id: '1', name: 'Bench', weight_kg: '80' },
    ])
  })

  it('fills missing trailing cells with empty strings', () => {
    expect(rowsToObjects(header, [['1', 'Bench']])).toEqual([
      { id: '1', name: 'Bench', weight_kg: '' },
    ])
  })

  it('ignores cells beyond the header', () => {
    expect(rowsToObjects(header, [['1', 'Bench', '80', 'extra']])).toEqual([
      { id: '1', name: 'Bench', weight_kg: '80' },
    ])
  })

  it('returns an empty array for no rows', () => {
    expect(rowsToObjects(header, [])).toEqual([])
  })
})

describe('objectToRow', () => {
  it('is the inverse of rowsToObjects, in header order', () => {
    const header = ['id', 'name', 'weight_kg']
    const obj = { weight_kg: '80', id: '1', name: 'Bench' }
    expect(objectToRow(header, obj)).toEqual(['1', 'Bench', '80'])
  })

  it('fills missing keys with empty strings', () => {
    expect(objectToRow(['id', 'name'], { id: '1' })).toEqual(['1', ''])
  })
})

describe('columnLetter', () => {
  it('maps single letters for the first 26 columns', () => {
    expect(columnLetter(0)).toBe('A')
    expect(columnLetter(25)).toBe('Z')
  })

  it('maps double letters beyond column 26', () => {
    expect(columnLetter(26)).toBe('AA')
    expect(columnLetter(27)).toBe('AB')
    expect(columnLetter(51)).toBe('AZ')
    expect(columnLetter(52)).toBe('BA')
  })
})
