# Deel 0 — Doelstelling toevoegen aan onboarding

Status: approved, ready for implementation planning.

## Context

Vandaag bepaalt alleen `daysPerWeek` welk vast, literatuur-onderbouwd template
(`TEMPLATES[daysPerWeek]` in `src/lib/programGenerator/templates.ts`) wordt
gebruikt. Dit voorstel voegt **doel** toe als tweede, onafhankelijke
onboarding-keuze: afvallen / spiermassa (hypertrofie) / kracht / conditie /
mix. Dit is de fundering voor de latere readiness-indicator (deel A),
adaptatieplanner (deel B) en oefening-demonstraties (deel C) — die bouwen op
het profiel/de generator-output die hier wordt uitgebreid — maar dit spec-
document beschrijft uitsluitend deel 0.

**Architectuurprincipe**: frequentie bepaalt de **splitstructuur** (welke
dagen, welke oefeningen-groepering — `templates.ts` blijft ongewijzigd). Doel
bepaalt de **parameters binnen** die structuur (reps, RIR, rust, volume,
cardio) via een nieuwe overlay-laag in `generateProgram`.

## 1. Data model

```ts
// src/lib/programGenerator/types.ts
export type Goal = 'hypertrophy' | 'strength' | 'fat_loss' | 'conditioning' | 'mix'
```

Dutch labels, zelfde patroon als `EQUIPMENT_LABELS`/`EXPERIENCE_LABELS`:

```ts
// src/lib/labels.ts
export const GOAL_LABELS: Record<Goal, string> = {
  hypertrophy: 'Spiermassa (hypertrofie)',
  strength: 'Kracht',
  fat_loss: 'Afvallen',
  conditioning: 'Conditie',
  mix: 'Mix',
}
```

Migration `supabase/migrations/20260729040000_goal.sql`:

```sql
alter table public.profiles
  add column goal text check (goal in ('hypertrophy', 'strength', 'fat_loss', 'conditioning', 'mix'));
```

`Profile` type (`src/lib/types.ts`) and `PROFILE_COLUMNS`
(`src/hooks/useProfile.ts`) gain `goal: Goal | null`.

## 2. Parameter overlay

`templates.ts` is **not modified** — it stays the single source of truth for
which patterns/sets/baseline-reps appear per frequency, and its baseline
values are literally what `hypertrophy` and `fat_loss` render as (see below).
A new pure module, `src/lib/programGenerator/applyGoal.ts`, transforms
`PlannedExercise`s after equipment substitution, before the `WeekProgram` is
returned.

### 2.1 Exemption for named methodologies

Two `ProgramTemplate` entries get a new flag:

```ts
// templates.ts
1: { ..., goalOverrideExempt: true, ... }   // HIT — "tot spierfalen" IS the method
3: { ..., goalOverrideExempt: true, ... }   // StrongLifts 5×5 — 5 reps IS the method
```

For these two, `applyGoal` only runs the cardio step (§3), never the
reps/RIR/rest/set step below.

### 2.2 Per-goal exercise transform

Runs per `PlannedExercise`, using the movement pattern's `kind`
(`compound`/`isolation`, already on `MovementPattern` in `catalog.ts`):

| Doel | Compound (hoofdlifts) | Isolation/accessoire | Sets |
|---|---|---|---|
| `hypertrophy` | ongewijzigd (template-baseline) | ongewijzigd | ongewijzigd |
| `fat_loss` | ongewijzigd — "reps zoals hypertrofie" behoudt kracht tijdens tekort | ongewijzigd | ongewijzigd |
| `strength` | reps → `3-6`, RIR → `1-2`, rust → `150-180`s | ongewijzigd | ongewijzigd |
| `conditioning` | ongewijzigd | ongewijzigd | **−1** (min. 2) |
| `mix` | ongewijzigd | ongewijzigd | ongewijzigd |

Bronnen: kracht-repranges/RIR/rust — ACSM (2009) position stand, al
geciteerd in `wetenschappelijk-bronnenoverzicht.md`; conditioning-
volumereductie ten faveure van cardio — Oliveira, Boppre & Fonseca (2024),
polarized-training sectie van hetzelfde bronnenoverzicht.

`PlannedExercise` gains a per-exercise `rir: string` field (e.g. `"RIR
2-3"`), replacing today's single day-level `KIND_RIR_LABEL` badge in
`DayDetail.tsx` — necessary because compound and isolation exercises on the
same day can now carry different RIR targets (e.g. a `strength`-goal day has
`RIR 1-2` on the squat and `RIR 2-3` on the accessory curl).

## 3. Cardio

New **output-only** day shape — does not exist in `TemplateDay`/`templates.ts`,
only computed onto `DaySlot`:

```ts
// types.ts — DaySlot union gains:
| { type: 'cardio'; label: string; description: string; durationMinutes: string }

// the 'training' variant of DaySlot gains an optional:
cardioAddOn?: { description: string; durationMinutes: string }
```

Only `fat_loss`, `conditioning`, and `mix` produce actual cardio slots.
`hypertrophy`/`strength` instead get one extra line appended to the existing
`GLOBAL_NOTES` array: *"Kleine cardio-basis voor algemene gezondheid (bv. 15
min, 1x/week) — geen dominant onderdeel van dit schema."*

Weekly session target by goal:

| Doel | Sessies/week | Duur | Toon |
|---|---|---|---|
| `fat_loss` | 2 | 25 min | matige intensiteit (zone 2), extra calorieverbruik tijdens tekort |
| `conditioning` | 3 | 25 min | polarized 80/20 — overwegend zone 2, af en toe kort intensief interval |
| `mix` | 1 | 20 min | gebalanceerde toevoeging naast krachttraining |

Bron: Oliveira, Boppre & Fonseca (2024), polarized-training sectie.

### Placement algorithm (pure, deterministic — `applyCardio(week, goal)`)

1. The 7-day template's `active_recovery` slot already fulfills this role
   (its description already recommends light zone-2 cardio) — `applyCardio`
   is a no-op whenever the week already contains an `active_recovery` slot.
2. Otherwise, count `rest` slot indices. Reserve at least one — at most
   `restSlots.length - 1` may convert to a `cardio` day (earliest indices
   first), up to the goal's session target.
3. Any sessions still owed after step 2 (e.g. the 6-day PPL×2 template has
   only one rest day, which must stay reserved) become `cardioAddOn`s on
   that many `training` days instead (earliest indices first), with a
   shorter duration (10-15 min) and a note: *"Kon niet als aparte dag
   ingepland worden zonder je enige rustdag te laten vervallen — daarom hier
   aangehangen."*

This mechanically guarantees the existing "≤6 actieve dagen, ≥1 rustdag"
invariant — no separate check is needed, it falls out of never converting
the last reserved rest slot.

## 4. Generator integration

```ts
// generateProgram.ts
export function generateProgram(
  daysPerWeek: number,
  equipment: Equipment,
  experienceLevel: ExperienceLevel,
  goal: Goal,
): WeekProgram
```

`WeekProgram` gains `goal: Goal`. Internally: resolve exercises as today →
run §2's transform (skipped if `goalOverrideExempt`) → run §3's
`applyCardio` → return.

`cycleProgress.ts`'s `computeCycleState` treats `cardio` exactly like
`active_recovery` (already only special-cases `type === 'training'` for the
cycle count, everything else passes through unchanged as "not done, not
counted") — no logic change needed there, just the type union growing.

## 5. UI

- **Onboarding** (`src/pages/Onboarding.tsx`): new step, placed **first**
  (before dagen/apparatuur/ervaring — "doel" is the why, the rest is the
  how). `TOTAL_STEPS` → 5. Same `OptionButton` list pattern as the
  equipment/experience steps, using `GOAL_LABELS`. `FormState` gains `goal:
  Goal`, default `'hypertrophy'`. `handleFinish` writes `goal` alongside the
  existing fields.
- **PlanGenerator** (`src/pages/PlanGenerator.tsx`): goal becomes a 4th
  `<Select>` alongside dagen/apparatuur/ervaring. `GeneratedParams` and
  `isActiveSchema` include `goal`; the adopt flow writes it exactly like the
  other three fields do today.
- **DayDetail.tsx**: new render branch for `type === 'cardio'` (same visual
  treatment as `active_recovery`, distinct icon); renders `cardioAddOn` as a
  small note block under a training day's exercise list when present; the
  day-level `KIND_RIR_LABEL` badge is removed in favor of per-exercise RIR
  next to each exercise's sets/reps line.
- **DaySlider.tsx**: `dayIcon`/`dayLabel` get a `cardio` case (a simple heart
  or pulse icon, label "Cardio").
- **useActiveProgram.ts**: passes `profile.goal` through to `generateProgram`
  (falls back to `'hypertrophy'` if a pre-existing profile somehow has no
  goal saved yet, e.g. an account created before this migration).

## 6. Testing

Pure functions, all in `src/lib/programGenerator/`:

- `applyGoal.test.ts`: for every `daysPerWeek` (1-7) × every `Goal` (5):
  split structure (day count, order, `kind`, which patterns appear) is
  identical across goals within a frequency; reps/RIR/rest/sets differ
  exactly per the §2.2 table; `daysPerWeek` 1 and 3 never change reps/RIR
  regardless of goal.
- `applyCardio.test.ts`: for every frequency × `{fat_loss, conditioning,
  mix}`: correct total session count, correct dedicated-day-vs-add-on split
  when rest days are scarce, at least one `rest` slot always remains, no
  change at all to the 7-day template. `{hypertrophy, strength}` never
  produce a `cardio` slot or `cardioAddOn`.
- `generateProgram.test.ts` (existing file, extended): every call site gets
  an explicit `goal` argument; existing assertions keep using
  `'hypertrophy'` so they continue to describe the template baseline
  unchanged.

## 7. Out of scope (explicit)

- The `exercises` table's own `rep_range_min/max`/`target_rir_min/max`
  columns (used by `adviseNextSession`/`ExerciseAdvice`) are a separate,
  pre-existing concept and are **not** reconciled with goal-driven template
  parameters in this change.
- No change to which movement patterns/exercises appear per frequency —
  `templates.ts`'s structural content is untouched.
- Deel A (readiness), B (adaptatieplanner), C (oefening-demonstraties) are
  separate specs, built after this one lands.
