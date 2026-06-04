'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ── CREATE A TEAM ────────────────────────────
export async function createChallengeTeam(data: {
  challengeId: string
  teamName: string
}): Promise<{ success: boolean; teamId?: string; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    // Check user not already in a team for this challenge
    const { data: existing } = await supabase
      .from('challenge_team_members')
      .select('id')
      .eq('user_id', user.id)
      .single()
      .catch(() => ({ data: null }))

    if (existing) {
      return { 
        success: false, 
        error: 'You are already in a team for this challenge' 
      }
    }

    // Create the team
    const { data: team, error } = await supabase
      .from('challenge_teams')
      .insert({
        challenge_id: data.challengeId,
        name: data.teamName,
        leader_id: user.id,
      })
      .select('id')
      .single()

    if (error) throw error

    // Add leader as first member
    await supabase
      .from('challenge_team_members')
      .insert({
        team_id: team.id,
        user_id: user.id,
        role: 'leader',
      })

    revalidatePath(`/challenges/${data.challengeId}`)
    return { success: true, teamId: team.id }
  } catch (err: any) {
    return { success: false, error: err?.message }
  }
}

// ── INVITE TO TEAM ────────────────────────────
export async function inviteToTeam(
  teamId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    // Verify user is leader
    const { data: team } = await supabase
      .from('challenge_teams')
      .select('leader_id, challenge_id, challenge_team_members(count)')
      .eq('id', teamId)
      .single()

    if (!team || team.leader_id !== user.id)
      return { success: false, error: 'Only the team leader can invite members' }

    // Check team capacity (from challenge max_team_size)
    const { data: challenge } = await supabase
      .from('challenges')
      .select('max_team_size')
      .eq('id', team.challenge_id)
      .single()

    const memberCount = 
      (team.challenge_team_members as any)?.[0]?.count ?? 0
    if (memberCount >= (challenge?.max_team_size ?? 4))
      return { success: false, error: 'Team is at maximum capacity' }

    const { error } = await supabase
      .from('challenge_team_invites')
      .insert({
        team_id: teamId,
        invited_user_id: userId,
        invited_by: user.id,
      })

    if (error) throw error
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message }
  }
}

// ── RESPOND TO INVITE ────────────────────────
export async function respondToTeamInvite(
  inviteId: string,
  response: 'accepted' | 'declined'
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    const { data: invite } = await supabase
      .from('challenge_team_invites')
      .select('team_id, invited_user_id')
      .eq('id', inviteId)
      .single()

    if (!invite || invite.invited_user_id !== user.id)
      return { success: false, error: 'Not authorised' }

    await supabase
      .from('challenge_team_invites')
      .update({ status: response })
      .eq('id', inviteId)

    if (response === 'accepted') {
      await supabase
        .from('challenge_team_members')
        .insert({
          team_id: invite.team_id,
          user_id: user.id,
          role: 'member',
        })
    }

    revalidatePath('/challenges')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message }
  }
}

// ── SUBMIT TO CHALLENGE ──────────────────────
export async function submitToChallenge(data: {
  challengeId: string
  teamId?: string
  title: string
  abstract: string
  submissionUrl?: string
  additionalNotes?: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    // Check challenge is still open
    const { data: challenge } = await supabase
      .from('challenges')
      .select('status, submission_deadline, total_submissions')
      .eq('id', data.challengeId)
      .single()

    if (challenge?.status !== 'open')
      return { success: false, error: 'This challenge is not accepting submissions' }

    if (challenge?.submission_deadline && 
        new Date(challenge.submission_deadline) < new Date())
      return { success: false, error: 'Submission deadline has passed' }

    // Check no existing submission
    const { data: existing } = await supabase
      .from('challenge_submissions')
      .select('id')
      .eq('challenge_id', data.challengeId)
      .eq('submitter_id', user.id)
      .maybeSingle()

    if (existing)
      return { success: false, error: 'You have already submitted to this challenge' }

    const { error } = await supabase
      .from('challenge_submissions')
      .insert({
        challenge_id: data.challengeId,
        submitter_id: user.id,
        team_id: data.teamId ?? null,
        title: data.title,
        abstract: data.abstract,
        submission_url: data.submissionUrl ?? null,
        additional_notes: data.additionalNotes ?? null,
      })

    if (error) throw error

    // Increment submission count on challenge
    await supabase
      .from('challenges')
      .update({ 
        total_submissions: (challenge?.total_submissions ?? 0) + 1 
      })
      .eq('id', data.challengeId)

    // Award Akili points for submitting
    await supabase.rpc('increment_akili_score', {
      p_user_id: user.id,
      p_points: 25,
      p_dimension: 'knowledge',
      p_reason: 'challenge_submission',
    }).catch(() => {
      // If RPC doesn't exist, continue anyway
      console.log('Akili RPC not available')
    })

    revalidatePath('/challenges')
    revalidatePath(`/challenges/${data.challengeId}`)
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message }
  }
}

// ── GET CHALLENGE WITH FULL DETAILS ──────────
export async function getChallengeDetails(challengeId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: challenge } = await supabase
    .from('challenges')
    .select(`
      *,
      profiles!challenges_winner_id_fkey (
        full_name, avatar_url, university_id
      )
    `)
    .eq('id', challengeId)
    .maybeSingle()

  const { data: teams } = await supabase
    .from('challenge_teams')
    .select(`
      id, name, created_at,
      profiles!challenge_teams_leader_id_fkey (
        id, full_name, avatar_url
      ),
      challenge_team_members (
        user_id, role,
        profiles (full_name, avatar_url, university_id)
      )
    `)
    .eq('challenge_id', challengeId)

  // Current user's team (if any)
  const myTeam = teams?.find(t =>
    t.challenge_team_members?.some(
      (m: any) => m.user_id === user?.id
    )
  )

  // Current user's submission (if any)
  const { data: mySubmission } = user ? await supabase
    .from('challenge_submissions')
    .select('*')
    .eq('challenge_id', challengeId)
    .eq('submitter_id', user.id)
    .maybeSingle() : { data: null }

  // Pending invite for current user
  const { data: myInvite } = user ? await supabase
    .from('challenge_team_invites')
    .select(`
      id, status, team_id,
      challenge_teams!inner (
        name, challenge_id
      )
    `)
    .eq('invited_user_id', user.id)
    .eq('status', 'pending')
    .eq('challenge_teams.challenge_id', challengeId)
    .maybeSingle() : { data: null }

  // Winners / top submissions (public)
  const { data: winners } = await supabase
    .from('challenge_submissions')
    .select(`
      id, title, status, overall_score,
      submitted_at,
      profiles!challenge_submissions_submitter_id_fkey (
        full_name, avatar_url, university_id, is_verified
      )
    `)
    .eq('challenge_id', challengeId)
    .in('status', ['winner', 'runner_up'])
    .order('overall_score', { ascending: false })

  return { challenge, teams, myTeam, mySubmission, myInvite, winners }
}
