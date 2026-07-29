import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function AuthErrorBanner() {
  const { authError, clearAuthError } = useAuth()

  if (!authError) return null

  return (
    <div
      role="alert"
      className="border-b border-danger/30 bg-danger/10 px-4 py-3 text-center text-sm text-ink"
    >
      <span className="text-danger">Inloggen mislukt:</span> {authError}.{' '}
      <Link to="/login" onClick={clearAuthError} className="font-semibold underline">
        Vraag een nieuwe inloglink aan
      </Link>
      <button
        type="button"
        onClick={clearAuthError}
        aria-label="Melding sluiten"
        className="ml-3 min-h-8 min-w-8 rounded-lg text-ink-faint hover:text-ink"
      >
        ✕
      </button>
    </div>
  )
}
