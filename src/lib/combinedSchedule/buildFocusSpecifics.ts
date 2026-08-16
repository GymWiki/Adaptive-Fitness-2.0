import type { FocusSpecifics, HybridRatio, PrimaryFocus, RaceDistance, StrengthFocusZone } from './types'

type SpecificsSource = {
  primary_focus: PrimaryFocus
  strength_focus_zone: StrengthFocusZone | null
  hybrid_ratio: HybridRatio | null
  target_race_distance: RaceDistance | null
  target_race_distance_custom: string | null
  target_race_date: string | null
}

/** Reconstructs the discriminated FocusSpecifics union from a profile's flat, nullable columns. */
export function buildFocusSpecifics(source: SpecificsSource): FocusSpecifics | null {
  if (source.primary_focus === 'strength') {
    if (!source.strength_focus_zone) return null
    return { primaryFocus: 'strength', strengthFocusZone: source.strength_focus_zone }
  }
  if (source.primary_focus === 'hybrid') {
    if (!source.hybrid_ratio) return null
    return { primaryFocus: 'hybrid', hybridRatio: source.hybrid_ratio }
  }
  if (source.primary_focus === 'running') {
    if (!source.target_race_distance) return null
    return {
      primaryFocus: 'running',
      raceDistance: source.target_race_distance,
      raceDistanceCustom: source.target_race_distance_custom,
      raceDate: source.target_race_date,
    }
  }
  return { primaryFocus: 'general_health' }
}
