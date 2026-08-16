const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
].join(' ')

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

type TokenClient = { requestAccessToken: (overrideConfig?: { prompt?: string }) => void }

let tokenClient: TokenClient | null = null
let cachedToken: { accessToken: string; expiresAt: number } | null = null
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
        pendingResolve?.(response.access_token)
      }
      pendingResolve = null
      pendingReject = null
    },
  })
  return tokenClient
}

function requestToken(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = ensureTokenClient()
    if (!client) {
      reject(new Error('Google Sign-In is not configured'))
      return
    }
    pendingResolve = resolve
    pendingReject = reject
    client.requestAccessToken({ prompt })
  })
}

/**
 * Returns a valid Sheets/Drive access token, refreshing silently
 * (no popup) if the cached one has expired. Callers needing the initial,
 * explicit consent grant (right after sign-in) should use
 * `requestSheetsAccess` instead.
 */
export async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.accessToken
  }
  return requestToken('')
}

/** Explicit, interactive consent prompt for the Sheets/Drive scopes — called once right after sign-in. */
export function requestSheetsAccess(): Promise<string> {
  return requestToken('consent')
}
