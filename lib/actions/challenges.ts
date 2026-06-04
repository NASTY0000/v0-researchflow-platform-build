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

  const { data: challenge } = await supabase
    .from('challenges')
    .select('id, status')
    .eq('id', data.challengeId)
    .single()
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

  const { data: challenge } = await supabase
    .from('challenges')
    .select('status, max_team_size')
    .eq('id', team.challenge_id)
    .single()
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

  const { data: challenge } = await supabase
    .from('challenges')
    .select('id, title, status, submission_deadline, akili_reward, submission_count')
    .eq('id', data.challengeId)
    .single()
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

  await supabase
    .from('challenges')
    .update({ submission_count: (challenge.submission_count || 0) + 1 })
    .eq('id', data.challengeId)

  await awardAkiliPoints({
    userId: user.id,
    eventType: 'challenge_submitted',
    points: challenge.akili_reward || 500,
    dimension: 'impact' as never,
    description: `Submitted to challenge: ${challenge.title.slice(0, 60)}`,
  })

  return { success: true }
}

export async function getChallengeTeams(challengeId: string): Promise<ChallengeTeam[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('challenge_teams')
    .select('id, challenge_id, name, description, leader_id, is_open, created_at, challenge_team_members(user_id, role, profiles(full_name, avatar_url))')
    .eq('challenge_id', challengeId)
    .order('created_at', { ascending: true })

  if (!data) return []

  type RawMember = { user_id: string; role: string; profiles: { full_name: string | null; avatar_url: string | null } }
  return data.map(t => ({
    id: t.id,
    challenge_id: t.challenge_id,
    name: t.name,
    description: t.description,
    leader_id: t.leader_id,
    is_open: t.is_open,
    created_at: t.created_at,
    member_count: (t.challenge_team_members as unknown as RawMember[]).length,
    members: (t.challenge_team_members as unknown as RawMember[]).map(m => ({
      user_id: m.user_id,
      role: m.role,
      profile: m.profiles,
    })),
  }))
}

export async function getChallengeSubmissions(challengeId: string): Promise<ChallengeSubmission[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('challenge_submissions')
    .select('id, challenge_id, author_id, title, abstract, team_id, submission_url, additional_notes, status, innovation_score, feasibility_score, impact_score, total_score, judge_notes, is_winner, created_at, profiles(full_name, avatar_url, university_name), challenge_teams(name)')
    .eq('challenge_id', challengeId)
    .order('is_winner', { ascending: false })
    .order('total_score', { ascending: false, nullsFirst: false })

  if (!data) return []

  return data.map(s => ({
    id: s.id,
    challenge_id: s.challenge_id,
    author_id: s.author_id,
    title: s.title,
    abstract: s.abstract,
    team_id: s.team_id,
    submission_url: s.submission_url,
    additional_notes: s.additional_notes,
    status: s.status,
    innovation_score: s.innovation_score,
    feasibility_score: s.feasibility_score,
    impact_score: s.impact_score,
    total_score: s.total_score,
    judge_notes: s.judge_notes,
    is_winner: s.is_winner,
    created_at: s.created_at,
    author: s.profiles as unknown as { full_name: string | null; avatar_url: string | null; university_name: string | null },
    team: s.challenge_teams as unknown as { name: string } | null,
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
    .select('id, challenge_id, name, description, leader_id, is_open, created_at, challenge_team_members(user_id, role, profiles(full_name, avatar_url))')
    .eq('challenge_id', challengeId)
    .in('id', teamIds)
    .maybeSingle()

  if (!team) return null

  type RawMember = { user_id: string; role: string; profiles: { full_name: string | null; avatar_url: string | null } }
  return {
    id: team.id,
    challenge_id: team.challenge_id,
    name: team.name,
    description: team.description,
    leader_id: team.leader_id,
    is_open: team.is_open,
    created_at: team.created_at,
    member_count: (team.challenge_team_members as unknown as RawMember[]).length,
    members: (team.challenge_team_members as unknown as RawMember[]).map(m => ({
      user_id: m.user_id,
      role: m.role,
      profile: m.profiles,
    })),
  }
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

  const { data: challenge } = await supabase
    .from('challenges')
    .select('title, akili_reward')
    .eq('id', data.challengeId)
    .single()
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
      points: (challenge.akili_reward || 500) * 2,
      dimension: 'impact' as never,
      description: `Won challenge: ${challenge.title.slice(0, 60)}`,
    })
  }

  return { success: true }
}
