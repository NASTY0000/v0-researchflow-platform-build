'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types/database'

interface Milestone {
  key: string
  title: string
  description: string
  icon: string
}

export function useMilestones(profile: Profile | null) {
  const [activeMilestone, setActiveMilestone] = useState<Milestone | null>(null)

  const checkMilestones = useCallback(async () => {
    if (!profile) return

    const supabase = createClient()

    // Fetch counts not stored on the profile row
    const [ideasRes, showcaseRes] = await Promise.all([
      supabase
        .from('research_ideas')
        .select('id', { count: 'exact', head: true })
        .eq('author_id', profile.id),
      supabase
        .from('showcase_entries')
        .select('id', { count: 'exact', head: true })
        .eq('author_id', profile.id)
        .eq('status', 'published'),
    ])

    const ideaCount     = ideasRes.count     ?? 0
    const showcaseCount = showcaseRes.count  ?? 0
    const connCount     = profile.connections_count ?? 0

    const candidates: Array<{
      key: string
      condition: boolean
      title: string
      description: string
      icon: string
    }> = [
      {
        key: 'first_idea',
        condition: ideaCount >= 1,
        title: 'First idea posted! 🌱',
        description: 'Your research idea is now visible to thousands of researchers across Africa.',
        icon: '💡',
      },
      {
        key: 'first_connection',
        condition: connCount >= 1,
        title: 'First connection made!',
        description: "You've started building your research network. This is how collaborations begin.",
        icon: '🤝',
      },
      {
        key: 'tier_scholar',
        condition: (profile.akili_score ?? 0) >= 300,
        title: "You're a Scholar Researcher!",
        description: "You've reached a new tier on ResearchFlow. Your Baobab is growing. 🌳",
        icon: '⚡',
      },
      {
        key: 'tier_fellow',
        condition: (profile.akili_score ?? 0) >= 700,
        title: 'Research Fellow achieved!',
        description: 'Remarkable progress. The ResearchFlow community recognises your contribution.',
        icon: '🎓',
      },
      {
        key: 'first_publish',
        condition: showcaseCount >= 1,
        title: 'Research published!',
        description: 'Your work is now part of the ResearchFlow Showcase. Your star is in the constellation. ⭐',
        icon: '✨',
      },
      {
        key: 'profile_complete',
        condition: !!(
          profile.bio?.trim() &&
          profile.university_id &&
          (profile.research_interests?.length ?? 0) > 0 &&
          profile.avatar_url
        ),
        title: 'Profile complete!',
        description: 'Your full profile unlocks better matches and more visibility.',
        icon: '🌟',
      },
    ]

    for (const m of candidates) {
      if (!m.condition) continue
      const alreadySeen = localStorage.getItem(`rf_milestone_${m.key}`)
      if (!alreadySeen) {
        localStorage.setItem(`rf_milestone_${m.key}`, 'true')
        setActiveMilestone({ key: m.key, title: m.title, description: m.description, icon: m.icon })
        break
      }
    }
  }, [profile])

  useEffect(() => {
    checkMilestones()
  }, [checkMilestones])

  return {
    activeMilestone,
    clearMilestone: () => setActiveMilestone(null),
  }
}
