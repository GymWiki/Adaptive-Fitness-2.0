/** Formats an exercise's stored rep range as the same style used elsewhere ("8-12", or "10" when min===max). */
export function formatRepRange(min: number, max: number): string {
  return min === max ? String(min) : `${min}-${max}`
}

/** Formats an exercise's stored RIR range as "RIR 2-3", or "RIR 2" when min===max. */
export function formatRirRange(min: number, max: number): string {
  return min === max ? `RIR ${min}` : `RIR ${min}-${max}`
}
