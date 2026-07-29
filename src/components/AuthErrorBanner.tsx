import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function AuthErrorBanner() {
  const { authError, clearAuthError } = useAuth()

  if (!authError) return null

  return (
    <div className="bg-red-50 px-4 py-3 text-center text-sm text-red-800 dark:bg-red-950 dark:text-red-300">
      Inloggen mislukt: {authError}.{' '}
      <Link to="/login" onClick={clearAuthError} className="font-medium underline">
        Vraag een nieuwe link aan
      </Link>
      <button
        type="button"
        onClick={clearAuthError}
        aria-label="Sluiten"
        className="ml-3 text-red-400 hover:text-red-600"
      >
        ✕
      </button>
    </div>
  )
}
