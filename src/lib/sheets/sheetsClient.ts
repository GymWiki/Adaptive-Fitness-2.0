import { getAccessToken } from './sheetsAuth'

const SHEETS_BASE = 'https://sheets.googleapis.com/v4/spreadsheets'
const DRIVE_BASE = 'https://www.googleapis.com/drive/v3/files'

async function authedFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const token = await getAccessToken()
  const response = await fetch(url, {
    ...init,
    headers: {
      ...init?.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })
  if (!response.ok) {
    throw new Error(`Sheets API error ${response.status}: ${await response.text()}`)
  }
  return response.json() as Promise<T>
}

/** All values in a range (a bare tab name returns every row, including the header). */
export async function getValues(spreadsheetId: string, range: string): Promise<string[][]> {
  const data = await authedFetch<{ values?: string[][] }>(
    `${SHEETS_BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}`,
  )
  return data.values ?? []
}

/** Appends a single row to the end of the given range. */
export async function appendRow(spreadsheetId: string, range: string, row: string[]): Promise<void> {
  await appendRows(spreadsheetId, range, [row])
}

/** Appends multiple rows in one API call. */
export async function appendRows(spreadsheetId: string, range: string, rows: string[][]): Promise<void> {
  if (rows.length === 0) return
  await authedFetch(
    `${SHEETS_BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=RAW`,
    { method: 'POST', body: JSON.stringify({ values: rows }) },
  )
}

/** Overwrites a specific row range (e.g. "workouts!A5:D5") in place. */
export async function updateRow(spreadsheetId: string, range: string, row: string[]): Promise<void> {
  await authedFetch(
    `${SHEETS_BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=RAW`,
    { method: 'PUT', body: JSON.stringify({ values: [row] }) },
  )
}

/** Deletes one row by its 0-based sheet-relative index (header is row 0). */
export async function deleteRow(spreadsheetId: string, sheetId: number, rowIndex: number): Promise<void> {
  await authedFetch(`${SHEETS_BASE}/${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    body: JSON.stringify({
      requests: [
        {
          deleteDimension: {
            range: { sheetId, dimension: 'ROWS', startIndex: rowIndex, endIndex: rowIndex + 1 },
          },
        },
      ],
    }),
  })
}

/** Adds new empty tabs to an existing spreadsheet, returning their new sheetIds. */
export async function addTabs(spreadsheetId: string, tabTitles: string[]): Promise<Record<string, number>> {
  if (tabTitles.length === 0) return {}
  const data = await authedFetch<{ replies: Array<{ addSheet: { properties: { title: string; sheetId: number } } }> }>(
    `${SHEETS_BASE}/${spreadsheetId}:batchUpdate`,
    {
      method: 'POST',
      body: JSON.stringify({
        requests: tabTitles.map((title) => ({ addSheet: { properties: { title } } })),
      }),
    },
  )
  const sheetIdByTab: Record<string, number> = {}
  for (const reply of data.replies) {
    sheetIdByTab[reply.addSheet.properties.title] = reply.addSheet.properties.sheetId
  }
  return sheetIdByTab
}

export type NewSpreadsheet = { spreadsheetId: string; sheetIdByTab: Record<string, number> }

/** Creates a spreadsheet with one sheet (tab) per name in `tabTitles`, each initially empty. */
export async function createSpreadsheet(title: string, tabTitles: string[]): Promise<NewSpreadsheet> {
  const data = await authedFetch<{
    spreadsheetId: string
    sheets: Array<{ properties: { title: string; sheetId: number } }>
  }>(SHEETS_BASE, {
    method: 'POST',
    body: JSON.stringify({
      properties: { title },
      sheets: tabTitles.map((tabTitle) => ({ properties: { title: tabTitle } })),
    }),
  })

  const sheetIdByTab: Record<string, number> = {}
  for (const sheet of data.sheets) {
    sheetIdByTab[sheet.properties.title] = sheet.properties.sheetId
  }
  return { spreadsheetId: data.spreadsheetId, sheetIdByTab }
}

/** The per-tab internal sheetId map for an existing spreadsheet — needed for deleteRow's batchUpdate. */
export async function getSheetIdByTab(spreadsheetId: string): Promise<Record<string, number>> {
  const data = await authedFetch<{ sheets: Array<{ properties: { title: string; sheetId: number } }> }>(
    `${SHEETS_BASE}/${spreadsheetId}?fields=sheets.properties`,
  )
  const sheetIdByTab: Record<string, number> = {}
  for (const sheet of data.sheets) {
    sheetIdByTab[sheet.properties.title] = sheet.properties.sheetId
  }
  return sheetIdByTab
}

/** Finds a spreadsheet by exact name among files this app has access to (drive.file scope). Null if none. */
export async function findSpreadsheetByName(name: string): Promise<string | null> {
  const escaped = name.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
  const query = encodeURIComponent(
    `name = '${escaped}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`,
  )
  const data = await authedFetch<{ files: Array<{ id: string }> }>(
    `${DRIVE_BASE}?q=${query}&fields=files(id)`,
  )
  return data.files[0]?.id ?? null
}
