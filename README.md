# Fitness Log

Een installeerbare PWA om krachttrainingen te loggen: oefening kiezen, sets
met gewicht x herhalingen invoeren, en je geschiedenis terugzien. Gebouwd met
Vite + React + TypeScript + Tailwind CSS. Bring-your-own-database: er is geen
eigen backend — alle data staat in een Google Sheet in jouw eigen Drive,
alleen toegankelijk via jouw eigen Google-account.

Zie `docs/superpowers/specs/` voor de ontwerp-documenten, met name
`2026-07-31-google-signin-phase1-design.md`,
`2026-08-01-sheets-data-layer-phase2-design.md` en
`2026-08-01-migrate-domains-phase3-design.md` voor de huidige architectuur.

## Lokaal draaien

```bash
npm install
cp .env.example .env   # vul je eigen Google OAuth Client ID in
npm run dev
```

## Google Cloud setup

Nodig, eenmalig, in [Google Cloud Console](https://console.cloud.google.com):

1. Maak een project aan (of gebruik een bestaand project).
2. Schakel de **Google Sheets API** en **Google Drive API** in.
3. Maak een **OAuth 2.0 Client ID** aan (type: Web application).
4. Voeg je origins toe onder **Authorized JavaScript origins** —
   `http://localhost:5173` voor lokale ontwikkeling, en je productie-domein.
5. Zet de Client ID in `VITE_GOOGLE_CLIENT_ID` (lokaal in `.env`, en als
   environment variable in Vercel voor productie). Dit is geen geheim — veilig
   om client-side te gebruiken.

Bij het eerste inloggen maakt de app automatisch een spreadsheet
("Fitness Log — Data") aan in de Drive van de ingelogde gebruiker, met de
benodigde tabbladen en een gezaaide standaard-oefeningenlijst.

## Build

```bash
npm run build
npm run preview
```
