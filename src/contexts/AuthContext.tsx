import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  GoogleAuthProvider,
  browserLocalPersistence,
  getRedirectResult,
  onAuthStateChanged,
  setPersistence,
  signInWithRedirect,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth'
import { auth } from '../lib/firebase/firebaseClient'

type AuthContextValue = {
  user: User | null
  /** True until the first onAuthStateChanged callback fires (session restore from IndexedDB). */
  loading: boolean
  authError: string | null
  clearAuthError: () => void
  /** Must be called from a real click — see index.html / Login.tsx. */
  signInWithGoogle: () => void
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    if (!auth) {
      setLoading(false)
      return
    }

    setPersistence(auth, browserLocalPersistence).catch(() => {})

    // Surfaces a redirect-specific failure (e.g. account-exists-with-
    // different-credential); onAuthStateChanged below is what actually
    // resolves the signed-in user once the redirect completes.
    getRedirectResult(auth).catch(() => {
      setAuthError('Inloggen met Google is mislukt. Probeer opnieuw.')
    })

    return onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false)
    })
  }, [])

  function signInWithGoogle() {
    if (!auth) {
      setAuthError('Firebase is nog niet geconfigureerd (ontbrekende environment variables).')
      return
    }
    setAuthError(null)
    signInWithRedirect(auth, new GoogleAuthProvider())
  }

  function signOut() {
    if (auth) firebaseSignOut(auth)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authError,
        clearAuthError: () => setAuthError(null),
        signInWithGoogle,
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
