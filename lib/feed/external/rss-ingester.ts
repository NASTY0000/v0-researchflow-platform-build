import { createClient } from '@/lib/supabase/server'

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

export interface RSSItem {
  title: string
  link: string
  description?: string
  publishedAt?: string
  authors?: string[]
}

export interface ContentSource {
  id: string
  name: string
  url: string
  stream_category: string
  research_areas: string[] | null
  fetch_config: Record<string, unknown> | null
}

const USER_AGENT = 'ResearchFlow/1.0 (researchflowafrica.com)'

export async function fetchRSSFeed(url: string): Promise<RSSItem[]> {
  console.log(`[RSS] Fetching: ${url}`)

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/rss+xml, application/atom+xml, text/xml' },
      next: { revalidate: 3600 },
    })

    console.log(`[RSS] ${url}: status ${res.status}`)

    if (!res.ok) {
      console.error(`[RSS] ${url}: failed with ${res.status}`)
      return []
    }

    const xml = await res.text()
    console.log(`[RSS] ${url}: got ${xml.length} chars`)

    const items = parseRSSXML(xml)
    console.log(`[RSS] ${url}: parsed ${items.length} items`)
    return items
  } catch (err) {
    console.error(`[RSS] Fetch error for ${url}:`, err)
    return []
  }
}

export function parseRSSXML(xml: string): RSSItem[] {
  const items: RSSItem[] = []

  // RSS <item> and Atom <entry> blocks (namespaced tags like <atom:entry> too)
  const itemRegex = /<(?:[a-z]+:)?item[^>]*>([\s\S]*?)<\/(?:[a-z]+:)?item>/gi
  const entryRegex = /<(?:[a-z]+:)?entry[^>]*>([\s\S]*?)<\/(?:[a-z]+:)?entry>/gi

  const allMatches = [...xml.matchAll(itemRegex), ...xml.matchAll(entryRegex)]

  console.log(`[RSS Parser] Found ${allMatches.length} items in XML`)

  for (const match of allMatches) {
    const content = match[1]

    const title = stripHTML(getTag(content, 'title'))

    let link =
      getTag(content, 'link') ||
      content.match(/<(?:[a-z]+:)?link[^>]*href=["']([^"']+)["']/i)?.[1] ||
      content.match(/<(?:[a-z]+:)?guid[^>]*>([^<]+)<\/(?:[a-z]+:)?guid>/i)?.[1] ||
      ''
    link = link.trim()

    const description = stripHTML(
      getTag(content, 'description') || getTag(content, 'summary') || getTag(content, 'content')
    )

    const publishedAt =
      getTag(content, 'pubDate') ||
      getTag(content, 'published') ||
      getTag(content, 'updated') ||
      getTag(content, 'date') ||
      getTag(content, 'dc:date')

    const authorRaw = getTag(content, 'author') || getTag(content, 'dc:creator')
    const authors = authorRaw ? [stripHTML(authorRaw)] : []

    if (!title || !link) continue

    items.push({
      title,
      link,
      description: description ? description.slice(0, 600) : undefined,
      publishedAt: publishedAt ? normalizeDate(publishedAt) : undefined,
      authors,
    })
  }

  return items.slice(0, 25)
}

function getTag(block: string, tag: string): string {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  // CDATA-wrapped tag content
  const cdataMatch = block.match(
    new RegExp(`<(?:[a-z]+:)?${escaped}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*<\\/(?:[a-z]+:)?${escaped}>`, 'i')
  )
  if (cdataMatch) return cdataMatch[1].trim()

  // Plain tag content
  const regularMatch = block.match(new RegExp(`<(?:[a-z]+:)?${escaped}[^>]*>([\\s\\S]*?)<\\/(?:[a-z]+:)?${escaped}>`, 'i'))
  if (regularMatch) return regularMatch[1].trim()

  // Self-closing tag with href (Atom <link href="..."/>)
  const hrefMatch = block.match(new RegExp(`<(?:[a-z]+:)?${escaped}[^>]*href=["']([^"']+)["']`, 'i'))
  if (hrefMatch) return hrefMatch[1].trim()

  return ''
}

function stripHTML(input: string): string {
  if (!input) return ''
  return input
    .replace(/^<!\[CDATA\[/, '')
    .replace(/\]\]>$/, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeDate(raw: string): string | undefined {
  const parsed = new Date(raw)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString()
}

export async function ingestRSSSource(source: ContentSource, supabase: SupabaseClient): Promise<number> {
  console.log(`[RSS] Starting: ${source.name}`)

  try {
    const items = await fetchRSSFeed(source.url)

    console.log(`[RSS] ${source.name}: fetched ${items.length} items`)

    if (!items.length) {
      console.log(`[RSS] ${source.name}: no items returned`)
      return 0
    }

    const isOpportunity = source.stream_category === 'opportunities'
    const expiresInMs = (isOpportunity ? 90 : 30) * 24 * 60 * 60 * 1000

    let inserted = 0

    for (const item of items) {
      const text = `${item.title} ${item.description ?? ''}`
      let researchAreas = source.research_areas ?? []

      if (researchAreas.length === 0) {
        const { data } = await supabase.rpc('extract_research_areas_from_text', { p_text: text })
        researchAreas = (data as string[] | null) ?? []
      }

      const { error: insertError } = await supabase
        .from('feed_external_content')
        .upsert(
          {
            source_id: source.id,
            source_name: source.name,
            category: source.stream_category,
            content_type:
              source.stream_category === 'publications'
                ? 'paper'
                : source.stream_category === 'opportunities'
                  ? 'opportunity'
                  : 'article',
            title: item.title.slice(0, 500),
            description: item.description ?? null,
            url: item.link,
            authors: item.authors ?? [],
            research_areas: researchAreas,
            is_african_relevant: detectAfricanRelevance(text),
            relevance_signals: { source_areas: source.research_areas ?? [] },
            published_at: item.publishedAt ?? new Date().toISOString(),
            expires_at: new Date(Date.now() + expiresInMs).toISOString(),
            raw_data: { source_name: source.name },
          },
          { onConflict: 'url', ignoreDuplicates: false }
        )

      if (insertError) {
        console.error(`[RSS] ${source.name}: insert error:`, insertError.message)
      } else {
        inserted++
      }
    }

    console.log(`[RSS] ${source.name}: inserted ${inserted} items`)

    await supabase
      .from('feed_content_sources')
      .update({ last_fetched_at: new Date().toISOString() })
      .eq('id', source.id)

    return inserted
  } catch (err) {
    console.error(`[RSS] ${source.name} error:`, err)
    return 0
  }
}

const AFRICA_KEYWORDS = [
  'africa', 'african', 'nigeria', 'kenya', 'ghana', 'south africa', 'egypt',
  'ethiopia', 'tanzania', 'uganda', 'senegal', 'rwanda', 'morocco', 'algeria',
  'sub-saharan', 'sahel', 'maghreb',
]

export function detectAfricanRelevance(text: string): boolean {
  const lower = text.toLowerCase()
  return AFRICA_KEYWORDS.some(keyword => lower.includes(keyword))
}
