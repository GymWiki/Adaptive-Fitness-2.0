import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Workout } from '../lib/types'

export function Dashboard() {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRecentWorkouts()
  }, [])

  async function loadRecentWorkouts() {
    setLoading(true)
    const { data } = await supabase
      .from('workouts')
      .select('id, name, performed_at, workout_sets(id)')
      .order('performed_at', { ascending: false })
      .limit(5)
    if (data) setWorkouts(data as unknown as Workout[])
    setLoading(false)
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Jouw workouts</h1>
        <Link
          to="/app/log"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          + Nieuwe workout
        </Link>
      </div>

      {loading && <p className="mt-6 text-sm text-slate-500">Laden...</p>}

      {!loading && workouts.length === 0 && (
        <div className="mt-8 rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
          <p className="text-slate-600 dark:text-slate-400">
            Nog geen workouts gelogd. Begin je eerste training!
          </p>
          <Link
            to="/app/log"
            className="mt-4 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Workout loggen
          </Link>
        </div>
      )}

      <ul className="mt-6 flex flex-col gap-3">
        {workouts.map((workout) => (
          <li
            key={workout.id}
            className="rounded-xl border border-slate-200 p-4 dark:border-slate-800"
          >
            <p className="font-medium text-slate-900 dark:text-white">
              {workout.name || 'Workout'}
            </p>
            <p className="text-sm text-slate-500">
              {new Date(workout.performed_at).toLocaleDateString('nl-NL', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}{' '}
              · {workout.workout_sets?.length ?? 0} sets
            </p>
          </li>
        ))}
      </ul>

      {workouts.length > 0 && (
        <Link
          to="/app/history"
          className="mt-6 block text-center text-sm font-medium text-brand-600 hover:underline"
        >
          Bekijk alle workouts →
        </Link>
      )}
    </div>
  )
}
