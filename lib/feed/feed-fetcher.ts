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

  const [ideasRes, grantsRes, challengesRes, projectsRes, mentorsRes] = await Promise.all([
    // research_ideas — research_area is singular string, filter by status not is_public
    supabase
      .from('research_ideas')
      .select('id, title, description, research_area, tags, created_at, author_id')
      .eq('status', 'open')
      .neq('author_id', opts.userId)
      .order('created_at', { ascending: false })
      .limit(20),

    // grants — research_areas is array, eligibility is array (not eligibility_levels)
    supabase
      .from('grants')
      .select('id, title, description, funder, research_areas, eligibility, deadline, amount_min, amount_max, currency, created_at')
      .eq('is_active', true)
      .or('deadline.is.null,deadline.gte.' + new Date().toISOString())
      .order('deadline', { ascending: true, nullsFirst: false })
      .limit(20),

    // challenges — deadline column is submission_deadline
    supabase
      .from('challenges')
      .select('id, title, description, research_areas, difficulty, submission_deadline, created_at')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(15),

    // projects — research_area is singular string, is_public exists
    supabase
      .from('projects')
      .select('id, title, description, research_area, status, is_public, created_at, target_end_date, team_id')
      .eq('status', 'active')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(15),

    // mentor_profiles — uses is_accepting_mentees filter, expertise_areas column
    supabase
      .from('mentor_profiles')
      .select(`
        id,
        user_id,
        expertise_areas,
        specializations,
        mentorship_areas,
        available_slots,
        slots_used,
        rating,
        created_at,
        profiles!mentor_profiles_user_id_fkey(
          full_name,
          avatar_url,
          university_id,
          department
        )
      `)
      .eq('is_accepting_mentees', true)
      .gt('available_slots', 0)
      .neq('user_id', opts.userId)
      .order('rating', { ascending: false })
      .limit(10),
  ])

  // Normalise research_ideas (research_area is a singular string → wrap in array)
  for (const idea of (ideasRes.data ?? [])) {
    items.push({
      id: idea.id,
      type: 'idea',
      title: idea.title,
      description: idea.description ?? undefined,
      research_areas: idea.research_area ? [idea.research_area] : [],
      tags: (idea.tags as string[] | null) ?? [],
      created_at: idea.created_at,
      author_id: idea.author_id,
      raw_data: idea as Record<string, unknown>,
    })
  }

  // Normalise grants (research_areas is array, eligibility for target levels)
  for (const grant of (grantsRes.data ?? [])) {
    const funderPrefix = grant.funder ? `${grant.funder} — ` : ''
    items.push({
      id: grant.id,
      type: 'grant',
      title: grant.title,
      description: grant.description
        ? `${funderPrefix}${grant.description}`
        : grant.funder ?? undefined,
      research_areas: (grant.research_areas as string[] | null) ?? [],
      created_at: grant.created_at,
      deadline: grant.deadline ?? undefined,
      target_levels: (grant.eligibility as string[] | null) ?? [],
      raw_data: grant as Record<string, unknown>,
    })
  }

  // Normalise challenges (submission_deadline → deadline in ContentItem)
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

  // Normalise projects (research_area is singular string → wrap in array)
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

  // Normalise mentor_profiles
  // Combine expertise_areas + specializations + mentorship_areas for scoring
  for (const mentor of (mentorsRes.data ?? [])) {
    type MentorProfile = {
      full_name: string | null
      avatar_url: string | null
      university_id: string | null
      department: string | null
    }
    const profile = mentor.profiles as MentorProfile | null

    const allAreas = [
      ...((mentor.expertise_areas as string[] | null) ?? []),
      ...((mentor.specializations as string[] | null) ?? []),
      ...((mentor.mentorship_areas as string[] | null) ?? []),
    ]
    const uniqueAreas = [...new Set(allAreas)]

    items.push({
      id: mentor.id,
      type: 'mentor',
      title: profile?.full_name ?? 'Research Mentor',
      description: uniqueAreas.slice(0, 3).join(' · ') || profile?.department || undefined,
      research_areas: uniqueAreas,
      created_at: mentor.created_at,
      author_id: mentor.user_id,
      university_id: profile?.university_id ?? undefined,
      raw_data: {
        ...mentor,
        _profile: profile,
      } as Record<string, unknown>,
    })
  }

  return items
}
