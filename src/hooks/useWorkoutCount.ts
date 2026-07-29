import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

/** Total number of workouts the user has ever logged — the cycle's only clock. */
export function useWorkoutCount() {
  const { user } = useAuth()
  const [count, setCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setCount(null)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    supabase
      .from('workouts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .then(({ count: total }) => {
        if (cancelled) return
        setCount(total ?? 0)
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [user])

  return { count, loading }
}
