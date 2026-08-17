import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { initGoogleSignIn, disableAutoSelect, onGoogleScriptReady } from '../lib/googleAuth'
import type { GoogleUser } from '../lib/googleAuth'
import { clearCachedToken, getAccessToken, requestSheetsAccess } from '../lib/sheets/sheetsAuth'
import { provisionSpreadsheet } from '../lib/sheets/provisionSpreadsheet'
import { clearSheetsSession } from '../lib/sheets/sheetsSession'
import { clearSheetsCache } from '../lib/sheets/sheetsStore'

const STORAGE_KEY = 'google_identity'

type AuthContextValue = {
  user: GoogleUser | null
  loading: boolean
  /** True once this user's spreadsheet is resolved and the sheets session is ready for data calls. */
  sheetsReady: boolean
  /** True when the silent attempt failed and an explicit, user-clicked consent grant is needed. */
  needsSheetsConsent: boolean
  grantingSheetsAccess: boolean
  /** Must be called synchronously from a real click — see sheetsAuth.ts's requestSheetsAccess. */
  grantSheetsAccess: () => void
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
  const [needsSheetsConsent, setNeedsSheetsConsent] = useState(false)
  const [grantingSheetsAccess, setGrantingSheetsAccess] = useState(false)

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

  // Tries ONLY the silent path automatically — a real consent popup must
  // come from a direct user click (see grantSheetsAccess below), never from
  // here, or browsers block it and the request hangs. If silent fails
  // (bounded, see sheetsAuth.ts), needsSheetsConsent asks the UI to show a
  // button instead of leaving the app stuck loading forever.
  useEffect(() => {
    if (!user) {
      setSheetsReady(false)
      setNeedsSheetsConsent(false)
      return
    }

    let cancelled = false
    setSheetsReady(false)
    setNeedsSheetsConsent(false)
    const currentUser = user

    getAccessToken()
      .then(() => provisionSpreadsheet(currentUser))
      .then(() => {
        if (!cancelled) setSheetsReady(true)
      })
      .catch(() => {
        if (!cancelled) setNeedsSheetsConsent(true)
      })

    return () => {
      cancelled = true
    }
  }, [user])

  function grantSheetsAccess() {
    if (!user) return
    const currentUser = user
    setGrantingSheetsAccess(true)
    setAuthError(null)

    requestSheetsAccess()
      .then(() => provisionSpreadsheet(currentUser))
      .then(() => {
        setNeedsSheetsConsent(false)
        setSheetsReady(true)
      })
      .catch(() => {
        setAuthError('Toegang tot je Google Sheet kon niet worden verkregen. Probeer opnieuw.')
      })
      .finally(() => setGrantingSheetsAccess(false))
  }

  function signOut() {
    localStorage.removeItem(STORAGE_KEY)
    disableAutoSelect()
    clearCachedToken()
    clearSheetsSession()
    clearSheetsCache()
    setUser(null)
    setSheetsReady(false)
    setNeedsSheetsConsent(false)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        // Identity is restored synchronously from localStorage — there's no
        // network round-trip to wait for, unlike Supabase's getSession().
        loading: false,
        sheetsReady,
        needsSheetsConsent,
        grantingSheetsAccess,
        grantSheetsAccess,
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
