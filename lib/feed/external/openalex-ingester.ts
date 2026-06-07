import { createClient } from '@/lib/supabase/server'
import { detectAfricanRelevance } from './rss-ingester'

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

export interface OpenAlexWork {
  id: string
  title: string
  abstract_inverted_index?: Record<string, number[]> | null
  authorships?: { author: { display_name: string } }[]
  primary_location?: { source?: { display_name?: string | null } | null } | null
  cited_by_count?: number
  publication_date?: string
  doi?: string | null
  concepts?: { display_name: string }[]
}

// Maps known platform research areas to OpenAlex concept IDs
const CONCEPT_ID_MAP: Record<string, string> = {
  'Medicine': 'C71924100',
  'Biology': 'C86803240',
  'Chemistry': 'C185592680',
  'Physics': 'C121332964',
  'Computer Science': 'C41008148',
  'Mathematics': 'C33923547',
  'Engineering': 'C127413603',
  'Environmental Science': 'C39432304',
  'Psychology': 'C15744967',
  'Economics': 'C162324750',
  'Sociology': 'C144024400',
  'Political Science': 'C17744445',
  'Public Health': 'C512399662',
  'Agricultural Science': 'C2780820201',
  'Materials Science': 'C192562407',
  'Geology': 'C127313418',
  'Neuroscience': 'C169760540',
  'Genetics': 'C54355233',
  'Education': 'C19417346',
  'History': 'C95457728',
}

const OPENALEX_BASE = 'https://api.openalex.org/works'
const USER_AGENT_MAILTO = 'mailto:research@researchflow.app'

export function reconstructAbstract(invertedIndex?: Record<string, number[]> | null): string | undefined {
  if (!invertedIndex) return undefined

  const positioned: { word: string; pos: number }[] = []
  for (const [word, positions] of Object.entries(invertedIndex)) {
    for (const pos of positions) positioned.push({ word, pos })
  }
  if (positioned.length === 0) return undefined

  positioned.sort((a, b) => a.pos - b.pos)
  return positioned.map(p => p.word).join(' ')
}

export async function fetchOpenAlexPapers(researchAreas: string[], daysBack = 7): Promise<OpenAlexWork[]> {
  const conceptIds = researchAreas
    .map(area => CONCEPT_ID_MAP[area])
    .filter((id): id is string => Boolean(id))

  if (conceptIds.length === 0) return []

  const fromDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const filter = `concepts.id:${conceptIds.slice(0, 5).join('|')},from_publication_date:${fromDate}`

  const url = `${OPENALEX_BASE}?filter=${encodeURIComponent(filter)}&sort=cited_by_count:desc&per-page=25&${USER_AGENT_MAILTO}`

  const res = await fetch(url, { next: { revalidate: 3600 } })
  if (!res.ok) {
    throw new Error(`OpenAlex fetch failed (${res.status})`)
  }

  const json = await res.json()
  return (json.results as OpenAlexWork[]) ?? []
}

export async function ingestOpenAlex(researchAreas: string[], supabase: SupabaseClient): Promise<number> {
  if (researchAreas.length === 0) return 0

  let papers: OpenAlexWork[]
  try {
    papers = await fetchOpenAlexPapers(researchAreas)
  } catch (err) {
    console.error('OpenAlex ingestion failed:', err)
    return 0
  }
  if (papers.length === 0) return 0

  const rows = papers
    .map(work => {
      const abstract = reconstructAbstract(work.abstract_inverted_index)
      const authors = (work.authorships ?? []).map(a => a.author.display_name).slice(0, 6)
      const journal = work.primary_location?.source?.display_name ?? undefined
      const url = work.doi ? `https://doi.org/${work.doi.replace(/^https?:\/\/doi\.org\//, '')}` : work.id
      const matchedAreas = (work.concepts ?? [])
        .map(c => c.display_name)
        .filter(name => Object.keys(CONCEPT_ID_MAP).includes(name))

      const text = `${work.title} ${abstract ?? ''}`

      return {
        stream_category: 'publications',
        title: work.title,
        description: abstract ? abstract.slice(0, 1000) : null,
        url,
        authors,
        journal: journal ?? null,
        citation_count: work.cited_by_count ?? 0,
        research_areas: matchedAreas.length ? matchedAreas : researchAreas.slice(0, 3),
        is_african_relevant: detectAfricanRelevance(text),
        published_at: work.publication_date ?? null,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        raw_data: { source_name: 'OpenAlex', openalex_id: work.id },
      }
    })
    .filter(row => row.title && row.url)

  if (rows.length === 0) return 0

  const { error, count } = await supabase
    .from('feed_external_content')
    .upsert(rows, { onConflict: 'url', ignoreDuplicates: true, count: 'exact' })

  if (error) {
    console.error('Failed to upsert OpenAlex content:', error.message)
    return 0
  }

  return count ?? rows.length
}
