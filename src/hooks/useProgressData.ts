import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { listWorkoutsWithDetail } from '../lib/sheets/workouts'
import type { LoggedSet } from '../lib/progressStats'

export type ExerciseHistory = {
  exerciseId: string
  exerciseName: string
  sets: LoggedSet[]
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
      setLoading(Boolean(user))
      return
    }

    let cancelled = false
    setLoading(true)
    setError(false)

    listWorkoutsWithDetail()
      .then((workouts) => {
        if (cancelled) return

        const byExercise = new Map<string, ExerciseHistory>()
        for (const workout of workouts) {
          for (const set of workout.workout_sets ?? []) {
            if (!set.exercise) continue
            const loggedSet: LoggedSet = {
              setId: set.id,
              workoutId: workout.id,
              performedAt: workout.performed_at,
              weightKg: set.weight_kg,
              reps: set.reps,
              rir: set.rir,
            }
            const existing = byExercise.get(set.exercise_id)
            if (existing) {
              existing.sets.push(loggedSet)
            } else {
              byExercise.set(set.exercise_id, {
                exerciseId: set.exercise_id,
                exerciseName: set.exercise.name,
                sets: [loggedSet],
              })
            }
          }
        }

        setHistories(
          [...byExercise.values()].sort((a, b) => a.exerciseName.localeCompare(b.exerciseName)),
        )
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setError(true)
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [user])

  return { histories, loading, error }
}
