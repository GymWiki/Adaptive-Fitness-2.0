/** Column names present in `expectedHeader` but missing from `actualHeader`, in expected order. */
export function missingColumns(actualHeader: string[], expectedHeader: readonly string[]): string[] {
  const actual = new Set(actualHeader)
  return expectedHeader.filter((column) => !actual.has(column))
}
