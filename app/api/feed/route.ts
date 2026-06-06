import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildUserScoringContext, scoreItem } from '@/lib/feed/scoring-engine'
import { fetchCandidateContent } from '@/lib/feed/feed-fetcher'

export async function GET(request: Request) {
  const supabase = await createClient()

  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const page     = parseInt(searchParams.get('page')     || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '20')

  try {
    // Load user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, research_interests, department, academic_level, university_id')
      .eq('id', user.id)
      .single()

    if (!profile) return NextResponse.json({ items: [], hasMore: false })

    // Load connections (follows) for social signals
    const { data: follows } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id)
      .limit(100)

    const userContext = {
      id: user.id,
      research_interests: (profile.research_interests as string[]) ?? [],
      department: profile.department ?? undefined,
      academic_level: profile.academic_level ?? undefined,
      university_id: profile.university_id ?? undefined,
      connection_ids: (follows ?? []).map((f: { following_id: string }) => f.following_id),
    }

    // Check fresh cache
    const { data: cached } = await supabase
      .from('feed_score_cache')
      .select('*')
      .eq('user_id', user.id)
      .gte('expires_at', new Date().toISOString())
      .order('score', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize)

    if (cached && cached.length >= pageSize) {
      return NextResponse.json({
        items: cached,
        hasMore: cached.length === pageSize,
        source: 'cache',
      })
    }

    // Cache miss — fetch and score
    const [candidates, scoringCtx] = await Promise.all([
      fetchCandidateContent({ userId: user.id, researchInterests: userContext.research_interests }, supabase),
      buildUserScoringContext(userContext, supabase),
    ])

    // Score all candidates (synchronous now — no extra DB calls)
    const scored = candidates.map(item => scoreItem(item, scoringCtx))
    scored.sort((a, b) => b.score - a.score)

    // Inject diversity items every 6 positions
    const diversityCandidates = scored.filter(i => i.is_diversity_inject)
    const regularItems        = scored.filter(i => !i.is_diversity_inject)
    const feed: typeof scored = []
    let dIdx = 0

    for (let i = 0; i < regularItems.length; i++) {
      feed.push(regularItems[i])
      if ((i + 1) % 6 === 0 && dIdx < diversityCandidates.length) {
        feed.push(diversityCandidates[dIdx++])
      }
    }

    // Cache for 2 hours (fire and forget)
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
    supabase
      .from('feed_score_cache')
      .upsert(
        feed.map(item => ({
          user_id:            user.id,
          content_type:       item.type,
          content_id:         item.id,
          score:              item.score,
          score_breakdown:    item.score_breakdown,
          is_diversity_inject: item.is_diversity_inject,
          expires_at:         expiresAt,
        })),
        { onConflict: 'user_id,content_type,content_id' }
      )
      .then()

    const paginated = feed.slice((page - 1) * pageSize, page * pageSize)

    return NextResponse.json({
      items: paginated.map(item => ({
        ...item.raw_data,
        _feed_meta: {
          type:         item.type,
          score:        item.score,
          reason:       item.reason_label,
          is_diversity: item.is_diversity_inject,
        },
      })),
      hasMore: paginated.length === pageSize,
      source: 'computed',
    })
  } catch (err) {
    console.error('Feed API error:', err)
    return NextResponse.json({ error: 'Feed unavailable' }, { status: 500 })
  }
}
