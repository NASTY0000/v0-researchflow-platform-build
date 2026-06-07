import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ingestRSSSource, type ContentSource } from '@/lib/feed/external/rss-ingester'
import { ingestOpenAlex } from '@/lib/feed/external/openalex-ingester'

const COMMON_RESEARCH_AREAS = [
  'Medicine', 'Biology', 'Computer Science', 'Public Health',
  'Environmental Science', 'Engineering', 'Agricultural Science',
]

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const supabase = await createClient()
  const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()

  const { data: sources } = await supabase
    .from('feed_content_sources')
    .select('id, name, url, stream_category, research_areas, fetch_config')
    .eq('is_active', true)
    .eq('source_type', 'rss')
    .or(`last_fetched_at.is.null,last_fetched_at.lt.${fourHoursAgo}`)

  let rssIngested = 0
  const results: { source: string; ingested?: number; error?: string }[] = []

  for (const source of (sources ?? []) as ContentSource[]) {
    try {
      const ingested = await ingestRSSSource(source, supabase)
      rssIngested += ingested
      results.push({ source: source.name, ingested })
    } catch (err) {
      results.push({ source: source.name, error: err instanceof Error ? err.message : 'unknown error' })
    }
  }

  let openAlexIngested = 0
  try {
    openAlexIngested = await ingestOpenAlex(COMMON_RESEARCH_AREAS, supabase)
  } catch (err) {
    results.push({ source: 'OpenAlex', error: err instanceof Error ? err.message : 'unknown error' })
  }

  const { count: expiredCount } = await supabase
    .from('feed_external_content')
    .delete({ count: 'exact' })
    .lt('expires_at', new Date().toISOString())

  return NextResponse.json({
    sourcesProcessed: (sources ?? []).length,
    rssIngested,
    openAlexIngested,
    expiredRemoved: expiredCount ?? 0,
    results,
  })
}
