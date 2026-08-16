import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { countWorkouts } from '../lib/sheets/workouts'

/** Total number of workouts the user has ever logged — the cycle's only clock. */
export function useWorkoutCount() {
  const { user, sheetsReady } = useAuth()
  const [count, setCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !sheetsReady) {
      setCount(null)
      setLoading(Boolean(user))
      return
    }

    let cancelled = false
    setLoading(true)

    countWorkouts().then((total) => {
      if (cancelled) return
      setCount(total)
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [user, sheetsReady])

  return { count, loading }
}
