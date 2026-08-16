# Phase 2 — Google Sheets data layer

Status: approved (proceeding at pace per user request — key architecture
decisions made directly and documented here rather than another
interactive round), ready for implementation.

## Context

Phase 1 replaced Supabase Auth with Google Sign-In. This phase builds the
storage foundation Phase 3 will migrate every page onto: a spreadsheet per
user (in their own Drive, never touching app-controlled storage), a generic
CRUD abstraction over the Sheets API, and provisioning for first-time users.
No page is migrated yet in this phase — `supabase.ts`-backed calls in the 9
data-layer files remain as-is (still broken per Phase 1's accepted
consequence) until Phase 3.

## 1. Authorization: a second, separate OAuth grant

Phase 1's ID token (`google.accounts.id`) proves identity only. Sheets/Drive
access needs a **separate access token** via `google.accounts.oauth2`,
scoped to:

- `https://www.googleapis.com/auth/spreadsheets` — read/write the data
- `https://www.googleapis.com/auth/drive.file` — create the spreadsheet and
  find it again later. Deliberately the narrow `drive.file` scope, not full
  `drive` — it only ever grants access to files this app itself created or
  opened, never the user's whole Drive.

Requested immediately after the identity sign-in succeeds (not deferred),
since — unlike Phase 1's identity/authorization split — essentially every
feature in this app needs Sheets access, so there's nothing meaningful to
defer it for. This is a second consent prompt from Google, chained right
after the sign-in button's callback.

**Token lifetime**: no refresh token in this client-only flow (~1hr
access-token lifetime). `getAccessToken()` (in `sheetsAuth.ts`) returns the
cached token if still valid, otherwise attempts a silent
`requestAccessToken({ prompt: '' })` (succeeds without a popup if consent
was already granted and the browser still has an active Google session),
falling back to an interactive prompt only if silent refresh fails. Token
is kept in memory only (a module-level variable) — not persisted to
localStorage, since it's short-lived and re-obtainable.

## 2. Spreadsheet provisioning & discovery

Fixed, recognizable file name: **"Fitness Log — Data"**. On sign-in:

1. Check `localStorage` for a remembered spreadsheet ID (fast path, works
   for returning on the same browser).
2. If absent, search Drive (`files.list`, `drive.file` scope covers
   app-created files) for a file with that exact name — covers a new
   device/cleared storage without creating a duplicate.
3. If still not found, create one (`spreadsheets.create`) with four sheets
   (tabs) — `profiles`, `exercises`, `workouts`, `workout_sets` — each with
   a header row matching today's Postgres column names, then seed
   `exercises` with the same 14 default rows the current Supabase migration
   seeds, and `profiles` with a single row for this user
   (`onboarding_completed: false`).

Whichever path resolves the ID, it's cached in `localStorage` for next
time.

## 3. Schema mapping

One tab per current table, same column names, header row = row 1:

| Tab | Columns |
|---|---|
| `profiles` | id, display_name, weight_kg, height_cm, gender, birth_year, goal, days_per_week, equipment, experience_level, onboarding_completed |
| `exercises` | id, name, muscle_group, kind, rep_range_min, rep_range_max, target_rir_min, target_rir_max |
| `workouts` | id, name, performed_at, created_at |
| `workout_sets` | id, workout_id, exercise_id, set_order, weight_kg, reps, rir, created_at |

No `user_id` column anywhere — every row's owner is implicit (it's in that
user's own spreadsheet). This also means the `exercises` tab's old
"shared library (user_id null) + own rows" split collapses into just "the
rows in your sheet" — simpler than before.

IDs are client-generated (`crypto.randomUUID()`, already used elsewhere in
this codebase) since Sheets has no server-side default-value mechanism.

## 4. CRUD abstraction (`src/lib/sheets/`)

Sheets API v4 has no `WHERE id = X` — updating or deleting a specific row
requires first knowing its row number. The abstraction hides this:

```ts
// sheetsClient.ts — thin fetch wrapper around the Sheets API v4 REST
// endpoints (values.get / values.append / values.update / batchUpdate),
// using getAccessToken() for auth. Integration-only, not unit-tested.

// rowMapping.ts — pure, tested: header-row ⇄ typed-object marshalling.
export function rowsToObjects<T>(header: string[], rows: string[][]): T[]
export function objectToRow<T>(header: string[], obj: T): string[]

// sheetsTable.ts — the per-tab CRUD surface, built on the two above:
list<T>(tab): Promise<T[]>
find<T>(tab, id): Promise<{ rowNumber: number; record: T } | null>
insert<T>(tab, record): Promise<T>
update<T>(tab, id, patch): Promise<T>
remove(tab, id): Promise<void>
```

`find`/`update`/`remove` read the `id` column, locate the matching row
number client-side, then target that specific row.

## 5. Caching

Every list-heavy page (Dashboard, History, Progress, GuidedWorkout) reads
the same few tabs. A small in-memory store (`sheetsStore.ts`) sits under
`sheetsTable`: `getTab(tab)` returns a cached read (avoiding redundant API
calls across hooks/pages within a session), `invalidateTab(tab)` is called
after any write so the next read refetches. Not persisted across reloads —
this is purely to avoid duplicate in-session network calls, not an offline
cache.

## 6. Relational joins

Postgres's embedded-select joins (e.g. `workouts.select('..., workout_sets(...)')`)
have no Sheets equivalent — every current joined query becomes: read the
relevant tabs in parallel (cached per §5, so cheap after the first read),
join client-side in JS by matching foreign keys. This is Phase 3's concern
per call site, not built here, but the data layer is designed so `list()`
on multiple tabs is the primitive Phase 3 composes.

## 7. Testing

Pure and tested: `rowsToObjects`/`objectToRow` round-tripping (including
missing/extra columns, type coercion for numbers/booleans since Sheets
values are always strings), and the row-locating logic used by
`find`/`update`/`remove`. The actual HTTP calls (`sheetsClient.ts`) and
OAuth token handling (`sheetsAuth.ts`) are integration-only, consistent with
how this codebase already treats Supabase-touching code.

## 8. Out of scope (explicit)

- No page is migrated onto this layer yet — that's Phase 3.
- No offline support/local persistence of data itself, only of the
  spreadsheet ID and (implicitly, briefly) the access token.
- No conflict handling for concurrent edits from two tabs/devices at once —
  last write wins, matching Sheets' own default behavior. Not a regression
  worth engineering around for a single-user-per-sheet app.
