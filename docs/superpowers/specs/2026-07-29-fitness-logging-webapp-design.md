# Fitness Logging Webapp — Design

## Doel

Eén website die dienst doet als landingspagina én als installeerbare PWA voor
het loggen van krachttrainingen. Gebruikers loggen in met een magic link,
data wordt opgeslagen in Supabase. In een latere fase komt er een
trainingsschema-feature op basis van wetenschappelijk onderzoek — het
datamodel houdt daar nu al lichtjes rekening mee, zonder het te bouwen.

## Architectuur

- **Frontend**: Vite + React + TypeScript + Tailwind CSS, gedeployed op Vercel.
- **Backend**: Supabase (Postgres database + Auth + Row Level Security, zodat
  gebruikers alleen hun eigen data zien).
- **PWA**: `vite-plugin-pwa` genereert manifest + service worker →
  installeerbaar op telefoon/desktop, met offline caching van de app-shell
  (niet van live data — dat vereist login/netwerk).

## Datamodel (Supabase/Postgres)

- `profiles` — 1-op-1 met Supabase auth user (naam, aangemaakt op).
- `exercises` — bibliotheek van oefeningen (naam, spiergroep). Voorgevuld met
  een basisset (bench press, squat, deadlift, overhead press, rows, etc.),
  gebruikers kunnen zelf oefeningen toevoegen.
- `workouts` — een trainingssessie (gebruiker, datum, optionele naam).
- `workout_sets` — regels binnen een workout (workout_id, exercise_id,
  gewicht, herhalingen, volgorde).
- Later (niet nu gebouwd): `programs` / `program_exercises` voor
  wetenschappelijk onderbouwde schema's. De huidige tabellen zijn hier
  compatibel mee; geen aanpassingen vooraf nodig.

Alle tabellen met een `user_id` kolom krijgen Row Level Security policies die
lezen/schrijven beperken tot de eigenaar.

## Pagina's/schermen

1. **Landingspagina** — uitleg over de app + "Installeer als app"
   instructies/knop (`beforeinstallprompt` waar ondersteund, anders
   handmatige uitleg voor iOS/Android).
2. **Login** — email invullen → magic link (Supabase Auth).
3. **Dashboard** — overzicht recente workouts.
4. **Nieuwe workout loggen** — oefening kiezen (of toevoegen), sets met
   gewicht x herhalingen invoeren.
5. **Workout geschiedenis/detail** — eerdere workouts inzien.

## Auth & foutafhandeling

- Supabase Auth met magic link; sessie in localStorage, auto-refresh.
- Mislukte login/opslag acties tonen een duidelijke melding aan de
  gebruiker; geen silent failures.

## Testen

- Handmatig doorlopen van de golden path (registreren → workout loggen →
  geschiedenis bekijken) in de browser na bouwen, inclusief PWA-installatie
  testen.

## Scope v1 (expliciet buiten scope)

- Trainingsschema's/programma's op basis van wetenschappelijk onderzoek
  (volgende fase).
- Cardio-logging, lichaamsgewicht tracken, RPE/notities.
- Sociale features, delen, coaching.
