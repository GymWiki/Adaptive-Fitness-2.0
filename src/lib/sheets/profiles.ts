import { find, update } from './sheetsTable'
import type { SheetRow } from './rowMapping'
import type { Profile } from '../types'
import type { Weekday } from '../combinedSchedule/types'

const TAB = 'profiles'

function parseWeekdays(value: string): Weekday[] {
  return value ? (value.split(',').filter(Boolean) as Weekday[]) : []
}

export function toProfile(row: SheetRow): Profile {
  return {
    id: row.id,
    display_name: row.display_name || null,
    weight_kg: row.weight_kg ? Number(row.weight_kg) : null,
    height_cm: row.height_cm ? Number(row.height_cm) : null,
    gender: (row.gender || null) as Profile['gender'],
    birth_year: row.birth_year ? Number(row.birth_year) : null,
    primary_focus: (row.primary_focus || null) as Profile['primary_focus'],
    strength_focus_zone: (row.strength_focus_zone || null) as Profile['strength_focus_zone'],
    hybrid_ratio: (row.hybrid_ratio || null) as Profile['hybrid_ratio'],
    target_race_distance: (row.target_race_distance || null) as Profile['target_race_distance'],
    target_race_distance_custom: row.target_race_distance_custom || null,
    target_race_date: row.target_race_date || null,
    available_days: parseWeekdays(row.available_days),
    session_duration: (row.session_duration || null) as Profile['session_duration'],
    running_experience_level: (row.running_experience_level || null) as Profile['running_experience_level'],
    equipment: (row.equipment || null) as Profile['equipment'],
    experience_level: (row.experience_level || null) as Profile['experience_level'],
    onboarding_completed: row.onboarding_completed === 'true',
  }
}

export function fromProfilePatch(patch: Partial<Profile>): SheetRow {
  const row: SheetRow = {}
  if ('display_name' in patch) row.display_name = patch.display_name ?? ''
  if ('weight_kg' in patch) row.weight_kg = patch.weight_kg != null ? String(patch.weight_kg) : ''
  if ('height_cm' in patch) row.height_cm = patch.height_cm != null ? String(patch.height_cm) : ''
  if ('gender' in patch) row.gender = patch.gender ?? ''
  if ('birth_year' in patch) row.birth_year = patch.birth_year != null ? String(patch.birth_year) : ''
  if ('primary_focus' in patch) row.primary_focus = patch.primary_focus ?? ''
  if ('strength_focus_zone' in patch) row.strength_focus_zone = patch.strength_focus_zone ?? ''
  if ('hybrid_ratio' in patch) row.hybrid_ratio = patch.hybrid_ratio ?? ''
  if ('target_race_distance' in patch) row.target_race_distance = patch.target_race_distance ?? ''
  if ('target_race_distance_custom' in patch) {
    row.target_race_distance_custom = patch.target_race_distance_custom ?? ''
  }
  if ('target_race_date' in patch) row.target_race_date = patch.target_race_date ?? ''
  if ('available_days' in patch) row.available_days = (patch.available_days ?? []).join(',')
  if ('session_duration' in patch) row.session_duration = patch.session_duration ?? ''
  if ('running_experience_level' in patch) {
    row.running_experience_level = patch.running_experience_level ?? ''
  }
  if ('equipment' in patch) row.equipment = patch.equipment ?? ''
  if ('experience_level' in patch) row.experience_level = patch.experience_level ?? ''
  if ('onboarding_completed' in patch) row.onboarding_completed = String(patch.onboarding_completed ?? false)
  return row
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const row = await find(TAB, userId)
  return row ? toProfile(row) : null
}

export async function updateProfile(userId: string, patch: Partial<Profile>): Promise<Profile> {
  const row = await update(TAB, userId, fromProfilePatch(patch))
  return toProfile(row)
}
