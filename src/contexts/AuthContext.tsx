import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { initGoogleSignIn, disableAutoSelect, onGoogleScriptReady } from '../lib/googleAuth'
import type { GoogleUser } from '../lib/googleAuth'
import { getAccessToken, requestSheetsAccess } from '../lib/sheets/sheetsAuth'
import { provisionSpreadsheet } from '../lib/sheets/provisionSpreadsheet'
import { clearSheetsSession } from '../lib/sheets/sheetsSession'
import { clearSheetsCache } from '../lib/sheets/sheetsStore'

const STORAGE_KEY = 'google_identity'

type AuthContextValue = {
  user: GoogleUser | null
  loading: boolean
  /** True once this user's spreadsheet is resolved and the sheets session is ready for data calls. */
  sheetsReady: boolean
  authError: string | null
  clearAuthError: () => void
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readStoredUser(): GoogleUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as GoogleUser) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<GoogleUser | null>(() => readStoredUser())
  const [authError, setAuthError] = useState<string | null>(null)
  const [sheetsReady, setSheetsReady] = useState(false)

  useEffect(() => {
    return onGoogleScriptReady(() => {
      initGoogleSignIn(
        (signedInUser) => {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(signedInUser))
          setUser(signedInUser)
          setAuthError(null)
        },
        () => setAuthError('Inloggen met Google is mislukt. Probeer opnieuw.'),
      )
    })
  }, [])

  // Resolves Sheets/Drive access + this user's spreadsheet whenever `user`
  // becomes known — both right after a fresh sign-in, and on every reload
  // (the sheets session lives in memory only, see sheetsSession.ts).
  useEffect(() => {
    if (!user) {
      setSheetsReady(false)
      return
    }

    let cancelled = false
    setSheetsReady(false)
    const currentUser = user

    async function establishSheetsAccess() {
      try {
        await getAccessToken() // silent refresh, succeeds if consent was already granted
      } catch {
        await requestSheetsAccess() // first-ever grant needs an interactive prompt
      }
      await provisionSpreadsheet(currentUser)
      if (!cancelled) setSheetsReady(true)
    }

    establishSheetsAccess().catch(() => {
      if (!cancelled) {
        setAuthError('Toegang tot je Google Sheet kon niet worden verkregen. Probeer opnieuw in te loggen.')
      }
    })

    return () => {
      cancelled = true
    }
  }, [user])

  function signOut() {
    localStorage.removeItem(STORAGE_KEY)
    disableAutoSelect()
    clearSheetsSession()
    clearSheetsCache()
    setUser(null)
    setSheetsReady(false)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        // Identity is restored synchronously from localStorage — there's no
        // network round-trip to wait for, unlike Supabase's getSession().
        loading: false,
        sheetsReady,
        authError,
        clearAuthError: () => setAuthError(null),
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
