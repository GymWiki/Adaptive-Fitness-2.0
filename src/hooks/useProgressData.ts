import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { LoggedSet } from '../lib/progressStats'

export type ExerciseHistory = {
  exerciseId: string
  exerciseName: string
  sets: LoggedSet[]
}

type Row = {
  id: string
  exercise_id: string
  weight_kg: number
  reps: number
  rir: number
  workout: { id: string; performed_at: string }
  exercise: { id: string; name: string }
}

/** Every logged set for the current user, grouped by exercise — the input the progress page needs. */
export function useProgressData() {
  const { user } = useAuth()
  const [histories, setHistories] = useState<ExerciseHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!user) {
      setHistories([])
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(false)

    supabase
      .from('workout_sets')
      .select(
        'id, exercise_id, weight_kg, reps, rir, workout:workouts!inner(id, performed_at, user_id), exercise:exercises(id, name)',
      )
      .eq('workout.user_id', user.id)
      .then(({ data, error: fetchError }) => {
        if (cancelled) return
        if (fetchError || !data) {
          setError(true)
          setLoading(false)
          return
        }

        const byExercise = new Map<string, ExerciseHistory>()
        for (const row of data as unknown as Row[]) {
          const loggedSet: LoggedSet = {
            setId: row.id,
            workoutId: row.workout.id,
            performedAt: row.workout.performed_at,
            weightKg: row.weight_kg,
            reps: row.reps,
            rir: row.rir,
          }
          const existing = byExercise.get(row.exercise_id)
          if (existing) {
            existing.sets.push(loggedSet)
          } else {
            byExercise.set(row.exercise_id, {
              exerciseId: row.exercise_id,
              exerciseName: row.exercise.name,
              sets: [loggedSet],
            })
          }
        }

        setHistories(
          [...byExercise.values()].sort((a, b) => a.exerciseName.localeCompare(b.exerciseName)),
        )
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [user])

  return { histories, loading, error }
}
