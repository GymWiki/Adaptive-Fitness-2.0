export type ChartPoint = {
  /** ISO date string, used for the tooltip label. */
  date: string
  value: number
}

export function formatChartDate(iso: string): string {
  return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
}
