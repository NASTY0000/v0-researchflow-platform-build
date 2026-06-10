'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getAkiliTier, getNextAkiliTier } from '@/lib/constants/akili'

export interface AkiliState {
  total: number
  dimensions: {
    knowledge: number
    collaboration: number
    mentorship: number
    technical: number
  }
  tier: {
    name: string
    slug: string
    description: string
    min_points: number
  }
  next_tier: {
    name: string
    points_needed: number
    min_points: number
  } | null
  progress_pct: number
}

function computeTier(score: number) {
  const current = getAkiliTier(score)
  const next = getNextAkiliTier(score)

  const progress_pct = next
    ? Math.round(((score - current.min) / (next.min - current.min)) * 100)
    : 100

  return {
    tier: {
      name: current.name,
      slug: current.slug,
      description: current.description,
      min_points: current.min,
    },
    next_tier: next ? {
      name: next.name,
      points_needed: next.min - score,
      min_points: next.min,
    } : null,
    progress_pct,
  }
}

export function useAkiliState(userId: string | null) {
  const [state, setState] = useState<AkiliState | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    const supabase = createClient()

    async function load() {
      const { data } = await supabase
        .from('profiles')
        .select(`
          akili_score,
          akili_dimension_knowledge,
          akili_dimension_collaboration,
          akili_dimension_mentorship,
          akili_dimension_technical
        `)
        .eq('id', userId)
        .single()

      if (!data) {
        setLoading(false)
        return
      }

      const total = data.akili_score || 0
      const { tier, next_tier, progress_pct } = computeTier(total)

      setState({
        total,
        dimensions: {
          knowledge: data.akili_dimension_knowledge || 0,
          collaboration: data.akili_dimension_collaboration || 0,
          mentorship: data.akili_dimension_mentorship || 0,
          technical: data.akili_dimension_technical || 0,
        },
        tier,
        next_tier,
        progress_pct,
      })
      setLoading(false)
    }

    load()

    const channel = supabase
      .channel('akili-state')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${userId}`,
      }, () => {
        load()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  return { state, loading }
}
