/** A Sheets row, keyed by header column name — every value is a raw string, since that's all Sheets stores. */
export type SheetRow = Record<string, string>

/**
 * Maps raw Sheets rows to header-keyed objects. Missing trailing cells
 * (Sheets omits them rather than sending empty strings) become ''; extra
 * cells beyond the header are ignored.
 */
export function rowsToObjects(header: string[], rows: string[][]): SheetRow[] {
  return rows.map((row) => {
    const obj: SheetRow = {}
    header.forEach((column, index) => {
      obj[column] = row[index] ?? ''
    })
    return obj
  })
}

/** The inverse of rowsToObjects — one object back into a single raw row, in header order. */
export function objectToRow(header: string[], obj: SheetRow): string[] {
  return header.map((column) => obj[column] ?? '')
}

/** 0-based column index → spreadsheet column letter(s): 0→A, 25→Z, 26→AA. */
export function columnLetter(index: number): string {
  let n = index
  let letters = ''
  do {
    letters = String.fromCharCode(65 + (n % 26)) + letters
    n = Math.floor(n / 26) - 1
  } while (n >= 0)
  return letters
}
