import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

function stripHTML(text: string): string {
  return text
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function parseRSS(xml: string): Array<{
  title: string
  link: string
  description?: string
  publishedAt?: string
}> {
  const items = []

  const allMatches = [
    ...xml.matchAll(/<item[^>]*>([\s\S]*?)<\/item>/gi),
    ...xml.matchAll(/<entry[^>]*>([\s\S]*?)<\/entry>/gi),
  ]

  for (const match of allMatches) {
    const c = match[1]

    function get(tag: string): string {
      const cdata = c.match(new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>`, 'i'))
      if (cdata) return cdata[1].trim()
      const plain = c.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'))
      if (plain) return plain[1].trim()
      const href = c.match(new RegExp(`<${tag}[^>]*href=["']([^"']+)["']`, 'i'))
      return href?.[1]?.trim() || ''
    }

    const title = get('title')
    const link = get('link') || c.match(/<link[^>]*href=["']([^"']+)["']/i)?.[1] || get('guid') || ''
    const description = get('description') || get('summary') || get('content')
    const pubDate = get('pubDate') || get('published') || get('updated')

    if (title && link) {
      items.push({
        title: stripHTML(title),
        link: link.trim(),
        description: description ? stripHTML(description).slice(0, 500) : undefined,
        publishedAt: pubDate || new Date().toISOString(),
      })
    }
  }

  return items.slice(0, 20)
}

function isAfrican(text: string): boolean {
  const l = text.toLowerCase()
  return (
    l.includes('africa') ||
    l.includes('nigeria') ||
    l.includes('kenya') ||
    l.includes('ghana') ||
    l.includes('ethiopia') ||
    l.includes('sub-saharan')
  )
}

async function ingestSource(source: {
  id: string
  name: string
  url: string
  stream_category: string
  research_areas: string[] | null
  fetch_config: Record<string, unknown> | null
}): Promise<number> {
  try {
    const res = await fetch(source.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 ResearchFlow/1.0',
        Accept: 'application/rss+xml, application/xml, text/xml, */*',
      },
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) return 0

    const xml = await res.text()
    const items = parseRSS(xml)
    if (!items.length) return 0

    let inserted = 0
    for (const item of items) {
      if (!item.title || !item.link) continue

      const text = `${item.title} ${item.description || ''}`

      const { error } = await supabase
        .from('feed_external_content')
        .upsert(
          {
            source_id: source.id,
            category: source.stream_category,
            content_type:
              source.stream_category === 'publications'
                ? 'paper'
                : source.stream_category === 'opportunities'
                  ? 'opportunity'
                  : 'article',
            title: item.title.slice(0, 500),
            description: item.description || null,
            url: item.link,
            research_areas: source.research_areas || [],
            published_at: item.publishedAt ? new Date(item.publishedAt).toISOString() : new Date().toISOString(),
            is_african_relevant: isAfrican(text) || !!(source.fetch_config?.is_african_relevant),
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            raw_data: { source_name: source.name },
          },
          { onConflict: 'url', ignoreDuplicates: true }
        )

      if (!error) inserted++
    }

    return inserted
  } catch {
    return 0
  }
}

Deno.serve(async () => {
  const results: Record<string, number> = {}
  let total = 0

  const { data: sources } = await supabase
    .from('feed_content_sources')
    .select('*')
    .eq('is_active', true)
    .eq('source_type', 'rss')

  for (const source of sources || []) {
    const count = await ingestSource(source)
    results[source.name] = count
    total += count
    await new Promise(r => setTimeout(r, 300))
  }

  await supabase
    .from('feed_content_sources')
    .update({ last_fetched_at: new Date().toISOString() })
    .eq('is_active', true)
    .eq('source_type', 'rss')

  return new Response(
    JSON.stringify({
      success: true,
      total_inserted: total,
      sources: results,
      timestamp: new Date().toISOString(),
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
