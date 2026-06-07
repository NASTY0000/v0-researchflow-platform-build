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

const USER_AGENT = 'ResearchFlowBot/1.0 (+https://researchflow.app; feed ingestion)'

export async function fetchRSSFeed(url: string): Promise<RSSItem[]> {
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/rss+xml, application/atom+xml, text/xml' },
    next: { revalidate: 3600 },
  })

  if (!res.ok) {
    throw new Error(`RSS fetch failed (${res.status}): ${url}`)
  }

  const xml = await res.text()
  return parseRSSXML(xml)
}

export function parseRSSXML(xml: string): RSSItem[] {
  const items: RSSItem[] = []

  // RSS <item> and Atom <entry> blocks
  const blocks = xml.match(/<(item|entry)[\s\S]*?<\/(item|entry)>/gi) ?? []

  for (const block of blocks) {
    const title = stripHTML(extractTag(block, 'title'))
    const description = stripHTML(
      extractTag(block, 'description') || extractTag(block, 'summary') || extractTag(block, 'content')
    )

    let link = extractTag(block, 'link')
    if (!link) {
      const linkHrefMatch = block.match(/<link[^>]*href=["']([^"']+)["'][^>]*\/?>/i)
      if (linkHrefMatch) link = linkHrefMatch[1]
    }
    link = link.trim()

    const publishedAt =
      extractTag(block, 'pubDate') ||
      extractTag(block, 'published') ||
      extractTag(block, 'updated') ||
      extractTag(block, 'dc:date')

    const authorRaw = extractTag(block, 'author') || extractTag(block, 'dc:creator')
    const authors = authorRaw ? [stripHTML(authorRaw)] : []

    if (!title || !link) continue

    items.push({
      title,
      link,
      description: description || undefined,
      publishedAt: publishedAt ? normalizeDate(publishedAt) : undefined,
      authors,
    })
  }

  return items
}

function extractTag(block: string, tag: string): string {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = block.match(new RegExp(`<${escaped}[^>]*>([\\s\\S]*?)<\\/${escaped}>`, 'i'))
  if (!match) return ''
  return match[1]
    .replace(/^<!\[CDATA\[/, '')
    .replace(/\]\]>$/, '')
    .trim()
}

function stripHTML(input: string): string {
  if (!input) return ''
  return input
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
  const items = await fetchRSSFeed(source.url)
  if (items.length === 0) return 0

  const isOpportunity = source.stream_category === 'opportunities'
  const expiresInMs = (isOpportunity ? 90 : 30) * 24 * 60 * 60 * 1000

  const rows = await Promise.all(
    items.slice(0, 50).map(async item => {
      const text = `${item.title} ${item.description ?? ''}`
      let researchAreas = source.research_areas ?? []

      if (researchAreas.length === 0) {
        const { data } = await supabase.rpc('extract_research_areas_from_text', { p_text: text })
        researchAreas = (data as string[] | null) ?? []
      }

      return {
        source_id: source.id,
        category: source.stream_category,
        title: item.title,
        description: item.description ?? null,
        url: item.link,
        authors: item.authors ?? [],
        research_areas: researchAreas,
        is_african_relevant: detectAfricanRelevance(text),
        published_at: item.publishedAt ?? null,
        expires_at: new Date(Date.now() + expiresInMs).toISOString(),
        raw_data: { source_name: source.name },
      }
    })
  )

  const { error, count } = await supabase
    .from('feed_external_content')
    .upsert(rows, { onConflict: 'url', ignoreDuplicates: true, count: 'exact' })

  if (error) {
    console.error(`Failed to upsert content for source ${source.name}:`, error.message)
    return 0
  }

  await supabase
    .from('feed_content_sources')
    .update({ last_fetched_at: new Date().toISOString() })
    .eq('id', source.id)

  return count ?? rows.length
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
