import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Workout } from '../lib/types'
import { EmptyState, ErrorState, Spinner } from '../components/ui/States'

export function History() {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)

  useEffect(() => {
    loadWorkouts()
  }, [])

  async function loadWorkouts() {
    setLoading(true)
    setError(false)
    const { data, error: fetchError } = await supabase
      .from('workouts')
      .select(
        'id, name, performed_at, workout_sets(id, weight_kg, reps, rir, set_order, exercise:exercises(id, name, muscle_group))',
      )
      .order('performed_at', { ascending: false })
    if (fetchError) {
      setError(true)
    } else if (data) {
      setWorkouts(data as unknown as Workout[])
    }
    setLoading(false)
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-display text-2xl font-bold">Geschiedenis</h1>

      {loading && <Spinner />}

      {!loading && error && (
        <div className="mt-6">
          <ErrorState message="Je geschiedenis kon niet geladen worden. Probeer de pagina te verversen." />
        </div>
      )}

      {!loading && !error && workouts.length === 0 && (
        <div className="mt-8">
          <EmptyState
            title="Nog geen workouts gelogd"
            description="Zodra je een workout logt, verschijnt die hier."
          />
        </div>
      )}

      <ul className="mt-6 flex flex-col gap-3">
        {workouts.map((workout) => {
          const isOpen = openId === workout.id
          const sets = [...(workout.workout_sets ?? [])].sort((a, b) => a.set_order - b.set_order)
          const label = workout.name || 'Workout'
          return (
            <li key={workout.id} className="rounded-2xl border border-border bg-surface">
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : workout.id)}
                aria-expanded={isOpen}
                aria-label={`${isOpen ? 'Verberg' : 'Toon'} details voor ${label}`}
                className="flex min-h-16 w-full items-center justify-between p-4 text-left"
              >
                <div>
                  <p className="font-semibold text-ink">{label}</p>
                  <p className="text-sm text-ink-dim">
                    {new Date(workout.performed_at).toLocaleDateString('nl-NL', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}{' '}
                    · {sets.length} sets
                  </p>
                </div>
                <span aria-hidden className="text-xl text-ink-faint">
                  {isOpen ? '−' : '+'}
                </span>
              </button>

              {isOpen && (
                <div className="border-t border-border p-4">
                  <ul className="flex flex-col gap-2">
                    {sets.map((set) => (
                      <li key={set.id} className="flex justify-between text-sm text-ink-dim">
                        <span className="text-ink">{set.exercise?.name ?? 'Oefening'}</span>
                        <span>
                          {set.weight_kg} kg × {set.reps} · RIR {set.rir}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
