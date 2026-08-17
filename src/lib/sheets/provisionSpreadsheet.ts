import {
  addTabs,
  appendRow,
  appendRows,
  createSpreadsheet,
  findSpreadsheetByName,
  getSheetIdByTab,
  getValues,
  updateRow,
} from './sheetsClient'
import { setSheetsSession } from './sheetsSession'
import { missingColumns } from './headerMigration'
import { missingWeekdayRows } from './ensureWeekdayRows'
import { columnLetter } from './rowMapping'
import { WEEKDAY_ORDER } from '../customSchedule/types'
import type { GoogleUser } from '../googleAuth'

const SPREADSHEET_NAME = 'Fitness Log — Data'

export const TAB_HEADERS = {
  profiles: [
    'id',
    'display_name',
    'weight_kg',
    'height_cm',
    'gender',
    'birth_year',
    'primary_focus',
    'strength_focus_zone',
    'hybrid_ratio',
    'target_race_distance',
    'target_race_distance_custom',
    'target_race_date',
    'available_days',
    'session_duration',
    'running_experience_level',
    'equipment',
    'experience_level',
    'onboarding_completed',
    'schedule_source',
  ],
  exercises: [
    'id',
    'name',
    'muscle_group',
    'kind',
    'rep_range_min',
    'rep_range_max',
    'target_rir_min',
    'target_rir_max',
  ],
  workouts: ['id', 'name', 'performed_at', 'created_at'],
  workout_sets: ['id', 'workout_id', 'exercise_id', 'set_order', 'weight_kg', 'reps', 'rir', 'created_at'],
  custom_workouts: ['id', 'name', 'exercises_json'],
  custom_schedule: ['id', 'workout_id'],
} as const

export type TabName = keyof typeof TAB_HEADERS

// Same seed library as the original Supabase migrations
// (20260729000000_init.sql + 20260729010000_adaptive_advice.sql) — compound
// lifts get the lower 6-10 rep range, isolation work stays at 10-15.
const DEFAULT_EXERCISES: Array<{ name: string; muscle_group: string; kind: 'compound' | 'isolation' }> = [
  { name: 'Bench press', muscle_group: 'Borst', kind: 'compound' },
  { name: 'Incline dumbbell press', muscle_group: 'Borst', kind: 'isolation' },
  { name: 'Squat', muscle_group: 'Benen', kind: 'compound' },
  { name: 'Deadlift', muscle_group: 'Rug/Benen', kind: 'compound' },
  { name: 'Overhead press', muscle_group: 'Schouders', kind: 'compound' },
  { name: 'Barbell row', muscle_group: 'Rug', kind: 'compound' },
  { name: 'Pull-up', muscle_group: 'Rug', kind: 'compound' },
  { name: 'Lat pulldown', muscle_group: 'Rug', kind: 'isolation' },
  { name: 'Bicep curl', muscle_group: 'Armen', kind: 'isolation' },
  { name: 'Tricep pushdown', muscle_group: 'Armen', kind: 'isolation' },
  { name: 'Leg press', muscle_group: 'Benen', kind: 'isolation' },
  { name: 'Leg curl', muscle_group: 'Benen', kind: 'isolation' },
  { name: 'Calf raise', muscle_group: 'Benen', kind: 'isolation' },
  { name: 'Plank', muscle_group: 'Core', kind: 'isolation' },
]

function repRangeFor(kind: 'compound' | 'isolation'): { min: number; max: number } {
  return kind === 'compound' ? { min: 6, max: 10 } : { min: 10, max: 15 }
}

function storageKey(userId: string): string {
  return `sheets_spreadsheet_id:${userId}`
}

async function seedNewSpreadsheet(spreadsheetId: string, user: GoogleUser): Promise<void> {
  for (const exercise of DEFAULT_EXERCISES) {
    const { min, max } = repRangeFor(exercise.kind)
    await appendRow(spreadsheetId, 'exercises', [
      crypto.randomUUID(),
      exercise.name,
      exercise.muscle_group,
      exercise.kind,
      String(min),
      String(max),
      '2',
      '3',
    ])
  }

  await appendRow(spreadsheetId, 'profiles', [
    user.id,
    ...Array(TAB_HEADERS.profiles.length - 3).fill(''),
    'false',
    '',
  ])

  await appendRows(
    spreadsheetId,
    'custom_schedule',
    WEEKDAY_ORDER.map((weekday) => [weekday, '']),
  )
}

/**
 * Creates any whole tabs the schema has since gained (e.g. custom_workouts,
 * custom_schedule) on an already-provisioned spreadsheet that predates them
 * — ensureHeaderColumns only patches columns *within* a tab, so a brand-new
 * tab needs to exist first, header row included, before that can run.
 */
async function ensureTabsExist(spreadsheetId: string): Promise<Record<string, number>> {
  const sheetIdByTab = await getSheetIdByTab(spreadsheetId)
  const missingTabs = Object.keys(TAB_HEADERS).filter((tab) => !(tab in sheetIdByTab))
  if (missingTabs.length === 0) return sheetIdByTab

  const newSheetIds = await addTabs(spreadsheetId, missingTabs)
  for (const tab of missingTabs) {
    await appendRow(spreadsheetId, tab, [...TAB_HEADERS[tab as TabName]])
  }
  return { ...sheetIdByTab, ...newSheetIds }
}

/**
 * Patches an already-provisioned spreadsheet's header rows to include any
 * columns the schema has since gained — appended at the end, existing
 * columns/data untouched. Runs every time, cheap no-op when nothing changed.
 * See docs/superpowers/specs/2026-08-02-running-plus-strength-design.md §1.
 */
async function ensureHeaderColumns(spreadsheetId: string): Promise<void> {
  for (const [tab, expectedHeader] of Object.entries(TAB_HEADERS)) {
    const [actualHeader = []] = await getValues(spreadsheetId, `${tab}!1:1`)
    const missing = missingColumns(actualHeader, expectedHeader)
    if (missing.length === 0) continue

    const newHeader = [...actualHeader, ...missing]
    const range = `${tab}!A1:${columnLetter(newHeader.length - 1)}1`
    await updateRow(spreadsheetId, range, newHeader)
  }
}

/**
 * Patches an already-provisioned spreadsheet's `custom_schedule` tab to
 * include a row for every weekday — sheets provisioned before this feature
 * existed have no rows there yet. Existing rows/assignments untouched.
 */
async function ensureCustomScheduleRows(spreadsheetId: string): Promise<void> {
  const [, ...dataRows] = await getValues(spreadsheetId, 'custom_schedule')
  const existingIds = dataRows.map((row) => row[0]).filter((id): id is string => !!id)
  const missing = missingWeekdayRows(existingIds)
  if (missing.length === 0) return

  await appendRows(
    spreadsheetId,
    'custom_schedule',
    missing.map((weekday) => [weekday, '']),
  )
}

/**
 * Resolves this user's spreadsheet — cached ID, then a Drive search by
 * name, then create + seed a new one — and populates the in-memory sheets
 * session so sheetsTable calls can proceed. See
 * docs/superpowers/specs/2026-08-01-sheets-data-layer-phase2-design.md §2.
 */
export async function provisionSpreadsheet(user: GoogleUser): Promise<void> {
  const key = storageKey(user.id)
  const cachedId = localStorage.getItem(key)

  if (cachedId) {
    const sheetIdByTab = await ensureTabsExist(cachedId)
    await ensureHeaderColumns(cachedId)
    await ensureCustomScheduleRows(cachedId)
    setSheetsSession({ spreadsheetId: cachedId, sheetIdByTab })
    return
  }

  const foundId = await findSpreadsheetByName(SPREADSHEET_NAME)
  if (foundId) {
    localStorage.setItem(key, foundId)
    const sheetIdByTab = await ensureTabsExist(foundId)
    await ensureHeaderColumns(foundId)
    await ensureCustomScheduleRows(foundId)
    setSheetsSession({ spreadsheetId: foundId, sheetIdByTab })
    return
  }

  const { spreadsheetId, sheetIdByTab } = await createSpreadsheet(
    SPREADSHEET_NAME,
    Object.keys(TAB_HEADERS),
  )
  for (const [tab, header] of Object.entries(TAB_HEADERS)) {
    await appendRow(spreadsheetId, tab, [...header])
  }
  await seedNewSpreadsheet(spreadsheetId, user)

  localStorage.setItem(key, spreadsheetId)
  setSheetsSession({ spreadsheetId, sheetIdByTab })
}
