import { Navigate, Outlet } from 'react-router-dom'
import { useProfile } from '../hooks/useProfile'

/** Sends a logged-in user who hasn't finished onboarding there before any /app page. */
export function OnboardingGate() {
  const { profile, loading } = useProfile()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-slate-500">Laden...</p>
      </div>
    )
  }

  if (profile && !profile.onboarding_completed) {
    return <Navigate to="/onboarding" replace />
  }

  return <Outlet />
}
