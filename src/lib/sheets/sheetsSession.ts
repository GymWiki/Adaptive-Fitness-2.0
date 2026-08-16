export type SheetsSession = {
  spreadsheetId: string
  sheetIdByTab: Record<string, number>
}

let session: SheetsSession | null = null

export function setSheetsSession(next: SheetsSession): void {
  session = next
}

/** Throws if provisioning hasn't completed yet — every data call happens after sign-in resolves the spreadsheet. */
export function getSheetsSession(): SheetsSession {
  if (!session) throw new Error('Sheets session not initialized — provisioning must complete first')
  return session
}

export function clearSheetsSession(): void {
  session = null
}
