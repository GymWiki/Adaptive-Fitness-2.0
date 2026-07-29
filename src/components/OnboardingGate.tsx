import { Navigate, Outlet } from 'react-router-dom'
import { useProfile } from '../hooks/useProfile'
import { Spinner } from './ui/States'

/** Sends a logged-in user who hasn't finished onboarding there before any /app page. */
export function OnboardingGate() {
  const { profile, loading } = useProfile()

  if (loading) return <Spinner />

  if (profile && !profile.onboarding_completed) {
    return <Navigate to="/onboarding" replace />
  }

  return <Outlet />
}
