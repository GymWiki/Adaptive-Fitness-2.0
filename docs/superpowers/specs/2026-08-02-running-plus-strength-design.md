# Hardlopen naast kracht — 3-staps doelstelling-onboarding

Status: approved (built at pace per user request), ready for implementation.

## Context

Replaces Deel 0's single "wat is je doel" onboarding step (`Goal`:
hypertrophy/strength/fat_loss/conditioning/mix) with a 3-step flow that
produces a combined weekly schedule spanning **two** modalities — the
existing strength templates, and a new running-plan generator — instead of
strength alone. Confirmed with the user: equipment stays as an added field
in step 3, and periodization only ever computes and renders the **current**
week (phase-aware), not a multi-week calendar UI.

## 1. Data model

New profile fields (Sheets `profiles` tab), replacing `goal`:

| Field | Type | Notes |
|---|---|---|
| `primary_focus` | `'strength' \| 'hybrid' \| 'running' \| 'general_health'` | Step 1 |
| `strength_focus_zone` | `'compound_lifts' \| 'general_hypertrophy' \| 'upper_lower_balance'` \| '' | Step 2, only when `primary_focus === 'strength'` |
| `hybrid_ratio` | `'50_50' \| '60_40' \| '40_60'` \| '' | Step 2, only when `'hybrid'`. Reads as strength:running. |
| `target_race_distance` | `'5k' \| '10k' \| 'half_marathon' \| 'first_10k' \| 'custom'` \| '' | Step 2, only when `'running'` |
| `target_race_distance_custom` | free text \| '' | Only when `target_race_distance === 'custom'` |
| `target_race_date` | ISO date \| '' | Step 2, only when `'running'`; optional even then |
| `available_days` | comma-joined weekday codes, e.g. `mon,wed,fri` | Step 3, 2–6 days |
| `session_duration` | `'30_45' \| '45_60' \| '60_90'` | Step 3 |
| `running_experience_level` | `'beginner' \| 'intermediate' \| 'experienced'` | Step 3 — new, separate axis from strength |
| `experience_level` | unchanged (`beginner \| intermediate \| advanced`) | Step 3 — reused as-is, now specifically "strength experience" |
| `equipment` | unchanged | Step 3, per your confirmation |
| `days_per_week` | **removed** | Superseded by `available_days` (which also carries which specific days, not just a count) |

**Existing-sheet migration safety net**: your spreadsheet was already
provisioned once under the old schema, and provisioning only runs on
first-ever sign-in — it won't retroactively add new columns. Rather than
"delete your sheet and start over" (the precedent used for the whole BYOD
migration, but not appropriate now that this is a live, working setup),
`provisionSpreadsheet` gets a new step that runs even for an
already-resolved spreadsheet: read the actual header row, diff it against
the current `TAB_HEADERS`, and append any missing column names to the end.
Existing columns/data are untouched (nothing is reordered or deleted); pure
diff logic is unit-tested, the actual header-row patch is the usual
integration-only Sheets call.

## 2. Onboarding flow

Step 1 ("Over jou" — name/weight/height/gender/birth year) is unchanged.
Steps 2–5 (goal, days, equipment, experience) are replaced by:

- **Step 2 — Primaire Focus**: the 4-option single-select from the prompt.
- **Step 3 — Specifieke doelen**: conditionally rendered per step 2 (race
  distance + optional date / focus zone / hybrid ratio / skipped entirely
  for general health) — this step is skipped in the stepper entirely (not
  shown as a blank step) when `primary_focus === 'general_health'`.
- **Step 4 — Praktische randvoorwaarden**: available days (multi-select,
  2–6), session duration, running experience, strength experience,
  equipment.

`TOTAL_STEPS` becomes dynamic (4 or 5) depending on whether step 3 applies.

## 3. Running plan module (`src/lib/runningPlanner/`)

### Phase determination — `determineCurrentPhase`

```ts
type TrainingPhase = 'base' | 'build' | 'peak' | 'taper' | 'ongoing'

type PhaseSchedule =
  | { mode: 'race_targeted'; phase: 'base' | 'build' | 'peak' | 'taper'; weekInPhase: number; totalWeeksInPhase: number; weeksUntilRace: number }
  | { mode: 'ongoing' } // no race date — perpetual 80/20 base/build, no taper

function determineCurrentPhase(
  today: Date,          // explicit param, not `new Date()` internally — keeps this testable
  raceDate: Date | null,
  raceDistance: RaceDistance,
  experienceLevel: RunningExperienceLevel,
): PhaseSchedule
```

**Resolving an ambiguity in the source prompt**: Base (~25%) and Build
(~45%) are specified as percentages "of the plan duration," while Peak
(1-2 weeks) and Taper (1 week 5k/10k, 2 weeks half marathon) are fixed
absolute durations — those can't both be percentages of the same total
without a contradiction. Resolution used here: Peak and Taper are
subtracted first as fixed weeks (Peak = 2 weeks when the remaining
race-targeted duration is ≥ 12 weeks, else 1 week); whatever weeks remain
are split Base:Build in a 25:45 ratio (≈ 36:64 of the remainder). Every
phase is floored at a minimum of 1 week. This is a documented judgment
call, not a literal reading of an internally-inconsistent spec — flagged
in code comments, not just here.

No race date → `{ mode: 'ongoing' }`, and `buildRunningPlan` uses a fixed
80/20 easy/hard weekly template with no week-indexing at all, per "gebruik
gewoon doorlopend de Base/Build-verhouding... zonder taper-fase."

### Weekly plan generation — `buildRunningPlan`

```ts
type RunningSession = {
  type: 'easy' | 'tempo' | 'interval' | 'race_pace' | 'run_walk'
  label: string
  distanceKm: number
  description: string
}

type RunningWeekPlan = {
  phase: TrainingPhase
  weekLabel: string           // e.g. "Build — week 3 van 5" or "Doorlopend"
  totalDistanceKm: number
  sessions: RunningSession[]  // one per available running day
  notes: string[]
}

function buildRunningPlan(
  schedule: PhaseSchedule,
  runningDaysCount: number,
  experienceLevel: RunningExperienceLevel,
  raceDistance: RaceDistance | null,
): RunningWeekPlan
```

- **Starting weekly volume** isn't given by the source prompt (no logged
  running history exists yet — that's Garmin-integration territory,
  explicitly out of scope). Documented defaults, clearly labeled as
  assumptions rather than derived facts: beginner 8 km/week, intermediate
  20 km/week, experienced 35 km/week — distributed across
  `runningDaysCount` sessions.
- **Weekly progression** — `weeklyVolumeIncrease(experienceLevel)`: 10% for
  beginner, up to 15–20% short-term for intermediate/experienced, documented
  in code as a practical rule of thumb (per Nielsen et al., Gabbett — see
  sources below), not a strong law. Never both volume and intensity raised
  in the same week — intensity (tempo/interval presence) is fixed per phase,
  only distance ramps week to week within a phase.
- **Beginner + no 5K yet** → every easy session becomes `type: 'run_walk'`
  with a description encoding the run/walk interval split, progressing
  toward continuous running as the plan advances — not literal continuous
  running from week 1.
- **Experience gates session types**: beginners get zero `tempo`/`interval`
  sessions regardless of phase; intermediate/experienced unlock them in
  Build/Peak per the phase's easy/tempo/interval percentage split.

### Sources (running-specific, beyond `wetenschappelijk-bronnenoverzicht.md`)

- Periodization structure: https://pheidi.training/articles/training-periodization/, https://www.correrjuntos.com/blog/en/running-training-periodization
- 10% rule / volume progression: https://www.trainingpeaks.com/blog/a-new-approach-to-the-10-percent-rule/, https://www.pogophysio.com.au/blog/the-10-rule-does-it-hold-true/

## 4. Day allocation — `allocateDaysByFocus`

```ts
type DayAllocation = { strengthDays: number; runningDays: number; restDays: number }

function allocateDaysByFocus(
  primaryFocus: PrimaryFocus,
  availableDaysCount: number,   // 2-6
  hybridRatio?: HybridRatio,    // only meaningful when primaryFocus === 'hybrid'
): DayAllocation
```

Implements the per-focus split from the prompt (strength-majority /
ratio-driven / running-majority-with-periodized-structure /
general-health-mix), always leaving `restDays >= 1` and
`strengthDays + runningDays <= 6` — the existing cross-modality rest
invariant, now enforced once at this layer instead of per-modality.

## 5. Interference spacing — `applyInterferenceSpacing`

```ts
function applyInterferenceSpacing(week: CombinedDaySlot[]): CombinedDaySlot[]
```

Given a candidate week (strength + running days placed), checks for a hard
running session (tempo/interval/race_pace) immediately adjacent to a
lower-body-heavy strength day and, when found, swaps day order (within the
same week, same day counts) to create separation — "minimaal 6-8 uur
ertussen, bij voorkeur een aparte dag" is interpreted here as "not on
adjacent calendar days" for a same-week template (the app doesn't model
time-of-day, only day slots), which is the strongest guarantee this
architecture can express.

## 6. Orchestration — `generateCombinedSchedule`

```ts
function generateCombinedSchedule(
  primaryFocus: PrimaryFocus,
  specifics: FocusSpecifics,      // the step-2 conditional fields, discriminated by primaryFocus
  availableDays: Weekday[],
  sessionDuration: SessionDuration,
  runningExperience: RunningExperienceLevel,
  strengthExperience: ExperienceLevel,
  equipment: Equipment,
  today: Date,
): CombinedWeekProgram
```

1. `allocateDaysByFocus` → day counts.
2. Strength portion: existing `generateProgram(strengthDays, equipment, strengthExperience, strengthGoal)` —
   reused as-is, **not reimplemented**. `strengthGoal` mapping (documented
   here since it's a non-obvious integration rule):
   - `primary_focus === 'strength'` + `strength_focus_zone === 'compound_lifts'` → `'strength'`
   - every other case → `'hypertrophy'`

   Never `'fat_loss'/'conditioning'/'mix'` — those trigger `applyCardio`'s
   automatic cardio-day injection (built for the old single-modality
   system), which would double up with this system's own explicit running
   allocation. `'hypertrophy'`/`'strength'` are the only two goals
   `applyCardio` treats as a no-op, which is exactly what's needed here —
   running occupies the cardio role now.
3. Running portion (when `runningDays > 0`): `determineCurrentPhase` +
   `buildRunningPlan`.
4. Merge into one week, apply `applyInterferenceSpacing`.

## 7. Testing

Pure and tested, per the prompt's own test list: `allocateDaysByFocus` for
every (focus × 2-6 days) combination — correct split, rest-day invariant;
`determineCurrentPhase` — taper lands in the correct week/duration for each
race distance, `ongoing` mode when no race date; `buildRunningPlan` —
beginners never get interval/tempo sessions and do get run-walk, weekly
volume increase never exceeds the experience-level ceiling; hybrid ratio
allocation approximates the chosen split given integer day constraints;
`applyInterferenceSpacing` — hard running never lands adjacent to a
lower-body strength day when an alternative ordering exists. The header-diff
migration-safety function is pure and tested; the actual Sheets header patch
call is integration-only, consistent with the rest of this codebase.

## 8. Out of scope (explicit)

- `upper_lower_balance` (strength focus zone) uses the same `'hypertrophy'`
  parameters as `general_hypertrophy` in this iteration — true
  enforced-equal-volume balancing across arbitrary templates is a
  meaningfully larger feature on its own and is deliberately deferred, not
  silently dropped.
- No running-session **logging** (distance/pace actually run) — this spec
  is the plan/schedule generator only, mirroring what `programGenerator`
  already does for strength. Logging and Garmin import are separate,
  already-acknowledged future work.
- No multi-week calendar UI — confirmed with the user, current-week-only
  per the phase-aware calculation.
- No changes to the existing strength templates, `applyGoal`, or the
  strength adaptive-advice engine themselves — this adds a running branch
  and an orchestration layer on top, per the prompt's own boundary.
