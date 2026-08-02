'use server'

import { createClient } from '@/lib/supabase/server'

// ── TRACK PROFILE VIEW ─────────────────────────────────────────────────────
export async function trackProfileView(profileId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id === profileId) return

    await supabase.from('profile_views').insert({
      profile_id: profileId,
      viewer_id: user.id,
      viewed_at: new Date().toISOString(),
    })
  } catch {
    // Silently fail, view tracking must never break navigation
  }
}

// ── GET MY ANALYTICS ───────────────────────────────────────────────────────
export async function getMyAnalytics() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [
    summaryRes,
    viewsByDayRes,
    akiliHistoryRes,
    topIdeasRes,
    profileRes,
  ] = await Promise.all([
    supabase
      .from('researcher_analytics')
      .select('*')
      .eq('id', user.id)
      .single(),

    supabase
      .from('profile_views')
      .select('viewed_at')
      .eq('profile_id', user.id)
      .gte('viewed_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('viewed_at', { ascending: true }),

    supabase
      .from('akili_score_events')
      .select('points_earned, description, event_type, created_at')
      .eq('user_id', user.id)
      .gte('created_at', new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true }),

    supabase
      .from('research_ideas')
      .select('id, title, research_area, created_at, review_count, average_review_score, review_badge')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),

    supabase
      .from('profiles')
      .select('university_name, akili_score')
      .eq('id', user.id)
      .single(),
  ])

  // Compute Akili cumulative score from events (running sum)
  const rawEvents = akiliHistoryRes.data || []
  let running = 0
  const akiliHistory = rawEvents.map((e) => {
    running += e.points_earned
    return {
      recorded_at: e.created_at,
      delta: e.points_earned,
      score: running,
      description: e.description,
      event_type: e.event_type,
    }
  })

  // University rank
  let universityRank: number | null = null
  let universityTotal: number | null = null
  const uniName = profileRes.data?.university_name
  if (uniName) {
    const { data: uniPeers } = await supabase
      .from('profiles')
      .select('id, akili_score')
      .eq('university_name', uniName)
      .order('akili_score', { ascending: false })

    if (uniPeers) {
      universityTotal = uniPeers.length
      const idx = uniPeers.findIndex((p) => p.id === user.id)
      universityRank = idx >= 0 ? idx + 1 : null
    }
  }

  // Recent Akili events (last 10, descending)
  const { data: recentAkiliEvents } = await supabase
    .from('akili_score_events')
    .select('points_earned, description, event_type, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  return {
    summary: summaryRes.data as Record<string, number | string | boolean | null> | null,
    viewsByDay: viewsByDayRes.data || [],
    akiliHistory,
    topIdeas: topIdeasRes.data || [],
    universityRank,
    universityTotal,
    universityName: uniName || null,
    recentAkiliEvents: recentAkiliEvents || [],
  }
}
