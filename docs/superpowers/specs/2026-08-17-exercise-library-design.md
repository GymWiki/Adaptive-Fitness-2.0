# Doorzoekbare oefeningenbibliotheek, gecategoriseerd per spiergroep

Status: approved, ready for implementation.

## Context

De oefeningenkeuze in de app is nu erg beperkt: elke gebruiker heeft een
persoonlijke `exercises`-tab in zijn eigen Google Sheet, geseed met slechts
14 oefeningen (`DEFAULT_EXERCISES` in `provisionSpreadsheet.ts`) en verder
alleen uit te breiden door er tijdens het loggen handmatig één-voor-één bij
te typen. Dit is de lijst die het handmatige loggen (`ExercisePicker`) en de
net gebouwde custom-schedule-builder gebruiken, via een platte `<select>`
zonder zoekfunctie of categorisatie.

Dit voegt een grote, statische oefeningenbibliotheek toe (niet in de Sheet
— zie §1) en één gedeeld picker-component met zoekbalk + per-spiergroep
categorisatie, gebruikt op beide plekken.

## 1. De bibliotheek — `src/lib/exerciseLibrary.ts`

Een vaste, statische lijst van circa 150 bekende oefeningen:

```ts
export type LibraryExercise = {
  name: string
  muscleGroup: MuscleGroup   // hergebruikt uit programGenerator/types.ts
  kind: ExerciseKind         // 'compound' | 'isolation'
}
export const EXERCISE_LIBRARY: LibraryExercise[] = [ /* ~150 items */ ]
```

Hergebruikt de bestaande `MuscleGroup`-taxonomie (chest/back/shoulders/
biceps/triceps/quads/hamstrings/glutes/calves/core) — dezelfde 10
categorieën die `programGenerator`'s `EXERCISE_CATALOG` al gebruikt voor de
generator, in plaats van een tweede, afwijkende indeling te introduceren.
Nieuwe Nederlandse labels (`MUSCLE_GROUP_LABELS: Record<MuscleGroup, string>`)
worden aan `labels.ts` toegevoegd voor de weergave.

Elke oefening heeft precies één vaste naam — geen apparatuur-varianten
(bevestigd met gebruiker), consistent met hoe de persoonlijke lijst nu al
werkt. `kind` bepaalt de standaard rep-range/RIR wanneer een bibliotheek-item
voor het eerst echt gekozen wordt (zie §3) — dezelfde
`defaultTargetsForKind`-logica die vandaag al bij het aanmaken van een
nieuwe oefening gebruikt wordt.

Puur databestand, geen logica, dus geen eigen tests nodig (consistent met
`EXERCISE_CATALOG`, dat ook ongetest is).

## 2. Merge/filter/groepeer-logica — `src/lib/exercisePicker.ts`

Pure, geteste functie die de picker's kernlogica draagt:

```ts
export type PickerEntry =
  | { source: 'personal'; exercise: Exercise }
  | { source: 'library'; name: string; muscleGroup: MuscleGroup; kind: ExerciseKind }

/** Merges the user's own exercises with the static library, de-duplicating by name (case-insensitive) — a personal record always wins over a library entry with the same name. */
export function mergeExerciseSources(personal: Exercise[], library: LibraryExercise[]): PickerEntry[]

/** Case-insensitive substring match on name. */
export function filterEntries(entries: PickerEntry[], query: string): PickerEntry[]

/** Groups entries by muscle group; a personal exercise whose stored muscle_group doesn't match one of the 10 known groups (freeform/legacy text, or empty) lands in `null` ("Overig"). */
export function groupByMuscleGroup(entries: PickerEntry[]): Map<MuscleGroup | null, PickerEntry[]>
```

Getest: dedupe op naam (hoofdletterongevoelig, personal wint), filtering
(deelstring, hoofdletterongevoelig, lege query = alles), groepering
(inclusief de "Overig"-bucket voor onbekende/lege `muscle_group`-waarden op
bestaande persoonlijke oefeningen zoals de huidige Nederlandse seed-labels
"Borst"/"Armen").

## 3. Component — `ExercisePicker.tsx` (upgrade, geen nieuw component)

Vervangt de huidige platte `<select>` door: een knop "Kies oefening" met de
huidige selectie (of placeholder-tekst) erop, die een opklap-paneel
toont/verbergt. In het paneel:
- Zoekbalk bovenaan, `autoFocus` bij openen.
- Leeg zoekveld → `groupByMuscleGroup`'s resultaat als inklapbare secties
  (spiergroep-naam + aantal), elk met de bijbehorende oefeningen als
  klikbare rijen.
- Getypte tekst → platte, gefilterde lijst (geen secties) via
  `filterEntries`.
- Onderaan altijd zichtbaar: het bestaande "+ Nieuwe oefening toevoegen"
  pad (voor iets dat niet in de bibliotheek staat) — ongewijzigd.

Klikken op een rij: bij `source: 'personal'` direct `onChange`/
`onSelectExercise` met dat record. Bij `source: 'library'` eerst
`findExerciseByName` (bestaat al) — bestaat de naam al persoonlijk (kan
gebeuren als de merge nog niet ververst is), gebruik die; anders
`insertExercise({ name, kind })` (bestaat al, gebruikt automatisch de juiste
default rep-range/RIR voor dat `kind`). Paneel sluit na selectie.

`CustomScheduleBuilder.tsx`'s eigen, losstaande oefening-kies-UI (Select +
los inline-create-blokje, gebouwd vóór dit component bestond in geüpgradede
vorm) wordt vervangen door dit ene gedeelde `ExercisePicker` — één picker om
te onderhouden in plaats van twee.

Geen migratie nodig voor bestaande Sheets-data: de huidige 14 seed-
oefeningen en alles wat een gebruiker al zelf heeft toegevoegd blijven
gewoon staan en verschijnen in de picker (onder "Overig" als hun
`muscle_group`-tekst niet in de 10 standaardcategorieën past).

## 4. Testing

`exercisePicker.ts`'s drie functies zijn puur en volledig getest (zie §2).
`ExercisePicker.tsx` zelf blijft ongetest — consistent met hoe UI-
componenten in deze codebase altijd zijn behandeld. Geen wijzigingen aan
`resolveOrCreateExercise`, `insertExercise`, `findExerciseByName`, het
advies-algoritme, of de Sheets-laag.

## 5. Out of scope (expliciet)

- Geen apparatuur-varianten per bibliotheek-item — elke oefening is één
  vaste naam (bevestigd met gebruiker).
- Geen Sheets-migratie/uitbreiding van `DEFAULT_EXERCISES` — de bibliotheek
  leeft alleen in de app, niet in ieders spreadsheet (bevestigd met
  gebruiker).
- Geen wijzigingen aan de generator-catalogus (`programGenerator`'s
  `EXERCISE_CATALOG`) — dit is een aparte, nieuwe bibliotheek specifiek voor
  de picker-UI's, met dezelfde spiergroep-taxonomie maar een eigen, groter
  bestand.
