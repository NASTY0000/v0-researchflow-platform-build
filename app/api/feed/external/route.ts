import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = await createClient()

  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const category   = searchParams.get('category') || 'news'
  const page       = parseInt(searchParams.get('page')     || '1')
  const pageSize   = parseInt(searchParams.get('pageSize') || '20')
  const africaOnly = searchParams.get('africaOnly') === 'true'

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('research_interests')
      .eq('id', user.id)
      .single()

    const interests = (profile?.research_interests as string[] | null) ?? []
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    let query = supabase
      .from('feed_external_content')
      .select('id, category, content_type, thumbnail_url, title, description, url, authors, journal, citation_count, research_areas, is_african_relevant, deadline, published_at')
      .eq('category', category)
      .gte('published_at', thirtyDaysAgo)
      .order('published_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1)

    if (africaOnly) {
      query = query.eq('is_african_relevant', true)
    } else if (category !== 'discovery' && interests.length > 0) {
      query = query.overlaps('research_areas', interests)
    }

    const { data, error } = await query

    if (error) throw error

    const items = (data ?? []).map(item => ({
      ...item,
      _feed_meta: {
        type: 'external',
        score: 0,
        reason: item.is_african_relevant ? 'Relevant to African research' : 'From your research areas',
        is_diversity: false,
        is_external: true,
        category: item.category,
      },
    }))

    return NextResponse.json({
      items,
      hasMore: items.length === pageSize,
    })
  } catch (err) {
    console.error('External feed API error:', err)
    return NextResponse.json(
      {
        error: 'External feed unavailable',
        detail: String(err),
        stack: err instanceof Error ? err.stack : undefined,
      },
      { status: 500 }
    )
  }
}
