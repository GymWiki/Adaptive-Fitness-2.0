import { appendRow, appendRows, deleteRow, updateRow } from './sheetsClient'
import { columnLetter, objectToRow, rowsToObjects } from './rowMapping'
import type { SheetRow } from './rowMapping'
import { getTab, invalidateTab } from './sheetsStore'
import { getSheetsSession } from './sheetsSession'

/** 0-based data-row index (0 = first row after the header) → 1-based spreadsheet row number for range strings. */
export function dataRowToSheetRowNumber(dataRowIndex: number): number {
  return dataRowIndex + 2
}

/** 0-based data-row index → 0-based sheet-relative index (header occupies index 0) for batchUpdate. */
export function dataRowToSheetRelativeIndex(dataRowIndex: number): number {
  return dataRowIndex + 1
}

type Located = { header: string[]; dataRowIndex: number; record: SheetRow | null }

async function locate(tab: string, id: string): Promise<Located> {
  const raw = await getTab(tab)
  const [header = [], ...dataRows] = raw
  const rows = rowsToObjects(header, dataRows)
  const dataRowIndex = rows.findIndex((row) => row.id === id)
  return { header, dataRowIndex, record: dataRowIndex === -1 ? null : rows[dataRowIndex] }
}

export async function list(tab: string): Promise<SheetRow[]> {
  const raw = await getTab(tab)
  const [header = [], ...dataRows] = raw
  return rowsToObjects(header, dataRows)
}

export async function find(tab: string, id: string): Promise<SheetRow | null> {
  const { record } = await locate(tab, id)
  return record
}

export async function insert(tab: string, record: SheetRow): Promise<SheetRow> {
  const { spreadsheetId } = getSheetsSession()
  const [header = []] = await getTab(tab)
  await appendRow(spreadsheetId, tab, objectToRow(header, record))
  invalidateTab(tab)
  return record
}

export async function insertMany(tab: string, records: SheetRow[]): Promise<SheetRow[]> {
  if (records.length === 0) return []
  const { spreadsheetId } = getSheetsSession()
  const [header = []] = await getTab(tab)
  await appendRows(spreadsheetId, tab, records.map((record) => objectToRow(header, record)))
  invalidateTab(tab)
  return records
}

export async function update(tab: string, id: string, patch: SheetRow): Promise<SheetRow> {
  const { spreadsheetId } = getSheetsSession()
  const { header, dataRowIndex, record } = await locate(tab, id)
  if (!record) throw new Error(`No row with id "${id}" in ${tab}`)

  const updated = { ...record, ...patch }
  const rowNumber = dataRowToSheetRowNumber(dataRowIndex)
  const range = `${tab}!A${rowNumber}:${columnLetter(header.length - 1)}${rowNumber}`
  await updateRow(spreadsheetId, range, objectToRow(header, updated))
  invalidateTab(tab)
  return updated
}

export async function remove(tab: string, id: string): Promise<void> {
  const { spreadsheetId, sheetIdByTab } = getSheetsSession()
  const { dataRowIndex, record } = await locate(tab, id)
  if (!record) return

  await deleteRow(spreadsheetId, sheetIdByTab[tab], dataRowToSheetRelativeIndex(dataRowIndex))
  invalidateTab(tab)
}
