# Firebase-integratie — Fase 1: SDK-setup en Google Auth

Status: approved, ready for implementation.

## Context

Deze migratie vervangt Google Sheets (opgebouwd over meerdere fases eerder
deze sessie, zie `2026-07-30-google-signin-phase1-design.md` en de
Sheets-data-layer-specs) volledig door Firebase: Firebase Auth (Google
Sign-In) voor identiteit, Firestore voor dataopslag. Bevestigd met de
gebruiker:

- **Volledige vervanging**, geen parallelle "Sheets blijft ook nog even"-
  periode — zelfde aanpak als destijds Supabase → Sheets.
- **Geen migratie van bestaande Sheets-data.** De huidige spreadsheet-data
  (profiel, workouts, oefeningen, eigen schema) blijft gewoon in de
  spreadsheet van de gebruiker staan, maar de app leest er na deze migratie
  niet meer uit — gebruikers beginnen feitelijk opnieuw op Firestore.
- **Firestore-structuur**: sub-collecties per gebruiker
  (`users/{uid}/<domein>/{id}`), niet platte collecties met een
  `userId`-veld — simpelere security rules, idiomatischer voor Firestore.
- **Gefaseerd**, zelfde ritme als de vorige backend-migratie: elke fase een
  eigen spec, bouwen, testen, committen, dan pas door.

Dit document dekt **alleen Fase 1**: de Firebase SDK opzetten en Google
Sign-In via Firebase Auth, ter vervanging van de huidige Google Identity
Services (GIS)-login. Latere fases (niet in dit document): Fase 2 bouwt de
Firestore CRUD-laag + security rules (nog niet aan pagina's gekoppeld), Fase
3 zet elk domein (profiel, oefeningen, workouts, eigen schema's) daadwerkelijk
over, Fase 4 verwijdert de Sheets/GIS-laag volledig (`sheetsAuth.ts`,
`sheetsClient.ts`, `sheetsTable.ts`, `sheetsStore.ts`, `provisionSpreadsheet.ts`,
alle `sheets/*.ts`-domeinmodules, `googleAuth.ts`, `SheetsAccessGate.tsx`, de
GIS-scripttag in `index.html`).

**Overgangsperiode (expliciet, bevestigd met gebruiker)**: zodra Fase 1 live
staat, kan de rest van de app (dashboard, loggen, schema's) niet meer werken
— die roept nog de Sheets-laag aan, die zonder het oude GIS/OAuth-token niet
meer kan verifiëren zodra `AuthContext` is omgezet naar Firebase. Dit is
tijdelijk en wordt opgelost zodra Fase 3 elk domein daadwerkelijk naar
Firestore overzet — exact hetzelfde patroon als de tussenliggende fases van
de Supabase→Sheets-migratie.

## 1. Firebase SDK & configuratie

- `npm install firebase` (nieuwe dependency).
- Nieuwe env vars, Vite-conventie (`VITE_`-prefix, zoals het bestaande
  `VITE_GOOGLE_CLIENT_ID`), toegevoegd aan `.env.example`:
  `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`,
  `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`,
  `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`. Niet
  hardcoded — de gebruiker zet de echte waarden zelf in Vercel's
  environment variables (bevestigd: gebruiker regelt dit zelf).
- Eén centrale client, `src/lib/firebase/firebaseClient.ts`:
  ```ts
  const app = initializeApp(firebaseConfig)
  export const auth = getAuth(app)
  export const db = getFirestore(app)
  ```
  Geïnitialiseerd precies één keer bij module-load (ES-modules cachen dit
  vanzelf) — geen component initialiseert Firebase zelf opnieuw.

## 2. Auth-flow

- **Inloggen**: `signInWithRedirect(auth, new GoogleAuthProvider())` vanaf
  de login-knop (redirect, niet popup — betere mobiele compatibiliteit,
  zoals gevraagd).
- **Redirect afvangen**: `getRedirectResult(auth)` bij het laden van de app
  (in `AuthContext`'s opstart-effect) om de net-voltooide redirect op te
  pikken en fouten door te geven aan de bestaande `AuthErrorBanner`.
- **Sessie bijhouden**: `onAuthStateChanged(auth, callback)` is de enige
  bron van waarheid voor "wie is ingelogd" — vervangt de huidige
  localStorage-gecachete `GoogleUser` volledig. Firebase Auth bewaart de
  sessie zelf (met `browserLocalPersistence`, expliciet gezet), inclusief
  tokenverversing — dit is de structurele fix voor het eerdere
  "elke-keer-opnieuw-koppelen"-probleem: Firestore heeft geen apart
  OAuth-toegangstoken nodig zoals de Sheets/Drive-API dat had (zie
  `sheetsAuth.ts`), dus die hele "stil ophalen met 5s timeout, anders een
  knop tonen"-machinerie (`sheetsAuth.ts`, `SheetsAccessGate.tsx`,
  `needsSheetsConsent`/`grantSheetsAccess` in `AuthContext`) vervalt volledig
  — Firebase's eigen sessie is voldoende voor zowel identiteit als
  Firestore-toegang (afgedwongen via security rules in Fase 2, niet via een
  apart access-token).
- **Uitloggen**: `signOut(auth)` (Firebase's eigen functie, niet te
  verwarren met de huidige `AuthContext.signOut`, die hernoemd/aangepast
  wordt om ernaar te verwijzen).

### `AuthContext` (herschreven)

Nieuwe, sterk vereenvoudigde vorm:
```ts
type AuthContextValue = {
  user: FirebaseUser | null   // uit firebase/auth
  loading: boolean            // true tot de eerste onAuthStateChanged-call
  authError: string | null
  clearAuthError: () => void
  signOut: () => void
}
```
`sheetsReady`, `needsSheetsConsent`, `grantingSheetsAccess`,
`grantSheetsAccess` verdwijnen (waren specifiek voor de Sheets-OAuth-laag,
die vanaf hier niet meer relevant is voor auth — de Sheets-*data*-calls
zelf blijven nog draaien tot Fase 3, maar zonder geldig token, dus falen ze
tijdens de overgangsperiode, zoals hierboven toegelicht).

### UI-aanpassingen (minimaal, Fase 1)

- `Login.tsx`: de huidige `renderGoogleButton`(GIS)-knop wordt een gewone
  knop die `signInWithRedirect` aanroept.
- `ProtectedRoute.tsx`: ongewijzigd in vorm (nog steeds "geen user →
  redirect naar /login"), leest alleen de nieuwe, kleinere
  `AuthContextValue`.
- `SheetsAccessGate.tsx` wordt uit de route-boom gehaald (niet meer nodig
  zonder de Sheets-OAuth-stap) — het bestand zelf wordt pas in Fase 4
  verwijderd samen met de rest van de Sheets-laag, om deze fase klein te
  houden.
- `index.html`'s GIS-scripttag blijft nog staan tot Fase 4 (niets in Fase 1
  hangt er meer van af, maar opruimen hoort bij de Fase 4-cleanup, niet
  hier).

## 3. Testing

`firebaseClient.ts` is een dunne initialisatie-wrapper — ongetest, zelfde
conventie als `sheetsClient.ts`/`googleAuth.ts`'s browser-API-rakende code.
De auth-flow zelf (redirect/`onAuthStateChanged`) is inherent onzuiver
(browser-gedreven) en blijft ongetest, consistent met hoe `AuthContext.tsx`
altijd al behandeld is in deze codebase. Er is in deze fase geen nieuwe pure
logica die een aparte test rechtvaardigt (in tegenstelling tot
`decodeGoogleIdToken` destijds, dat wél pure JWT-parsing was — Firebase's
SDK doet dat equivalent intern, niet iets wat deze app zelf implementeert).

## 4. Out of scope (expliciet, voor latere fases)

- Firestore lezen/schrijven, collectie-schema's, security rules — Fase 2.
- Elk domein (profiel, oefeningen, workouts, workout_sets, eigen workouts,
  weekplanning) daadwerkelijk overzetten naar de Firestore-CRUD-laag —
  Fase 3.
- Verwijderen van de volledige Sheets/GIS-laag en de GIS-scripttag — Fase 4.
- Migratie van bestaande Sheets-data naar Firestore — expliciet niet
  gevraagd (bevestigd met gebruiker).
