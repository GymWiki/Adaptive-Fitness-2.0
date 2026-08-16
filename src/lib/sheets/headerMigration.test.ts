import { describe, expect, it } from 'vitest'
import { missingColumns } from './headerMigration'

describe('missingColumns', () => {
  it('returns nothing when every expected column is already present', () => {
    expect(missingColumns(['id', 'name'], ['id', 'name'])).toEqual([])
  })

  it('returns expected columns not present in the actual header, in expected order', () => {
    expect(missingColumns(['id'], ['id', 'name', 'goal'])).toEqual(['name', 'goal'])
  })

  it('ignores extra columns the actual header has beyond what is expected', () => {
    expect(missingColumns(['id', 'legacy_column'], ['id'])).toEqual([])
  })

  it('treats an empty actual header as entirely missing', () => {
    expect(missingColumns([], ['id', 'name'])).toEqual(['id', 'name'])
  })
})
