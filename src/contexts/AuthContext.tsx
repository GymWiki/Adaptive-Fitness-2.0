import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

type AuthContextValue = {
  session: Session | null
  user: User | null
  loading: boolean
  authError: string | null
  clearAuthError: () => void
  signInWithEmail: (email: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

/**
 * Supabase's email links (confirm signup, magic link, password reset) all
 * redirect back with either `#error=...&error_description=...` (implicit
 * flow) or `?error=...&error_description=...` appended — e.g. when the link
 * expired or the redirect URL wasn't in the project's allow-list. Without
 * this, a failed confirmation silently drops the user on the landing page
 * with no explanation.
 */
function readAuthErrorFromUrl(): string | null {
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const searchParams = new URLSearchParams(window.location.search)
  const description =
    hashParams.get('error_description') ?? searchParams.get('error_description')
  if (!description) return null

  // Strip the error params so they don't linger in the URL/history.
  window.history.replaceState(null, '', window.location.pathname)
  return description.replace(/\+/g, ' ')
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    // Only set state when an error is actually found — readAuthErrorFromUrl
    // clears the URL as a side effect, so in React StrictMode's dev-only
    // double-invoke, a second call would find nothing and must not stomp
    // the error the first call already surfaced.
    const error = readAuthErrorFromUrl()
    if (error) setAuthError(error)

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  async function signInWithEmail(email: string) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/app`,
      },
    })
    return { error: error?.message ?? null }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        authError,
        clearAuthError: () => setAuthError(null),
        signInWithEmail,
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
