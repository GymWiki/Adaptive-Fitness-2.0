import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { initGoogleSignIn, disableAutoSelect, onGoogleScriptReady } from '../lib/googleAuth'
import type { GoogleUser } from '../lib/googleAuth'

const STORAGE_KEY = 'google_identity'

type AuthContextValue = {
  user: GoogleUser | null
  loading: boolean
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

  function signOut() {
    localStorage.removeItem(STORAGE_KEY)
    disableAutoSelect()
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        // Identity is restored synchronously from localStorage — there's no
        // network round-trip to wait for, unlike Supabase's getSession().
        loading: false,
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
