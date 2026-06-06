import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const body = await request.json()
  const {
    contentType,
    contentId,
    eventType,
    contentResearchAreas = [] as string[],
  } = body as {
    contentType: string
    contentId: string
    eventType: string
    contentResearchAreas?: string[]
  }

  if (!contentType || !contentId || !eventType) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  // Record engagement event
  await supabase.from('feed_engagement_events').insert({
    user_id:                user.id,
    content_type:           contentType,
    content_id:             contentId,
    event_type:             eventType,
    content_research_areas: contentResearchAreas,
  })

  // Boost interest weights on positive engagement
  if (eventType === 'save' || eventType === 'apply') {
    for (const area of contentResearchAreas) {
      // Read current weight, then write incremented value (avoids RPC dependency)
      const { data: existing } = await supabase
        .from('user_interest_weights')
        .select('behavioural_weight')
        .eq('user_id', user.id)
        .eq('research_area', area)
        .maybeSingle()

      await supabase.from('user_interest_weights').upsert(
        {
          user_id:            user.id,
          research_area:      area,
          explicit_weight:    1.0,
          behavioural_weight: Math.min((existing?.behavioural_weight ?? 0) + 0.05, 2.0),
          last_updated:       new Date().toISOString(),
        },
        { onConflict: 'user_id,research_area' }
      )
    }

    // Invalidate cache so next load uses updated weights
    await supabase
      .from('feed_score_cache')
      .delete()
      .eq('user_id', user.id)
  }

  // Remove dismissed item from cache
  if (eventType === 'not_interested') {
    await supabase
      .from('feed_score_cache')
      .delete()
      .eq('user_id', user.id)
      .eq('content_type', contentType)
      .eq('content_id', contentId)
  }

  return NextResponse.json({ success: true })
}
