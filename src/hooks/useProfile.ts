import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getProfile } from '../lib/sheets/profiles'
import type { Profile } from '../lib/types'

export function useProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    getProfile(user.uid).then((result) => {
      if (cancelled) return
      setProfile(result)
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [user])

  return { profile, loading }
}
