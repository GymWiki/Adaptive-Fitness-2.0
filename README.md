# Fitness Log

Een installeerbare PWA om krachttrainingen te loggen: oefening kiezen, sets
met gewicht x herhalingen invoeren, en je geschiedenis terugzien. Gebouwd met
Vite + React + TypeScript + Tailwind CSS en Supabase (auth + database).

Zie `docs/superpowers/specs/2026-07-29-fitness-logging-webapp-design.md` voor
het ontwerp.

## Lokaal draaien

```bash
npm install
cp .env.example .env   # vul je eigen Supabase project-URL en anon key in
npm run dev
```

## Supabase

Het databaseschema staat in `supabase/migrations/`. Bij een nieuw Supabase
project pas je de migratie toe (via de Supabase CLI of de SQL editor in het
dashboard) om de tabellen (`profiles`, `exercises`, `workouts`,
`workout_sets`) en Row Level Security policies aan te maken.

Zet in het Supabase dashboard onder **Authentication → URL Configuration**
je site-URL (en eventueel `localhost:5173` voor lokale ontwikkeling) in de
lijst met toegestane redirect-URLs, zodat de magic link werkt.

## Build

```bash
npm run build
npm run preview
```
