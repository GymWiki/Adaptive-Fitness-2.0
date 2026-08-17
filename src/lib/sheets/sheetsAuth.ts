const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
].join(' ')

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

// Google's silent token request doesn't reliably invoke its callback when
// there's no prior consent to reuse (blocked third-party cookies, no
// existing grant, etc.) — without a bound, a caller can hang forever.
const SILENT_TIMEOUT_MS = 5000

const TOKEN_STORAGE_KEY = 'sheets_access_token'

type CachedToken = { accessToken: string; expiresAt: number }
type TokenClient = { requestAccessToken: (overrideConfig?: { prompt?: string }) => void }

// Persisted to localStorage (not just kept in memory) so a page reload or a
// fresh app open reuses the still-valid token instead of hitting the silent
// request (and its fallback consent button) again every single time — the
// grant itself already persists on Google's side, this just stops throwing
// away our own copy of a token that's still good for up to ~an hour.
function readStoredToken(): CachedToken | null {
  try {
    const raw = localStorage.getItem(TOKEN_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as CachedToken) : null
  } catch {
    return null
  }
}

function writeStoredToken(token: CachedToken): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(token))
}

let tokenClient: TokenClient | null = null
let cachedToken: CachedToken | null = readStoredToken()
let pendingResolve: ((token: string) => void) | null = null
let pendingReject: ((error: Error) => void) | null = null

function ensureTokenClient(): TokenClient | null {
  if (tokenClient) return tokenClient
  if (!window.google || !CLIENT_ID) return null

  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: (response) => {
      if (response.error || !response.access_token) {
        pendingReject?.(new Error(response.error ?? 'No access token returned'))
      } else {
        // Refresh a minute before actual expiry, to avoid racing a request
        // against the token expiring mid-flight.
        cachedToken = {
          accessToken: response.access_token,
          expiresAt: Date.now() + (response.expires_in ?? 3600) * 1000 - 60_000,
        }
        writeStoredToken(cachedToken)
        pendingResolve?.(response.access_token)
      }
      pendingResolve = null
      pendingReject = null
    },
  })
  return tokenClient
}

function requestToken(prompt: string, timeoutMs?: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = ensureTokenClient()
    if (!client) {
      reject(new Error('Google Sign-In is not configured'))
      return
    }

    // A late callback firing after a timeout already rejected (or vice
    // versa) must be a no-op, not a second settle.
    let settled = false

    pendingResolve = (token) => {
      if (settled) return
      settled = true
      resolve(token)
    }
    pendingReject = (error) => {
      if (settled) return
      settled = true
      reject(error)
    }

    if (timeoutMs) {
      setTimeout(() => {
        if (settled) return
        settled = true
        pendingResolve = null
        pendingReject = null
        reject(new Error('Timed out waiting for Google'))
      }, timeoutMs)
    }

    client.requestAccessToken({ prompt })
  })
}

/**
 * Returns a valid Sheets/Drive access token, refreshing silently (no popup,
 * bounded so it can never hang) if the cached one has expired. Never shows
 * UI — callers must fall back to `requestSheetsAccess` (from a real click)
 * when this rejects.
 */
export async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.accessToken
  }
  return requestToken('', SILENT_TIMEOUT_MS)
}

/**
 * Explicit, interactive consent prompt for the Sheets/Drive scopes. Must be
 * called synchronously from a real user click (e.g. a button's onClick) —
 * browsers block popups triggered from anywhere else (a useEffect, a
 * .then() chain), which is what caused this to hang silently before.
 */
export function requestSheetsAccess(): Promise<string> {
  return requestToken('consent')
}

/** Drops the cached token on sign-out, so a different account signing in on the same device never reuses it. */
export function clearCachedToken(): void {
  cachedToken = null
  localStorage.removeItem(TOKEN_STORAGE_KEY)
}
