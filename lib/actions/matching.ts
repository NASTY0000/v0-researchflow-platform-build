'use server'

import { createClient } from '@/lib/supabase/server'
import { notifyMatchFound } from '@/lib/actions/email'

function calcSkillScore(
  userSkills: string[],
  lookingFor: string[],
  ideaSkills: string[],
  userInterests: string[],
  ideaTags: string[],
  sameUniversity: boolean,
  sameDept: boolean,
): { score: number; matchingSkills: string[]; matchingTags: string[] } {
  let score = 0
  const matchingSkills: string[] = []
  const matchingTags: string[] = []

  for (const skill of userSkills) {
    if (ideaSkills.includes(skill) || lookingFor.includes(skill)) {
      score += 15
      matchingSkills.push(skill)
    }
  }
  for (const interest of userInterests) {
    if (ideaTags.includes(interest)) {
      score += 10
      matchingTags.push(interest)
    }
  }
  if (sameUniversity) score += 10
  if (sameDept) score += 5

  return { score, matchingSkills, matchingTags }
}

export async function generateMatchesOnOnboarding(userId: string) {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('skills, research_interests, looking_for, university_id, department')
    .eq('id', userId)
    .single()

  if (!profile) return

  const userSkills: string[] = profile.skills || []
  const userInterests: string[] = profile.research_interests || []
  const lookingFor: string[] = profile.looking_for || []

  if (userSkills.length === 0 && userInterests.length === 0) return

  const { data: ideas } = await supabase
    .from('research_ideas')
    .select('id, author_id, skills_needed, tags, research_area, profiles!research_ideas_author_id_fkey(university_id, department)')
    .eq('status', 'open')
    .neq('author_id', userId)
    .limit(50)

  if (!ideas) return

  const inserts = []
  const thirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

  for (const idea of ideas) {
    const ideaSkills: string[] = idea.skills_needed || []
    const ideaTags: string[] = idea.tags || []
    const authorProfile = Array.isArray(idea.profiles) ? idea.profiles[0] : idea.profiles as { university_id?: string; department?: string } | null
    const sameUniversity = !!(profile.university_id && authorProfile?.university_id && profile.university_id === authorProfile.university_id)
    const sameDept = !!(profile.department && authorProfile?.department && profile.department === authorProfile.department)

    const { score, matchingSkills, matchingTags } = calcSkillScore(
      userSkills, lookingFor, ideaSkills, userInterests, ideaTags, sameUniversity, sameDept
    )

    if (score >= 20) {
      inserts.push({
        user_id: userId,
        matched_user_id: idea.author_id,
        match_type: 'idea_collaboration',
        match_score: Math.min(score, 100),
        matching_skills: matchingSkills,
        matching_tags: matchingTags,
        reason: `Skills match for research idea: ${matchingSkills.slice(0, 3).join(', ')}`,
        status: 'suggested',
        expires_at: thirtyDays,
      })
    }
  }

  if (inserts.length > 0) {
    const { data: upserted } = await supabase.from('matches').upsert(inserts, {
      onConflict: 'user_id,matched_user_id',
      ignoreDuplicates: true,
    }).select('user_id,matched_user_id,match_type,match_score')

    if (upserted && upserted.length > 0) {
      const top = upserted[0]
      notifyMatchFound(top.user_id, top.matched_user_id, top.match_type, top.match_score).catch(() => {})
    }
  }
}

export async function generateMatchesForNewIdea(ideaId: string, authorId: string) {
  const supabase = await createClient()

  const { data: idea } = await supabase
    .from('research_ideas')
    .select('skills_needed, tags, research_area')
    .eq('id', ideaId)
    .single()

  if (!idea) return

  const { data: authorProfile } = await supabase
    .from('profiles')
    .select('university_id, department')
    .eq('id', authorId)
    .single()

  const ideaSkills: string[] = idea.skills_needed || []
  const ideaTags: string[] = idea.tags || []

  if (ideaSkills.length === 0 && ideaTags.length === 0) return

  const { data: users } = await supabase
    .from('profiles')
    .select('id, skills, research_interests, looking_for, university_id, department')
    .eq('public_profile', true)
    .eq('onboarding_completed', true)
    .neq('id', authorId)
    .limit(100)

  if (!users) return

  const inserts = []
  const thirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

  for (const user of users) {
    const userSkills: string[] = user.skills || []
    const userInterests: string[] = user.research_interests || []
    const lookingFor: string[] = user.looking_for || []
    const sameUniversity = !!(user.university_id && authorProfile?.university_id && user.university_id === authorProfile.university_id)
    const sameDept = !!(user.department && authorProfile?.department && user.department === authorProfile.department)

    const { score, matchingSkills, matchingTags } = calcSkillScore(
      userSkills, lookingFor, ideaSkills, userInterests, ideaTags, sameUniversity, sameDept
    )

    if (score >= 20) {
      inserts.push({
        user_id: user.id,
        matched_user_id: authorId,
        match_type: 'idea_collaboration',
        match_score: Math.min(score, 100),
        matching_skills: matchingSkills,
        matching_tags: matchingTags,
        reason: `Skills match for research idea: ${matchingSkills.slice(0, 3).join(', ')}`,
        status: 'suggested',
        expires_at: thirtyDays,
      })
    }
  }

  if (inserts.length > 0) {
    await supabase.from('matches').upsert(inserts, {
      onConflict: 'user_id,matched_user_id',
      ignoreDuplicates: true,
    })
  }
}
