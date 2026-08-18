import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/Button'
import { ErrorState } from '../components/ui/States'

export function Login() {
  const { user, authError, signInWithGoogle } = useAuth()

  if (user) return <Navigate to="/app" replace />

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <Link to="/" className="mb-8 text-center font-display text-lg font-bold">
        Fitness Log
      </Link>
      <h1 className="text-center font-display text-2xl font-bold">Inloggen</h1>
      <p className="mt-2 text-center text-sm text-ink-dim">Log in met je Google-account.</p>

      <div className="mt-6 flex flex-col items-center gap-3">
        <Button onClick={signInWithGoogle} fullWidth>
          Inloggen met Google
        </Button>
        {authError && <ErrorState message={authError} />}
      </div>
    </div>
  )
}
