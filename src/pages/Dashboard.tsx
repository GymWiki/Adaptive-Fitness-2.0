import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { listRecentWorkouts } from '../lib/sheets/workouts'
import type { Workout } from '../lib/types'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState, ErrorState, Spinner } from '../components/ui/States'
import { ActiveProgramPanel } from '../components/ActiveProgramPanel'

export function Dashboard() {
  const { user, sheetsReady } = useAuth()
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!user || !sheetsReady) return
    loadRecentWorkouts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, sheetsReady])

  async function loadRecentWorkouts() {
    setLoading(true)
    setError(false)
    try {
      setWorkouts(await listRecentWorkouts(5))
    } catch {
      setError(true)
    }
    setLoading(false)
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <ActiveProgramPanel />

      <Link
        to="/app/eigen-schema"
        className="mb-8 -mt-4 block text-sm font-semibold text-accent hover:underline"
      >
        Eigen schema bouwen →
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Jouw workouts</h1>
        <Link to="/app/log">
          <Button size="sm">+ Nieuwe workout</Button>
        </Link>
      </div>

      {loading && <Spinner />}

      {!loading && error && (
        <div className="mt-6">
          <ErrorState message="Je workouts konden niet geladen worden. Controleer je verbinding en probeer opnieuw." />
        </div>
      )}

      {!loading && !error && workouts.length === 0 && (
        <div className="mt-8">
          <EmptyState
            title="Nog geen workouts gelogd"
            description="Begin je eerste training — het duurt maar een minuut."
            action={
              <Link to="/app/log">
                <Button>Workout loggen</Button>
              </Link>
            }
          />
        </div>
      )}

      <ul className="mt-6 flex flex-col gap-3">
        {workouts.map((workout) => (
          <li key={workout.id}>
            <Card>
              <p className="font-semibold text-ink">{workout.name || 'Workout'}</p>
              <p className="mt-1 text-sm text-ink-dim">
                {new Date(workout.performed_at).toLocaleDateString('nl-NL', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}{' '}
                · {workout.workout_sets?.length ?? 0} sets
              </p>
            </Card>
          </li>
        ))}
      </ul>

      {workouts.length > 0 && (
        <Link
          to="/app/history"
          className="mt-6 block text-center text-sm font-semibold text-accent hover:underline"
        >
          Bekijk alle workouts →
        </Link>
      )}
    </div>
  )
}
