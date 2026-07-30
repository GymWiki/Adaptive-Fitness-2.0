/**
 * A template's restSeconds is always numeric-only — a single value ("90")
 * or a range ("150-180"). The guided rest timer counts down from the lower
 * bound (or the single value when there's no range).
 */
export function parseRestSeconds(restSeconds: string): number {
  const [lowerBound] = restSeconds.split('-')
  return Number(lowerBound)
}
