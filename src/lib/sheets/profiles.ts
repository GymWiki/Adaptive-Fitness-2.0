import { find, update } from './sheetsTable'
import type { SheetRow } from './rowMapping'
import type { Profile } from '../types'

const TAB = 'profiles'

export function toProfile(row: SheetRow): Profile {
  return {
    id: row.id,
    display_name: row.display_name || null,
    weight_kg: row.weight_kg ? Number(row.weight_kg) : null,
    height_cm: row.height_cm ? Number(row.height_cm) : null,
    gender: (row.gender || null) as Profile['gender'],
    birth_year: row.birth_year ? Number(row.birth_year) : null,
    goal: (row.goal || null) as Profile['goal'],
    days_per_week: row.days_per_week ? Number(row.days_per_week) : null,
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
  if ('goal' in patch) row.goal = patch.goal ?? ''
  if ('days_per_week' in patch) {
    row.days_per_week = patch.days_per_week != null ? String(patch.days_per_week) : ''
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
