export type GoogleUser = {
  id: string
  email: string
  name: string | null
  picture: string | null
}

function base64UrlDecode(input: string): string {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  return atob(padded)
}

/**
 * Decodes a Google Identity Services credential (a signed JWT) into the
 * identity fields this app needs. The signature is not verified — there is
 * no backend to verify it against. That's an accepted trade-off: this
 * identity is "who to greet," not a security boundary. See
 * docs/superpowers/specs/2026-07-31-google-signin-phase1-design.md §2.
 */
export function decodeGoogleIdToken(credential: string): GoogleUser | null {
  try {
    const [, payload] = credential.split('.')
    if (!payload) return null

    const claims = JSON.parse(base64UrlDecode(payload)) as Record<string, unknown>
    if (typeof claims.sub !== 'string' || typeof claims.email !== 'string') return null

    return {
      id: claims.sub,
      email: claims.email,
      name: typeof claims.name === 'string' ? claims.name : null,
      picture: typeof claims.picture === 'string' ? claims.picture : null,
    }
  } catch {
    return null
  }
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string
            callback: (response: { credential: string }) => void
          }) => void
          renderButton: (
            parent: HTMLElement,
            options: { theme: string; shape: string; size: string; text: string },
          ) => void
          disableAutoSelect: () => void
        }
      }
    }
  }
}

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

export function hasGoogleClientId(): boolean {
  return Boolean(CLIENT_ID)
}

export function initGoogleSignIn(
  onCredential: (user: GoogleUser) => void,
  onInvalidCredential: () => void,
): void {
  if (!CLIENT_ID || !window.google) return
  window.google.accounts.id.initialize({
    client_id: CLIENT_ID,
    callback: (response) => {
      const user = decodeGoogleIdToken(response.credential)
      if (user) {
        onCredential(user)
      } else {
        onInvalidCredential()
      }
    },
  })
}

export function renderGoogleButton(container: HTMLElement): void {
  if (!window.google) return
  window.google.accounts.id.renderButton(container, {
    theme: 'filled_black',
    shape: 'pill',
    size: 'large',
    text: 'signin_with',
  })
}

export function disableAutoSelect(): void {
  window.google?.accounts.id.disableAutoSelect()
}

/**
 * The GIS script (loaded in index.html) may not have finished loading yet
 * when a component mounts. Calls `callback` once it's ready — immediately
 * if it already is, or on the script's load event otherwise. Returns a
 * cleanup function.
 */
export function onGoogleScriptReady(callback: () => void): () => void {
  if (window.google) {
    callback()
    return () => {}
  }
  const script = document.querySelector<HTMLScriptElement>(
    'script[src*="accounts.google.com/gsi/client"]',
  )
  script?.addEventListener('load', callback)
  return () => script?.removeEventListener('load', callback)
}
