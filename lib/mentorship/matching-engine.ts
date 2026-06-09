'use server'

import { createClient } from '@/lib/supabase/server'

export interface MatchScore {
  mentor_profile_id: string
  user_id: string
  score: number
  breakdown: {
    research_alignment: number
    availability: number
    rating_score: number
    department_match: number
  }
  match_reasons: string[]
  // Mentor display fields attached for convenience
  id: string
  expertise_areas?: string[]
  bio?: string
  total_sessions?: number
  availability_hours?: number
  rating?: number
  tier?: number
  profile?: {
    full_name: string | null
    avatar_url: string | null
    department: string | null
    university_id: string | null
    akili_score?: number
  }
}

export async function computeMentorMatches(studentId: string): Promise<MatchScore[]> {
  const supabase = await createClient()

  const { data: student } = await supabase
    .from('profiles')
    .select('research_interests, department')
    .eq('id', studentId)
    .single()

  const interests: string[] = (student?.research_interests as string[] | null) ?? []
  const studentDept: string | null = (student?.department as string | null) ?? null

  const { data: mentors } = await supabase
    .from('mentor_profiles')
    .select(`
      id,
      user_id,
      research_areas,
      specializations,
      mentorship_areas,
      expertise_areas,
      available_slots,
      slots_used,
      rating,
      review_count,
      tier,
      bio,
      total_sessions,
      availability_hours,
      profile:profiles!mentor_profiles_user_id_fkey(
        full_name,
        avatar_url,
        department,
        university_id
      )
    `)
    .eq('is_verified', true)
    .eq('is_accepting_mentees', true)
    .neq('user_id', studentId)

  if (!mentors?.length) return []

  const { data: existing } = await supabase
    .from('mentorship_requests')
    .select('mentor_id')
    .eq('student_id', studentId)
    .in('status', ['pending', 'accepted'])

  const excluded = new Set((existing ?? []).map((r: { mentor_id: string }) => r.mentor_id))

  const results: MatchScore[] = []

  for (const mentor of mentors) {
    if (excluded.has(mentor.user_id as string)) continue

    const mentorAreas: string[] = [
      ...((mentor.research_areas as string[]) ?? []),
      ...((mentor.specializations as string[]) ?? []),
      ...((mentor.mentorship_areas as string[]) ?? []),
      ...((mentor.expertise_areas as string[]) ?? []),
    ]

    let researchScore = 0
    const matchedAreas: string[] = []

    for (const interest of interests) {
      for (const area of mentorAreas) {
        if (interest.toLowerCase() === area.toLowerCase()) {
          researchScore = 1.0
          if (!matchedAreas.includes(area)) matchedAreas.push(area)
        }
      }
    }

    // Adjacency lookup for partial matches
    if (researchScore < 1.0 && interests.length > 0 && mentorAreas.length > 0) {
      const { data: adj } = await supabase
        .from('research_area_adjacency')
        .select('area_b, similarity_score')
        .in('area_a', interests)
        .in('area_b', mentorAreas)
        .gt('similarity_score', 0.5)
        .order('similarity_score', { ascending: false })
        .limit(3)

      if (adj?.length) {
        researchScore = Math.max(researchScore, adj[0].similarity_score as number)
        matchedAreas.push(adj[0].area_b as string)
      }
    }

    const slots = (mentor.available_slots as number) ?? 0
    const used = (mentor.slots_used as number) ?? 0
    const availScore = slots > 0 ? Math.min((slots - used) / slots, 1.0) : 0
    const ratingScore = mentor.rating ? (mentor.rating as number) / 5.0 : 0.5

    const mentorProfile = mentor.profile as { department?: string | null } | null
    const deptScore = studentDept && mentorProfile?.department === studentDept ? 1.0 : 0.0

    const finalScore =
      researchScore * 0.50 +
      availScore   * 0.20 +
      ratingScore  * 0.20 +
      deptScore    * 0.10

    if (finalScore < 0.1) continue

    const reasons: string[] = []
    if (matchedAreas.length > 0) reasons.push(`Researches ${matchedAreas[0]}`)
    if (deptScore > 0) reasons.push('Same department')
    if (((mentor.rating as number) ?? 0) >= 4.0) reasons.push('Highly rated')
    if (slots - used >= 2) reasons.push('Has available slots')

    results.push({
      mentor_profile_id: mentor.id as string,
      user_id: mentor.user_id as string,
      score: finalScore,
      breakdown: {
        research_alignment: researchScore,
        availability: availScore,
        rating_score: ratingScore,
        department_match: deptScore,
      },
      match_reasons: reasons,
      id: mentor.id as string,
      expertise_areas: mentorAreas,
      bio: mentor.bio as string | undefined,
      total_sessions: mentor.total_sessions as number | undefined,
      availability_hours: mentor.availability_hours as number | undefined,
      rating: mentor.rating as number | undefined,
      tier: mentor.tier as number | undefined,
      profile: mentor.profile as MatchScore['profile'],
    })
  }

  results.sort((a, b) => b.score - a.score)
  return results
}
