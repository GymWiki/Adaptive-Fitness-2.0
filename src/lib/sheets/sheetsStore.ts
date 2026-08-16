import { getValues } from './sheetsClient'
import { getSheetsSession } from './sheetsSession'

// In-memory only — avoids redundant reads of the same tab across hooks/pages
// within a session. Not a persistence layer; nothing survives a reload.
const cache = new Map<string, Promise<string[][]>>()

export function getTab(tab: string): Promise<string[][]> {
  const cached = cache.get(tab)
  if (cached) return cached

  const { spreadsheetId } = getSheetsSession()
  const promise = getValues(spreadsheetId, tab)
  cache.set(tab, promise)
  promise.catch(() => cache.delete(tab)) // don't cache a failed read
  return promise
}

export function invalidateTab(tab: string): void {
  cache.delete(tab)
}

export function clearSheetsCache(): void {
  cache.clear()
}
