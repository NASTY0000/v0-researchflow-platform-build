import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ingestRSSSource, type ContentSource } from '@/lib/feed/external/rss-ingester'
import { ingestOpenAlex } from '@/lib/feed/external/openalex-ingester'
import { ingestRedditScience } from '@/lib/feed/external/reddit-ingester'
import { ingestYouTubeScience } from '@/lib/feed/external/youtube-ingester'

export async function GET() {
  const supabase = await createClient()
  const results: Record<string, number> = {}
  let totalInserted = 0

  try {
    // Get all active RSS sources
    const { data: sources } = await supabase
      .from('feed_content_sources')
      .select('*')
      .eq('is_active', true)
      .eq('source_type', 'rss')

    // Ingest all RSS sources
    for (const source of (sources || []) as ContentSource[]) {
      try {
        const count = await ingestRSSSource(source, supabase)
        results[source.name] = count
        totalInserted += count
        await new Promise(r => setTimeout(r, 500))
      } catch (err) {
        console.error('RSS source error:', source.name, err)
        results[source.name] = 0
      }
    }

    // Ingest OpenAlex publications
    try {
      const commonAreas = [
        'Medicine',
        'Public Health',
        'Computer Science',
        'Biology',
        'Economics',
        'Environmental Science',
        'Genetics',
        'AI',
      ]
      const openAlexCount = await ingestOpenAlex(commonAreas, supabase)
      results['OpenAlex'] = openAlexCount
      totalInserted += openAlexCount
    } catch (err) {
      console.error('OpenAlex error:', err)
      results['OpenAlex'] = 0
    }

    // Ingest Reddit science content
    try {
      const redditCount = await ingestRedditScience(supabase)
      results['Reddit'] = redditCount
      totalInserted += redditCount
    } catch (err) {
      console.error('Reddit error:', err)
      results['Reddit'] = 0
    }

    // Ingest YouTube science videos
    try {
      const youtubeCount = await ingestYouTubeScience(supabase)
      results['YouTube'] = youtubeCount
      totalInserted += youtubeCount
    } catch (err) {
      console.error('YouTube error:', err)
      results['YouTube'] = 0
    }

    // Clean up expired content
    await supabase
      .from('feed_external_content')
      .delete()
      .lt('expires_at', new Date().toISOString())

    // Update last_fetched_at for all sources
    await supabase
      .from('feed_content_sources')
      .update({ last_fetched_at: new Date().toISOString() })
      .eq('is_active', true)

    return NextResponse.json({
      success: true,
      total_inserted: totalInserted,
      sources: results,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error('Ingestion error:', err)
    return NextResponse.json(
      {
        error: String(err),
        partial_results: results,
      },
      { status: 500 }
    )
  }
}
