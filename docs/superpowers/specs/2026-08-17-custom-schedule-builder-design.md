# Eigen schema bouwen — workout-blokken koppelen aan weekdagen

Status: approved, ready for implementation.

## Context

Tot nu toe kan een gebruiker alleen een schema *genereren* (vaste literatuur-
templates via `generateProgram`, of de kracht+hardloop-combinatie via
`generateCombinedSchedule`). Dit voegt een derde, volledig zelf samengestelde
route toe: de gebruiker bouwt herbruikbare workout-blokken uit zijn eigen
oefeningenlijst en koppelt die aan de 7 weekdagen. Net als een gegenereerd
schema moet dit "meebewegen met de voortgang" — d.w.z. dezelfde
dubbele-progressie-advies-engine gebruiken die nu al per oefening draait.

Kernbeslissing die dit mogelijk maakt zonder het advies-algoritme aan te
raken: elke oefening heeft al een eigen opgeslagen rep-range en RIR-doel
(`Exercise.rep_range_min/max`, `target_rir_min/max`), en dat is precies wat
`useExerciseAdvice`/`adviseNextSession` al gebruiken. Een custom workout
verwijst dus alleen naar een oefening-id + sets + rust — de rep-range en RIR
komen altijd live van de oefening zelf, nooit gedupliceerd. Dat garandeert
dat advies en doel nooit uit elkaar kunnen lopen.

## 1. Datamodel

Twee nieuwe Sheets-tabbladen, zelfde patroon als de bestaande domeinen
(`exercises`, `workouts`):

**`custom_workouts`** — één rij per workout-blok:

| Kolom | Type |
|---|---|
| `id` | uuid |
| `name` | tekst, bv. "Push" |
| `exercises_json` | JSON-string van `CustomWorkoutExercise[]` (zie hieronder), geordend |

```ts
type CustomWorkoutExercise = {
  exerciseId: string
  sets: number
  restSeconds: string
  note?: string
}
```

Reps en RIR staan hier bewust niet in — die worden bij het opbouwen van het
weekprogramma altijd live uit de betreffende `Exercise` gelezen.

**`custom_schedule`** — precies 7 vaste rijen, één per weekdag:

| Kolom | Type |
|---|---|
| `id` | `Weekday` (`mon`..`sun`) |
| `workout_id` | uuid van een `custom_workouts`-rij, of `''` voor rustdag |

Eén actief zelfgebouwd schema per gebruiker (geen bibliotheek van meerdere
wisselbare schema's — bevestigd met de gebruiker). Bewerken overschrijft in
place.

**Profiel**: nieuw veld `schedule_source: 'generated' | 'custom' | null`.
`null`/`'generated'` = huidig gedrag ongewijzigd. Wordt gezet door twee
plekken: de nieuwe "Activeer dit schema"-knop op de bouwer-pagina (→
`'custom'`), en het bestaande adopt-flow in `PlanGenerator` (→ `'generated'`,
zodat opnieuw genereren en activeren daar het custom schema weer aflost).

**Migratie op een al-geprovisioneerde sheet**: `ensureHeaderColumns` (bestaat
al) dekt de nieuwe `profiles`-kolom en de kolommen van de twee nieuwe
tabbladen. Voor `custom_schedule` moeten daarnaast de 7 vaste rijen bestaan
op een sheet die al eerder (vóór deze feature) geprovisioned is — nieuwe pure
functie `ensureWeekdayRows` (analoog aan `missingColumns`) bepaalt welke van
de 7 weekdag-ids nog ontbreken; de daadwerkelijke rij-insert is weer
integratie-only, consistent met de rest van de codebase.

## 2. Pure logica — `src/lib/customSchedule/`

```ts
// types.ts
export type CustomWorkoutExercise = { exerciseId: string; sets: number; restSeconds: string; note?: string }
export type CustomWorkout = { id: string; name: string; exercises: CustomWorkoutExercise[] }
export type CustomScheduleAssignment = Record<Weekday, string | null>  // workout id or null = rest

// buildCustomWeekProgram.ts
function buildCustomWeekProgram(
  workouts: CustomWorkout[],
  assignment: CustomScheduleAssignment,
  exercisesById: Map<string, Exercise>,
  today: Date,
): { program: CombinedWeekProgram; todayIndex: number }
```

Bouwt een week `[mon, tue, wed, thu, fri, sat, sun]` (vaste volgorde, altijd
maandag-start) van `CombinedDaySlot`s — hergebruikt het bestaande type
ongewijzigd:
- lege/`null` toewijzing → `{ type: 'rest' }`
- workout toegewezen → `{ type: 'strength', day: { type: 'training', label: workout.name, kind: 'standard', exercises } }`,
  waarbij elke `PlannedExercise` wordt opgebouwd uit de `CustomWorkoutExercise`
  (sets, restSeconds, note) plus de gekoppelde `Exercise`'s eigen
  `rep_range_min/max` (geformatteerd als `"8-12"`) en `target_rir_min/max`
  (geformatteerd als `"RIR 2-3"`, zelfde formattering als elders in de
  codebase).

`strengthProgram` wordt een synthetisch `WeekProgram`-object voor de
weergave: `templateName: 'Mijn schema'`, `source: 'Zelf samengesteld'`,
`disclaimer: null`, `experienceWarning: null`, `notes: []`. De overige
verplichte `WeekProgram`-velden (`daysPerWeek`, `equipment`,
`experienceLevel`, `goal`) worden gevuld met inerte placeholders
(`daysPerWeek` = aantal dagen met een workout, de rest een neutrale default)
— geen van deze velden wordt door de weergave-laag voor een custom schema
gelezen, ze bestaan alleen om aan het gedeelde `WeekProgram`-type te voldoen.
`runningPlan: null` altijd (kracht-only, bevestigd met de gebruiker).

`todayIndex` = index in de week (0=maandag..6=zondag) die overeenkomt met
`today.getDay()`, gebruikt door het dashboard voor de aanbevolen dag.

Kleine pure helpers voor het formatteren van rep-range/RIR-strings (herbruikt
of gespiegeld aan bestaande formattering in `applyGoal.ts`).

Getest: rest-dagen correct, workout-dagen correct opgebouwd inclusief reps/RIR
die van de oefening komen (niet van de workout), `todayIndex`-berekening voor
elke weekdag, een workout die op meerdere dagen staat, een dag die verwijst
naar een inmiddels verwijderde workout (behandeld als rust — zie §4).

## 3. Sheets-laag

- `src/lib/sheets/customWorkouts.ts` — `listCustomWorkouts`,
  `insertCustomWorkout`, `updateCustomWorkout`, `deleteCustomWorkout`
  (JSON-kolom marshalling, zelfde stijl als andere domeinmodules).
- `src/lib/sheets/customSchedule.ts` — `getCustomScheduleAssignment` (leest
  alle 7 rijen naar `CustomScheduleAssignment`), `setCustomScheduleDay`
  (update één weekdag-rij).

## 4. UI

**Nieuwe pagina** `src/pages/CustomScheduleBuilder.tsx`, route
`/app/eigen-schema`, gelinkt vanaf het Dashboard.

*Sectie "Workouts"*: lijst van opgeslagen workout-blokken (naam +
oefeningenaantal). "+ Nieuwe workout": naam, en oefeningen toevoegen via een
zoek/select uit de eigen oefeningenlijst — of een nieuwe naam typen om
meteen een nieuwe oefening aan te maken (zelfde inline-create-patroon als nu
al in de guided workout zit, via `resolveOrCreateExercise`/`insertExercise`).
Per oefening-rij: sets (getal), rust (seconden), optionele notitie, en de
rep-range/RIR van de oefening read-only erbij getoond. Omhoog/omlaag-knoppen
om te herordenen, verwijderknop. Workout verwijderen: als hij nog aan een
dag gekoppeld is, valt die dag terug op "Rust" (geen orphan-referentie in de
weekplanning — afgehandeld in de sheets-laag bij het verwijderen).

*Sectie "Weekplanning"*: 7 rijen (Ma t/m Zo), elk een `Select` met "Rust" of
een van de opgeslagen workouts.

*Activeren*: knop "Activeer dit schema", disabled zolang er geen enkele dag
een workout heeft (alleen rust is niet activeerbaar) — zelfde
bevestigingsstap-patroon als `PlanGenerator`'s adopt-flow. Zet
`profile.schedule_source = 'custom'`.

**Dashboard-integratie**: `useActiveProgram` breidt uit met een branch —
als `profile.schedule_source === 'custom'`, haalt het de custom workouts +
weekplanning op en bouwt het programma via `buildCustomWeekProgram` in
plaats van `generateCombinedSchedule` aan te roepen. Retourneert daarnaast
`isCustom: boolean` en (bij custom) `todayIndex`.

`ActiveProgramPanel` gebruikt bij een custom schema `todayIndex` als
`recommendedIndex` in plaats van `computeCycleState`'s telling-gebaseerde
aanbeveling. Bevestigd met de gebruiker: geen "al gedaan deze week"-vinkjes
voor custom schema's in deze iteratie — `doneInCycle` blijft overal `false`;
voltooide workouts blijven zichtbaar via de bestaande geschiedenispagina.

Dagkoppen tonen bij een custom schema de echte weekdagnaam (Maandag,
Dinsdag, ...) in plaats van "Dag N" — kleine optionele `dayLabels?: string[]`
prop door `CombinedWeekList`/`DaySlider` heen, alleen gebruikt in de custom-
modus. Gegenereerde schema's blijven "Dag N" tonen (hun volgorde is niet aan
een echte kalenderdag gekoppeld).

Loggen zelf verandert niet: `DayDetail` navigeert voor een `strength`-slot
zoals nu al naar `GuidedWorkout` met de opgebouwde `PlannedExercise[]` — die
pagina resolvet oefeningen op naam (idempotent, want de oefening bestaat al)
en logt sets zoals altijd. Geen wijzigingen aan `GuidedWorkout`, de reducer,
of het advies-algoritme.

## 5. Testing

Pure en getest, zelfde conventie als de rest van de codebase:
`buildCustomWeekProgram` (weekopbouw, rest-dagen, reps/RIR-afkomst,
`todayIndex` voor elke weekdag, workout op meerdere dagen, verwijderde-
workout-referentie), de rep-range/RIR-formatteer-helpers, `ensureWeekdayRows`
(pure diff-logica, net als `missingColumns`). De sheets-laag
(`customWorkouts.ts`, `customSchedule.ts`) is integratie-only, ongetest,
consistent met de rest van de codebase.

## 6. Out of scope (expliciet)

- Geen hardloop-dagen in de bouwer — kracht-only (bevestigd met gebruiker;
  hardloop-periodisering blijft altijd algoritmisch via de bestaande
  onboarding-route).
- Geen bibliotheek van meerdere zelfgebouwde schema's — één actief schema,
  in place bewerkt (bevestigd met gebruiker).
- Geen drag-and-drop; herordenen van oefeningen binnen een workout via
  omhoog/omlaag-knoppen.
- Geen "al gedaan deze week"-vinkjes voor custom schema's — alleen de
  huidige kalenderdag wordt gemarkeerd als aanbevolen (bevestigd met
  gebruiker).
- Geen wijzigingen aan `generateProgram`, `generateCombinedSchedule`, het
  advies-algoritme (`adaptiveAdvice`), of de guided-workout flow — dit voegt
  alleen een nieuwe invoerbron voor het weekprogramma toe.
