import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Workout } from '../lib/types'

export function History() {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)
  const [openId, setOpenId] = useState<string | null>(null)

  useEffect(() => {
    loadWorkouts()
  }, [])

  async function loadWorkouts() {
    setLoading(true)
    const { data } = await supabase
      .from('workouts')
      .select('id, name, performed_at, workout_sets(id, weight_kg, reps, set_order, exercise:exercises(id, name, muscle_group))')
      .order('performed_at', { ascending: false })
    if (data) setWorkouts(data as unknown as Workout[])
    setLoading(false)
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Geschiedenis</h1>

      {loading && <p className="mt-6 text-sm text-slate-500">Laden...</p>}

      {!loading && workouts.length === 0 && (
        <p className="mt-6 text-slate-600 dark:text-slate-400">Nog geen workouts gelogd.</p>
      )}

      <ul className="mt-6 flex flex-col gap-3">
        {workouts.map((workout) => {
          const isOpen = openId === workout.id
          const sets = [...(workout.workout_sets ?? [])].sort((a, b) => a.set_order - b.set_order)
          return (
            <li
              key={workout.id}
              className="rounded-xl border border-slate-200 dark:border-slate-800"
            >
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : workout.id)}
                className="flex w-full items-center justify-between p-4 text-left"
              >
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {workout.name || 'Workout'}
                  </p>
                  <p className="text-sm text-slate-500">
                    {new Date(workout.performed_at).toLocaleDateString('nl-NL', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}{' '}
                    · {sets.length} sets
                  </p>
                </div>
                <span className="text-slate-400">{isOpen ? '−' : '+'}</span>
              </button>

              {isOpen && (
                <div className="border-t border-slate-200 p-4 dark:border-slate-800">
                  <ul className="flex flex-col gap-2">
                    {sets.map((set) => (
                      <li
                        key={set.id}
                        className="flex justify-between text-sm text-slate-700 dark:text-slate-300"
                      >
                        <span>{set.exercise?.name ?? 'Oefening'}</span>
                        <span>
                          {set.weight_kg} kg × {set.reps}
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
