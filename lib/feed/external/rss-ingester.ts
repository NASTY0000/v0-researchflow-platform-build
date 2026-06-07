import { createClient } from '@/lib/supabase/server'

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

export interface RSSItem {
  title: string
  link: string
  description?: string
  publishedAt?: string
}

export interface ContentSource {
  id: string
  name: string
  url: string
  stream_category: string
  research_areas: string[] | null
  fetch_config: Record<string, unknown> | null
}

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

function parseRSSXML(xml: string): RSSItem[] {
  const items: RSSItem[] = []

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

export async function fetchRSSFeed(url: string): Promise<RSSItem[]> {
  // Try direct fetch first
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 ResearchFlow/1.0',
        Accept: 'application/rss+xml, application/xml, text/xml, */*',
      },
      signal: AbortSignal.timeout(10000),
    })

    if (res.ok) {
      const xml = await res.text()
      if (xml.includes('<item') || xml.includes('<entry')) {
        return parseRSSXML(xml)
      }
    }
  } catch {
    // Fall through to proxy
  }

  // Try RSS2JSON proxy as fallback (free service, no API key needed)
  try {
    const proxyUrl =
      'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(url) + '&count=20'

    const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(10000) })

    if (!res.ok) return []

    const data = await res.json()

    if (data.status !== 'ok') return []

    return (data.items || [])
      .map((item: Record<string, string>) => ({
        title: stripHTML(item.title || ''),
        link: item.link || item.guid || '',
        description: item.description ? stripHTML(item.description).slice(0, 500) : undefined,
        publishedAt: item.pubDate || new Date().toISOString(),
      }))
      .filter((i: RSSItem) => i.title && i.link)
  } catch {
    return []
  }
}

export function detectAfricanRelevance(text: string): boolean {
  const lower = text.toLowerCase()
  return (
    lower.includes('africa') ||
    lower.includes('nigeria') ||
    lower.includes('kenya') ||
    lower.includes('ghana') ||
    lower.includes('ethiopia') ||
    lower.includes('rwanda') ||
    lower.includes('sub-saharan')
  )
}

export async function ingestRSSSource(source: ContentSource, supabase: SupabaseClient): Promise<number> {
  const items = await fetchRSSFeed(source.url)

  if (!items.length) return 0

  let inserted = 0

  for (const item of items) {
    if (!item.title || !item.link) continue

    const text = `${item.title} ${item.description || ''}`

    const isAfricanRelevant =
      detectAfricanRelevance(text) || !!(source.fetch_config?.is_african_relevant)

    const areas: string[] = [...(source.research_areas || [])]

    try {
      const { error } = await supabase
        .from('feed_external_content')
        .upsert(
          {
            source_id: source.id,
            stream_category: source.stream_category,
            content_type:
              source.stream_category === 'publications'
                ? 'paper'
                : source.stream_category === 'opportunities'
                  ? 'opportunity'
                  : 'article',
            title: item.title.slice(0, 500),
            description: item.description || null,
            url: item.link,
            research_areas: areas,
            published_at: item.publishedAt ? new Date(item.publishedAt).toISOString() : new Date().toISOString(),
            is_african_relevant: isAfricanRelevant,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            raw_data: { source_name: source.name },
          },
          { onConflict: 'url', ignoreDuplicates: true }
        )

      if (!error) inserted++
    } catch {
      // skip
    }
  }

  await supabase
    .from('feed_content_sources')
    .update({ last_fetched_at: new Date().toISOString() })
    .eq('id', source.id)

  return inserted
}
