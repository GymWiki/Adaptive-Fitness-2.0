# Guided workout logging ("Start training" flow)

Status: approved, ready for implementation planning.

## Context

Today, `DayDetail`'s "Start training" button navigates to `/app/log` with
only the day's label in router state — the user still has to search/select
every exercise from scratch via `ExercisePicker`, has no rest guidance, and
saves the whole workout in one bulk insert at the end. This spec adds a
guided, set-by-set flow that starts pre-populated from the active program's
scheduled day, shows a per-exercise weight advice, and inserts a rest timer
between sets.

**Scope**: only the "Start training" entry point (a scheduled day from the
active program) gets this flow, via a new page at `/app/log/guided`. The
existing free-form "+ Nieuwe workout" entry (`/app/log`, `LogWorkout.tsx`) is
untouched — it stays the manual, search-your-own-exercises flow it is today.

## 1. Linking template exercises to the user's exercise list

`generateProgram`'s `PlannedExercise` carries a resolved display name (e.g.
"Barbell Bench Press") and a `patternId`, but nothing that maps to a row in
`public.exercises` — the table `workout_sets.exercise_id` references. The
seeded shared library uses different, plainer names ("Bench press"), so
there is no existing link. **No schema migration is needed** — resolution
happens at guided-session start:

```ts
// src/lib/guidedWorkout/resolveExercise.ts
function pickExerciseMatch(candidates: Exercise[], userId: string): Exercise | null
// candidates = exercises visible to the user (own + shared, from ExercisePicker's
// existing query) filtered to an exact case-insensitive name match.
// Prefers a user-owned row over a shared row; null if no match at all.
```

Pure and unit-tested. The Supabase-touching wrapper around it:

```ts
async function resolveOrCreateExercise(
  userId: string,
  plannedExercise: PlannedExercise,
  kind: ExerciseKind,       // looked up from EXERCISE_CATALOG by patternId, client-side
): Promise<Exercise>
```

fetches candidates, calls `pickExerciseMatch`, and inserts a new row when
there's no match — `kind` from the catalog pattern, rep-range/RIR defaults
matching the existing seeded-library convention:

```ts
// src/lib/guidedWorkout/defaultTargetsForKind.ts (pure, tested)
compound:  { rep_range_min: 6,  rep_range_max: 10, target_rir_min: 2, target_rir_max: 3 }
isolation: { rep_range_min: 10, rep_range_max: 15, target_rir_min: 2, target_rir_max: 3 }
```

This resolution runs once for every planned exercise when the guided page
mounts (a brief "Workout voorbereiden…" loading state), before any set can
be logged.

**Accepted trade-off**: if the user's equipment tier changes later, the plan
resolves to a different name (e.g. "Dumbbell Bench Press"), which won't
match the old row — a *new* exercise entry is created with its own fresh
history. Treated as correct (different lift, different load), not a bug,
but called out here since it resets that slot's trend/PR history.

## 2. Data flow / persistence

No new tables or columns. `workouts` and `workout_sets` are used exactly as
today, just written incrementally instead of in one batch at the end:

- The `workouts` row is created **lazily**, on the very first set the user
  confirms — not eagerly at page load — so quitting before logging anything
  leaves no trace (no empty workout in history).
- Each "Set klaar" tap does one `workout_sets` insert immediately (creating
  the workout row first if it doesn't exist yet), using the resolved
  exercise's `id`, `set_order` (per-exercise, matching existing convention),
  `weight_kg`, `reps`, `rir`.
- Editing a previously-logged set (tapping it in the checked-off list) does
  an `update` against that row's id instead of a new insert.
- There is no separate "finish and save" step — the finish screen is purely
  a navigation action (back to `/app` or `/app/history`), since everything
  is already persisted.

## 3. Rest timer

`restSeconds` on a `PlannedExercise` is a string, always numeric-only
(confirmed by scanning every entry in `templates.ts`) — either a range
("150-180") or a single value ("90").

```ts
// src/lib/guidedWorkout/parseRestSeconds.ts (pure, tested)
function parseRestSeconds(restSeconds: string): number
// "150-180" → 150 (lower bound); "90" → 90.
```

The countdown always starts from this lower-bound value, per your answer.
Always-visible skip control; hitting 0 or skipping both fire the same
transition. **No rest step after the last set of the last exercise** — the
workout is over, resting serves no purpose there.

## 4. Guided flow state machine

A small, pure, tested reducer (`guidedWorkoutReducer`) drives the page —
chosen over scattered `useState` because of the number of distinct
transitions: completing a set, resting, skipping rest, moving to the next
exercise, adding an extra set beyond the plan, editing a past set, and
finishing.

Reducer state (shape, not final field names):

```ts
type GuidedState = {
  exercises: Array<{
    resolved: Exercise            // the DB row from step 1
    planned: PlannedExercise      // sets/reps/rir/restSeconds/note from the template
    targetSets: number            // starts at planned.sets, can grow via "extra set"
    loggedSets: Array<{ weight: number; reps: number; rir: number; setRowId: string }>
  }>
  exerciseIndex: number
  phase: 'active' | 'resting' | 'done'
  editing: { exerciseIndex: number; setIndex: number } | null
}
```

Transitions covered by tests:
- Completing a non-final set → `phase: 'resting'`.
- Rest ends (timeout or skip) → `phase: 'active'`, advances to the next set
  slot (or next exercise, if the current one's `targetSets` is reached).
- Completing the very last set of the very last exercise → `phase: 'done'`
  directly, skipping `'resting'`.
- "+ Extra set" → `targetSets += 1` for the current exercise, no phase
  change.
- Entering/exiting edit mode for a past set doesn't touch `exerciseIndex`/
  `phase` — it's an orthogonal `editing` pointer, so editing a set from
  earlier in the exercise doesn't disturb the current set in progress.

## 5. UI per step

- **Preparing**: spinner + "Workout voorbereiden…" while step 1's resolution
  runs for every planned exercise; `ErrorState` + retry on failure.
- **Active (a set to fill in)**: exercise name, its `note` if present (same
  faint-text treatment as `PlanGenerator`/`DayDetail`), target reps/RIR as
  guidance text, the advice banner (see below), three inputs (gewicht,
  herhalingen, RIR — same `0/1/2/3/4+` select already used in
  `LogWorkout.tsx`), weight prefilled from the advice when available, a
  compact checked-off list of this exercise's already-logged sets above the
  input (tap to edit), "Set klaar" button.
- **Resting**: countdown replaces the input area, always-visible skip.
- **Done**: simple summary (exercise/set counts logged) + a button back to
  `/app`.

**Advice reuse**: `ExerciseAdvice.tsx`'s fetch-and-compute effect is
extracted into `useExerciseAdvice(exercise)` (same `fetchExerciseHistory` +
`adviseNextSession` call it already makes), so `ExerciseAdvice` keeps
rendering the same banner unchanged, and the guided page reuses the same
hook to prefill the weight input — avoiding two independent fetches for the
same data.

## 6. Routing

New route `/app/log/guided`, under the same `ProtectedRoute` →
`OnboardingGate` → `AppLayout` nesting as the other `/app/*` routes.
`DayDetail.tsx`'s "Start training" button now navigates there, passing the
day's `label` and `exercises` (`PlannedExercise[]`) in router state instead
of just the label.

## 7. Testing

Pure, unit-tested: `parseRestSeconds`, `pickExerciseMatch`,
`defaultTargetsForKind`, and the full `guidedWorkoutReducer` transition
table above. Supabase-touching wrappers (`resolveOrCreateExercise`, set
insert/update) are thin pass-throughs, verified manually in-browser rather
than unit-tested, consistent with how the rest of the app's Supabase calls
are handled.

## 8. Out of scope (explicit)

- Cardio add-ons on a training day are not shown or logged in this flow.
- Skipping an entire exercise mid-workout is not supported in v1.
- The manual `/app/log` flow (`LogWorkout.tsx`) is unchanged.
- No changes to `History.tsx` display of partially-logged workouts — an
  abandoned guided session simply shows up with however many sets got
  logged, exactly like any other workout does today.
