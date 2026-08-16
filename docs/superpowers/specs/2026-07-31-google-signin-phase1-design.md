# Phase 1 — Google Sign-In replaces Supabase Auth

Status: approved, ready for implementation.

## Context

This is Phase 1 of a "bring your own database" migration: Google Sheets
will fully replace Supabase (auth + Postgres) as the app's backend. Phases:

1. **Google Sign-In replaces Supabase Auth** (this spec)
2. Sheets data layer — schema/tab design, generic CRUD abstraction, per-user
   spreadsheet provisioning
3. Migrate each domain (profile/onboarding, exercises, workouts &
   workout_sets, adaptive advice/progress) onto that layer
4. Remove Supabase entirely

**Accepted, deliberate consequence of this phase**: once Google Sign-In
replaces Supabase Auth, Supabase's RLS policies (all keyed on `auth.uid()`)
stop resolving anything, since no Supabase session exists anymore. Every
Supabase-backed data feature (logging, history, progress, etc.) goes
non-functional until Phases 2–3 land. This is intentional — confirmed with
the user as acceptable, since the RLS layer is being deleted in Phase 4
regardless, so keeping it alive through a hybrid transition would be pure
throwaway work.

## 1. Library & flow

Google Identity Services (GIS), loaded via
`<script src="https://accounts.google.com/gsi/client" async defer>` in
`index.html`. A small hand-rolled wrapper (`src/lib/googleAuth.ts`) rather
than the `@react-oauth/google` package — the needed surface (`initialize`,
`renderButton`, `disableAutoSelect`) is small, matching this app's existing
preference for no extra dependencies where a thin wrapper suffices (e.g.
hand-built SVG charts instead of a charting library).

This phase uses only the **ID-token flow** (`google.accounts.id`) —
identity, not authorization. The separate **OAuth token flow**
(`google.accounts.oauth2`) that grants actual Sheets/Drive access is Phase
2's concern, requested only once there's a feature that needs it
(incremental authorization, not asked for upfront).

## 2. Trust model

This app has no backend — a static SPA talking directly to third-party
APIs. Supabase's auth was server-verified (their server signs and checks
JWTs; Postgres RLS enforces access server-side). Google's ID token is a
signed JWT too, but without a backend, the app can only decode it, not
verify its signature. This is an accepted limitation, not a regression that
matters in practice: once Phase 2 lands, real enforcement comes from
Google's own Sheets/Drive API rejecting any access token that wasn't
legitimately granted OAuth consent for that specific file — the identity
token here is "who to greet," not the security boundary.

## 3. Session persistence

Decoded identity (`sub`, `email`, `name`, `picture`) is stored in
`localStorage` after sign-in, read back synchronously on load (no network
round-trip needed, unlike Supabase's `getSession()` — `loading` resolves
faster than today). `signOut()` clears it and calls
`google.accounts.id.disableAutoSelect()` so the user isn't immediately
silently re-signed-in.

## 4. `googleAuth.ts`

```ts
export type GoogleUser = { id: string; email: string; name: string | null; picture: string | null }

// Pure, tested — decodes a GIS credential JWT's payload (no signature
// verification, see §2). Returns null instead of throwing on malformed input.
export function decodeGoogleIdToken(credential: string): GoogleUser | null

// Thin GIS wrappers (integration-only, not unit tested):
export function initGoogleSignIn(onCredential: (user: GoogleUser) => void): void
export function renderGoogleButton(container: HTMLElement): void
export function disableAutoSelect(): void
```

## 5. `AuthContext` surface

```ts
type AuthContextValue = {
  user: GoogleUser | null
  loading: boolean
  authError: string | null
  clearAuthError: () => void
  signInWithGoogle: () => void
  signOut: () => void
}
```

`session` is dropped. Every consumer outside `AuthContext` was audited by
grep:

- `ProtectedRoute.tsx`, `Landing.tsx`, `Login.tsx` reference `session` as a
  truthy check only → direct swap to `user !== null`.
- 9 data-layer files (`useProfile`, `useWorkoutCount`, `useProgressData`,
  `useExerciseAdvice`, `ExercisePicker`, `Onboarding`, `PlanGenerator`,
  `LogWorkout`, `GuidedWorkout`) read only `user.id` as a plain string —
  none read `.email`/`.user_metadata`/anything Supabase-`User`-specific.
  **These files are untouched in this phase** — they keep compiling as-is
  and fail at runtime per the accepted consequence above.

## 6. File footprint

- `src/contexts/AuthContext.tsx` — rewritten
- `src/lib/googleAuth.ts` — new
- `src/lib/googleAuth.test.ts` — new (decodeGoogleIdToken only)
- `src/components/ProtectedRoute.tsx`, `src/pages/Landing.tsx` — `session` → `user`
- `src/pages/Login.tsx` — rewritten: renders the Google button instead of the email form
- `src/components/AuthErrorBanner.tsx` — copy only (was magic-link-specific: "vraag een nieuwe inloglink aan")
- `src/pages/Landing.tsx` copy — currently claims "geen account bij een derde partij" (no third-party account); inaccurate once Google Sign-In is required, needs rewording
- `index.html` — GIS script tag
- `.env.example` — add `VITE_GOOGLE_CLIENT_ID`

Nothing else changes in this phase — not `NavBar.tsx`, not any of the 9
data-layer files, not `supabase.ts` itself (still present, still imported
by those files, just no longer authenticated).

## 7. Testing

`decodeGoogleIdToken`: valid token → correct fields; malformed/garbage
input → `null`, never throws. Everything else (GIS script loading, button
rendering, localStorage) is integration-only, consistent with how this
codebase already treats Supabase-touching code — verified manually rather
than unit-tested.

## 8. Out of scope (explicit)

- No Sheets/Drive OAuth scopes requested in this phase.
- No changes to any of the 9 data-layer files.
- No migration of existing Supabase data (confirmed: greenfield, no
  migration tooling needed).
- Removing the Supabase dependency/package itself is Phase 4.
