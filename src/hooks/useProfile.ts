import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getProfile } from '../lib/sheets/profiles'
import type { Profile } from '../lib/types'

export function useProfile() {
  const { user, sheetsReady } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !sheetsReady) {
      setProfile(null)
      // Still loading if signed in and waiting on the sheets session; done otherwise.
      setLoading(Boolean(user))
      return
    }

    let cancelled = false
    setLoading(true)

    getProfile(user.id).then((result) => {
      if (cancelled) return
      setProfile(result)
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [user, sheetsReady])

  return { profile, loading }
}
