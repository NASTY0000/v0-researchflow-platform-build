import { createClient } from '@/lib/supabase/server'
import type { ContentItem } from './scoring-engine'

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

interface FetchOptions {
  userId: string
  researchInterests?: string[]
}

export async function fetchCandidateContent(
  opts: FetchOptions,
  supabase: SupabaseClient
): Promise<ContentItem[]> {
  const items: ContentItem[] = []

  const [ideasRes, grantsRes, challengesRes, projectsRes] = await Promise.all([
    // Ideas — research_area is a string (singular)
    supabase
      .from('research_ideas')
      .select('id, title, description, research_area, tags, created_at, author_id')
      .eq('status', 'open')
      .neq('author_id', opts.userId)
      .order('created_at', { ascending: false })
      .limit(25),

    // Grants — research_areas is an array
    supabase
      .from('grants')
      .select('id, title, description, research_areas, deadline, created_at, eligibility')
      .or('deadline.is.null,deadline.gte.' + new Date().toISOString())
      .order('deadline', { ascending: true, nullsFirst: false })
      .limit(20),

    // Challenges — research_areas is an array, deadline is submission_deadline
    supabase
      .from('challenges')
      .select('id, title, description, research_areas, difficulty, submission_deadline, created_at')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(15),

    // Projects — research_area is a string (singular), no owner_id
    supabase
      .from('projects')
      .select('id, title, description, research_area, created_at, target_end_date')
      .eq('status', 'active')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(15),
  ])

  // Normalise ideas
  for (const idea of (ideasRes.data ?? [])) {
    items.push({
      id: idea.id,
      type: 'idea',
      title: idea.title,
      description: idea.description ?? undefined,
      research_areas: idea.research_area ? [idea.research_area] : [],
      tags: idea.tags ?? [],
      created_at: idea.created_at,
      author_id: idea.author_id,
      raw_data: idea as Record<string, unknown>,
    })
  }

  // Normalise grants
  for (const grant of (grantsRes.data ?? [])) {
    items.push({
      id: grant.id,
      type: 'grant',
      title: grant.title,
      description: grant.description ?? undefined,
      research_areas: (grant.research_areas as string[] | null) ?? [],
      created_at: grant.created_at,
      deadline: grant.deadline ?? undefined,
      target_levels: (grant.eligibility as string[] | null) ?? [],
      raw_data: grant as Record<string, unknown>,
    })
  }

  // Normalise challenges
  for (const challenge of (challengesRes.data ?? [])) {
    items.push({
      id: challenge.id,
      type: 'challenge',
      title: challenge.title,
      description: challenge.description ?? undefined,
      research_areas: (challenge.research_areas as string[] | null) ?? [],
      created_at: challenge.created_at,
      deadline: challenge.submission_deadline ?? undefined,
      difficulty_level: challenge.difficulty ?? undefined,
      raw_data: challenge as Record<string, unknown>,
    })
  }

  // Normalise projects
  for (const project of (projectsRes.data ?? [])) {
    items.push({
      id: project.id,
      type: 'project',
      title: project.title,
      description: project.description ?? undefined,
      research_areas: project.research_area ? [project.research_area] : [],
      created_at: project.created_at,
      deadline: project.target_end_date ?? undefined,
      raw_data: project as Record<string, unknown>,
    })
  }

  return items
}
