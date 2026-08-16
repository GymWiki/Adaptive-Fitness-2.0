# Phase 3 — migrate every domain onto the Sheets data layer

Status: approved (proceeding at pace per user request), ready for
implementation. Condensed relative to Phases 0-2's specs since this phase
is mechanical application of Phase 2's abstraction, not new architecture —
the interesting decisions are the shared conventions below, applied
per-domain.

## Order (dependency-driven)

1. **Profile/Onboarding** — everything else needs a resolved profile
   (`OnboardingGate` gates the whole `/app` tree on it)
2. **Exercises** (`ExercisePicker`)
3. **Workouts & workout_sets** — logging (`LogWorkout`, `GuidedWorkout` +
   its `resolveExercise`), and reads (`Dashboard`, `History`,
   `useWorkoutCount`)
4. **Aggregation reads** — `useExerciseAdvice`/`fetchExerciseHistory`,
   `useProgressData` (both do the heaviest cross-tab joining)

## Shared conventions

**Numeric/boolean coercion**: Sheets rows are `Record<string,string>`
(Phase 2 §rowMapping is intentionally schema-agnostic). Each domain gets a
small mapper pair, e.g. `profiles/mapping.ts`:

```ts
export function toProfile(row: SheetRow): Profile
export function fromProfile(profile: Partial<Profile>): SheetRow
```

`toProfile` parses `weight_kg`/`height_cm`/`birth_year`/`days_per_week` with
`Number(...)` (empty string → `null`, matching Postgres's nullable
columns), and `onboarding_completed` via `=== 'true'`. `fromProfile` is the
inverse, `String(...)`-ing numbers and `null → ''`.

**Waiting for the sheets session**: every hook that currently does
`if (!user) return` now also needs `if (!user || !sheetsReady) return` —
`useAuth()`'s new `sheetsReady` flag (Phase 2) gates the first real call
until the spreadsheet is resolved, same shape as the existing loading-guard
pattern already used throughout these hooks.

**Joins**: `Promise.all([sheetsTable.list('workouts'), sheetsTable.list('workout_sets'), sheetsTable.list('exercises')])`,
then join client-side by matching foreign keys — cached by Phase 2's
`sheetsStore`, so repeated calls across hooks/pages within a session don't
cost extra API calls.

**IDs**: `crypto.randomUUID()` at the call site for every insert (Sheets
has no server-side default), matching the pattern `GuidedWorkout.tsx`
already partially anticipated.

**`exercises`'s "shared library" concept goes away**: no more `user_id`
column (§Phase 2 schema) — every row in a user's `exercises` tab is simply
theirs. `ExercisePicker` and `resolveExercise.ts`'s own-vs-shared
preference logic (`pickExerciseMatch`) becomes unnecessary; name-matching
still finds an existing row, just without an ownership tier to prefer.

## Out of scope

- `supabase.ts` and the Postgres migrations stay in the repo, unused, until
  Phase 4 removes them — deleting them now would be premature (nothing
  else references them once this phase lands, but that's a cleanup step,
  not a functional dependency).
- No data migration from existing Supabase rows (confirmed greenfield in
  Phase 0's kickoff).
