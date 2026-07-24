'use server'

import { createClient } from '@/lib/supabase/server'
import { awardAkiliPoints } from '@/lib/actions/akili'

export interface ChallengeTeam {
  id: string
  challenge_id: string
  name: string
  description: string | null
  leader_id: string
  is_open: boolean
  created_at: string
  member_count?: number
  members?: { user_id: string; role: string; profile: { full_name: string | null; avatar_url: string | null } }[]
}

export interface ChallengeSubmission {
  id: string
  challenge_id: string
  author_id: string
  title: string | null
  abstract: string | null
  team_id: string | null
  submission_url: string | null
  additional_notes: string | null
  status: string
  innovation_score: number | null
  feasibility_score: number | null
  impact_score: number | null
  total_score: number | null
  judge_notes: string | null
  is_winner: boolean
  created_at: string
  author?: { full_name: string | null; avatar_url: string | null; university_name: string | null }
  team?: { name: string } | null
}

export async function createChallengeTeam(data: {
  challengeId: string
  name: string
  description?: string
}): Promise<{ success: boolean; teamId?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { data: challenge, error: challengeError } = await supabase
    .from('challenges')
    .select('*')
    .eq('id', data.challengeId)
    .maybeSingle()
  if (challengeError) return { success: false, error: `Could not load challenge: ${challengeError.message}` }
  if (!challenge || challenge.status !== 'open') return { success: false, error: 'Challenge is not open' }

  // Check existing membership in this challenge
  const { data: memberships } = await supabase
    .from('challenge_team_members')
    .select('team_id')
    .eq('user_id', user.id)
  const teamIds = (memberships || []).map(m => m.team_id)

  if (teamIds.length > 0) {
    const { data: conflictTeam } = await supabase
      .from('challenge_teams')
      .select('id')
      .eq('challenge_id', data.challengeId)
      .in('id', teamIds)
      .maybeSingle()
    if (conflictTeam) return { success: false, error: 'You are already in a team for this challenge' }
  }

  const { data: team, error: teamError } = await supabase
    .from('challenge_teams')
    .insert({ challenge_id: data.challengeId, name: data.name.trim(), description: data.description?.trim() || null, leader_id: user.id })
    .select('id')
    .single()
  if (teamError || !team) return { success: false, error: teamError?.message || 'Failed to create team' }

  await supabase.from('challenge_team_members').insert({ team_id: team.id, user_id: user.id, role: 'leader' })

  return { success: true, teamId: team.id }
}

export async function joinChallengeTeam(teamId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { data: team } = await supabase
    .from('challenge_teams')
    .select('id, challenge_id, is_open, leader_id')
    .eq('id', teamId)
    .single()
  if (!team) return { success: false, error: 'Team not found' }
  if (!team.is_open) return { success: false, error: 'This team is not accepting members' }

  const { data: challenge, error: challengeError } = await supabase
    .from('challenges')
    .select('*')
    .eq('id', team.challenge_id)
    .maybeSingle()
  if (challengeError) return { success: false, error: `Could not load challenge: ${challengeError.message}` }
  if (!challenge || challenge.status !== 'open') return { success: false, error: 'Challenge is closed' }

  // Check existing membership in this challenge
  const { data: memberships } = await supabase
    .from('challenge_team_members')
    .select('team_id')
    .eq('user_id', user.id)
  const teamIds = (memberships || []).map(m => m.team_id)

  if (teamIds.length > 0) {
    const { data: conflictTeam } = await supabase
      .from('challenge_teams')
      .select('id')
      .eq('challenge_id', team.challenge_id)
      .in('id', teamIds)
      .maybeSingle()
    if (conflictTeam) return { success: false, error: 'Already in a team for this challenge' }
  }

  const { count } = await supabase
    .from('challenge_team_members')
    .select('id', { count: 'exact', head: true })
    .eq('team_id', teamId)
  if (count !== null && challenge.max_team_size && count >= challenge.max_team_size) {
    return { success: false, error: 'Team is full' }
  }

  const { error } = await supabase.from('challenge_team_members').insert({ team_id: teamId, user_id: user.id, role: 'member' })
  if (error) return { success: false, error: error.message }

  return { success: true }
}

export async function submitToChallenge(data: {
  challengeId: string
  title: string
  abstract: string
  teamId?: string
  submissionUrl?: string
  additionalNotes?: string
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { data: challenge, error: challengeError } = await supabase
    .from('challenges')
    .select('*')
    .eq('id', data.challengeId)
    .maybeSingle()
  if (challengeError) return { success: false, error: `Could not load challenge: ${challengeError.message}` }
  if (!challenge) return { success: false, error: 'Challenge not found' }
  if (challenge.status && challenge.status !== 'open') return { success: false, error: 'Challenge is not accepting submissions' }
  if (challenge.submission_deadline && new Date(challenge.submission_deadline) < new Date()) {
    return { success: false, error: 'Submission deadline has passed' }
  }

  const { data: existing } = await supabase
    .from('challenge_submissions')
    .select('id')
    .eq('challenge_id', data.challengeId)
    .eq('author_id', user.id)
    .maybeSingle()
  if (existing) return { success: false, error: 'You have already submitted to this challenge' }

  const { error: insertError } = await supabase.from('challenge_submissions').insert({
    challenge_id: data.challengeId,
    author_id: user.id,
    title: data.title.trim(),
    abstract: data.abstract.trim(),
    team_id: data.teamId || null,
    submission_url: data.submissionUrl?.trim() || null,
    additional_notes: data.additionalNotes?.trim() || null,
    status: 'submitted',
  })
  if (insertError) return { success: false, error: insertError.message }

  // Keep the denormalized counter in sync; never fail the submission over it
  // (older deployments may lack the submission_count column entirely).
  try {
    const { count } = await supabase
      .from('challenge_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('challenge_id', data.challengeId)
    if (count !== null) {
      await supabase.from('challenges').update({ submission_count: count }).eq('id', data.challengeId)
    }
  } catch {}

  await awardAkiliPoints({
    userId: user.id,
    eventType: 'challenge_submitted',
    points: 25,
    dimension: 'knowledge',
    description: `Submitted to challenge: ${challenge.title.slice(0, 60)}`,
  })

  return { success: true }
}

// Assemble teams + members + profiles with plain queries. Nested selects
// (challenge_team_members(..., profiles(...))) depend on FK relationships that
// are missing in older database schemas and make the whole query fail.
async function assembleTeams(
  supabase: Awaited<ReturnType<typeof createClient>>,
  teams: { id: string; challenge_id: string; name: string; description: string | null; leader_id: string; is_open: boolean; created_at: string }[],
): Promise<ChallengeTeam[]> {
  if (teams.length === 0) return []

  const { data: members } = await supabase
    .from('challenge_team_members')
    .select('team_id, user_id, role')
    .in('team_id', teams.map(t => t.id))

  const userIds = [...new Set((members || []).map(m => m.user_id))]
  const { data: profiles } = userIds.length
    ? await supabase.from('profiles').select('id, full_name, avatar_url').in('id', userIds)
    : { data: [] }

  const profileById = new Map((profiles || []).map(p => [p.id, p]))

  return teams.map(t => {
    const teamMembers = (members || []).filter(m => m.team_id === t.id)
    return {
      ...t,
      member_count: teamMembers.length,
      members: teamMembers.map(m => ({
        user_id: m.user_id,
        role: m.role,
        profile: {
          full_name: profileById.get(m.user_id)?.full_name ?? null,
          avatar_url: profileById.get(m.user_id)?.avatar_url ?? null,
        },
      })),
    }
  })
}

export async function getChallengeTeams(challengeId: string): Promise<ChallengeTeam[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('challenge_teams')
    .select('id, challenge_id, name, description, leader_id, is_open, created_at')
    .eq('challenge_id', challengeId)
    .order('created_at', { ascending: true })

  return assembleTeams(supabase, data || [])
}

export async function getChallengeSubmissions(challengeId: string): Promise<ChallengeSubmission[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('challenge_submissions')
    .select('id, challenge_id, author_id, title, abstract, team_id, submission_url, additional_notes, status, innovation_score, feasibility_score, impact_score, total_score, judge_notes, is_winner, created_at')
    .eq('challenge_id', challengeId)
    .order('is_winner', { ascending: false })
    .order('total_score', { ascending: false, nullsFirst: false })

  if (!data || data.length === 0) return []

  const authorIds = [...new Set(data.map(s => s.author_id).filter(Boolean))]
  const teamIds = [...new Set(data.map(s => s.team_id).filter(Boolean))]

  const [profilesRes, teamsRes] = await Promise.all([
    authorIds.length
      ? supabase.from('profiles').select('id, full_name, avatar_url, university_name').in('id', authorIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string | null; avatar_url: string | null; university_name: string | null }[] }),
    teamIds.length
      ? supabase.from('challenge_teams').select('id, name').in('id', teamIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ])

  const profileById = new Map((profilesRes.data || []).map(p => [p.id, p]))
  const teamById = new Map((teamsRes.data || []).map(t => [t.id, t]))

  return data.map(s => ({
    ...s,
    author: profileById.get(s.author_id) ?? { full_name: null, avatar_url: null, university_name: null },
    team: s.team_id ? (teamById.get(s.team_id) ?? null) : null,
  }))
}

export async function getUserTeamForChallenge(challengeId: string): Promise<ChallengeTeam | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: memberships } = await supabase
    .from('challenge_team_members')
    .select('team_id')
    .eq('user_id', user.id)
  const teamIds = (memberships || []).map(m => m.team_id)
  if (!teamIds.length) return null

  const { data: team } = await supabase
    .from('challenge_teams')
    .select('id, challenge_id, name, description, leader_id, is_open, created_at')
    .eq('challenge_id', challengeId)
    .in('id', teamIds)
    .maybeSingle()

  if (!team) return null

  const assembled = await assembleTeams(supabase, [team])
  return assembled[0] ?? null
}

export async function declareChallengeWinner(data: {
  challengeId: string
  winnerId?: string
  winnerTeamId?: string
  submissionId: string
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return { success: false, error: 'Admin only' }

  const { data: challenge, error: challengeError } = await supabase
    .from('challenges')
    .select('*')
    .eq('id', data.challengeId)
    .maybeSingle()
  if (challengeError) return { success: false, error: `Could not load challenge: ${challengeError.message}` }
  if (!challenge) return { success: false, error: 'Challenge not found' }

  await supabase
    .from('challenges')
    .update({ winner_id: data.winnerId || null, winner_team_id: data.winnerTeamId || null, status: 'completed', featured_in_showcase: true })
    .eq('id', data.challengeId)

  await supabase
    .from('challenge_submissions')
    .update({ is_winner: true, status: 'winner' })
    .eq('id', data.submissionId)

  if (data.winnerId) {
    await awardAkiliPoints({
      userId: data.winnerId,
      eventType: 'challenge_won',
      points: 150,
      dimension: 'knowledge',
      description: `Won challenge: ${challenge.title.slice(0, 60)}`,
    })
  }

  return { success: true }
}
