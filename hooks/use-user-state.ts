'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface AkiliTier {
  name: string
  slug: string
  description: string
}

interface UserState {
  akili: {
    total: number
    knowledge: number
    collaboration: number
    mentorship: number
    technical: number
    tier: AkiliTier
    next_tier: {
      name: string
      points_needed: number
      min_points: number
    } | null
  }
  profile: {
    completion_pct: number
    missing_fields: string[]
    is_complete: boolean
  }
  verification: {
    is_mentor_verified: boolean
    is_email_verified: boolean
    show_email_prompt: boolean
  }
}

export function useUserState(userId: string | null) {
  const [state, setState] = useState<UserState | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    const supabase = createClient()
    let cancelled = false

    async function load() {
      setLoading(true)
      const { data, error } = await supabase.rpc('get_user_state', {
        p_user_id: userId,
      })

      if (cancelled) return

      if (!error && data && Object.keys(data).length > 0) {
        setState(data as UserState)
      }
      setLoading(false)
    }

    load()

    return () => {
      cancelled = true
    }
  }, [userId])

  return { state, loading }
}
