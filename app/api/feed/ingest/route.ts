import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ingestRSSSource, type ContentSource } from '@/lib/feed/external/rss-ingester'
import { ingestOpenAlex } from '@/lib/feed/external/openalex-ingester'
import { ingestRedditScience } from '@/lib/feed/external/reddit-ingester'
import { ingestYouTubeScience } from '@/lib/feed/external/youtube-ingester'

const COMMON_RESEARCH_AREAS = [
  'Medicine', 'Biology', 'Computer Science', 'Public Health',
  'Environmental Science', 'Engineering', 'Agricultural Science',
]

export async function GET(request: Request) {
  console.log('Ingest route called at', new Date().toISOString())
  console.log('CRON_SECRET set:', !!process.env.CRON_SECRET)

  // TEMPORARY — auth disabled for manual browser-triggered testing.
  // const authHeader = request.headers.get('authorization')
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  // }

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

  let redditIngested = 0
  try {
    redditIngested = await ingestRedditScience(supabase)
    results.push({ source: 'Reddit', ingested: redditIngested })
  } catch (err) {
    results.push({ source: 'Reddit', error: err instanceof Error ? err.message : 'unknown error' })
  }

  let youtubeIngested = 0
  try {
    youtubeIngested = await ingestYouTubeScience(supabase)
    results.push({ source: 'YouTube', ingested: youtubeIngested })
  } catch (err) {
    results.push({ source: 'YouTube', error: err instanceof Error ? err.message : 'unknown error' })
  }

  const { count: expiredCount } = await supabase
    .from('feed_external_content')
    .delete({ count: 'exact' })
    .lt('expires_at', new Date().toISOString())

  return NextResponse.json({
    sourcesProcessed: (sources ?? []).length,
    rssIngested,
    openAlexIngested,
    redditIngested,
    youtubeIngested,
    expiredRemoved: expiredCount ?? 0,
    results,
  })
}
