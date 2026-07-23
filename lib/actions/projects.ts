'use server'

import { createClient } from '@/lib/supabase/server'
import { phaseCompleted, allPhasesCompleted } from '@/lib/actions/akili'

export interface EvidenceAnswer {
  id: string   // question ID, e.g. 'challenges'
  q: string    // full question text
  a: string    // user's answer
}

export async function submitPhaseCompletion({
  projectId,
  phaseId,
  phaseNumber,
  phaseName,
  nextPhaseId,
  evidence,
  totalCompleted,
}: {
  projectId: string
  phaseId: string
  phaseNumber: number
  phaseName: string
  nextPhaseId?: string | null
  evidence: EvidenceAnswer[]
  totalCompleted: number
}) {
  // 1. Server-side evidence validation — at least one meaningful answer required
  const hasContent = evidence.some(e => e.a.trim().length >= 10)
  if (!hasContent) {
    return { error: 'Please provide a meaningful answer to at least one question (10+ characters).' }
  }

  // 2. Auth + membership check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: project } = await supabase
    .from('projects')
    .select('team_id')
    .eq('id', projectId)
    .single()
  if (!project) return { error: 'Project not found' }

  const { data: membership } = await supabase
    .from('team_members')
    .select('id')
    .eq('team_id', project.team_id)
    .eq('user_id', user.id)
    .single()
  if (!membership) return { error: 'Not a member of this project team' }

  // 3. Build structured storage
  const now = new Date().toISOString()

  // completion_answers: JSONB keyed by question ID (matches get_challenge_keywords() SQL)
  const completionAnswers: Record<string, string> = {}
  for (const e of evidence) {
    completionAnswers[e.id] = e.a
  }

  // completion_summary: plain text for length-based analytics
  const completionSummary = evidence
    .filter(e => e.a.trim())
    .map(e => `${e.q}\n${e.a.trim()}`)
    .join('\n\n')

  const { error: updateError } = await supabase
    .from('project_phases')
    .update({
      status: 'completed',
      completed_at: now,
      completed_by: user.id,
      completion_answers: completionAnswers,
      completion_summary: completionSummary || null,
    })
    .eq('id', phaseId)

  if (updateError) return { error: updateError.message }

  // 4. Mark next phase in_progress
  if (nextPhaseId) {
    await supabase
      .from('project_phases')
      .update({ status: 'in_progress' })
      .eq('id', nextPhaseId)
  }

  // 5. Award Akili points (fire-and-forget; errors must not block the UI)
  void phaseCompleted(user.id, projectId, phaseNumber, phaseName)
  if (totalCompleted + 1 === 7) {
    void allPhasesCompleted(user.id, projectId)
  }

  return {
    success: true,
    completedAt: now,
    completedBy: user.id,
    completionAnswers,
    completionSummary,
  }
}

export async function reopenPhase(
  projectId: string,
  phaseNumber: number,
  reason: string,
) {
  if (!reason || reason.trim().length < 20) {
    return { error: 'Please provide a reason of at least 20 characters.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Verify team membership (same pattern as verifyProjectMember in akili.ts)
  const { data: project } = await supabase
    .from('projects')
    .select('team_id')
    .eq('id', projectId)
    .single()
  if (!project) return { error: 'Project not found' }

  const { data: membership } = await supabase
    .from('team_members')
    .select('id')
    .eq('team_id', project.team_id)
    .eq('user_id', user.id)
    .single()
  if (!membership) return { error: 'Not a member of this project team' }

  // Check team lead status
  const { data: team } = await supabase
    .from('teams')
    .select('leader_id')
    .eq('id', project.team_id)
    .single()

  // Read the current phase row before modifying it
  const { data: phase } = await supabase
    .from('project_phases')
    .select('*')
    .eq('project_id', projectId)
    .eq('phase_number', phaseNumber)
    .single()
  if (!phase) return { error: 'Phase not found' }

  const isLead       = (team as { leader_id: string } | null)?.leader_id === user.id
  const isCompletedBy = phase.completed_by === user.id

  if (!isLead && !isCompletedBy) {
    return { error: 'Only the team lead or the person who completed this phase can reopen it.' }
  }

  // Archive the current completion to history before clearing it.
  // The history insert MUST succeed before we touch project_phases.
  const now = new Date().toISOString()
  const { error: historyError } = await supabase
    .from('phase_submission_history')
    .insert({
      project_id:          projectId,
      phase_number:        phase.phase_number,
      phase_name:          phase.phase_name,
      completed_by:        phase.completed_by,
      completed_at:        phase.completed_at,
      completion_summary:  phase.completion_summary,
      completion_answers:  phase.completion_answers,
      completion_file_url: (phase as Record<string, unknown>).completion_file_url ?? null,
      completion_file_name: (phase as Record<string, unknown>).completion_file_name ?? null,
      reopened_by:         user.id,
      reopened_at:         now,
      reopen_reason:       reason.trim(),
    })

  if (historyError) return { error: `Failed to save phase history: ${historyError.message}` }

  // Only after history is committed, clear the phase back to in_progress.
  //
  // We intentionally do NOT deduct or revoke Akili points here. The
  // alreadyAwarded() duplicate-check in phaseCompleted() uses
  // (user_id, eventType, related_id) — removing the akili_score_events row
  // would break that guard and allow point farming by cycling reopen →
  // re-complete. The points were legitimately earned; the reopen is a
  // quality correction, not a reversal of effort.
  const { error: updateError } = await supabase
    .from('project_phases')
    .update({
      status:               'in_progress',
      completed_at:         null,
      completed_by:         null,
      completion_summary:   null,
      completion_answers:   {},
      completion_file_url:  null,
      completion_file_name: null,
    })
    .eq('id', phase.id)

  if (updateError) return { error: updateError.message }

  return { success: true, phaseId: phase.id }
}

export async function requestToJoinProject(
  projectId: string,
  message: string,
  skillsOffered: string[],
) {
  if (!message || message.trim().length < 50) {
    return { error: 'Please provide a message of at least 50 characters.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Verify project is public and open
  const { data: project } = await supabase
    .from('projects')
    .select('id, team_id, title, is_public, is_open_to_collaborators, team:teams(leader_id)')
    .eq('id', projectId)
    .single()
  if (!project) return { error: 'Project not found' }
  if (!project.is_public || !(project as Record<string, unknown>).is_open_to_collaborators) {
    return { error: 'This project is not accepting collaboration requests.' }
  }

  // Not already a member
  const { data: membership } = await supabase
    .from('team_members')
    .select('id')
    .eq('team_id', project.team_id)
    .eq('user_id', user.id)
    .maybeSingle()
  if (membership) return { error: 'You are already a member of this project.' }

  // No existing pending request
  const { data: existing } = await supabase
    .from('project_join_requests')
    .select('id, status')
    .eq('project_id', projectId)
    .eq('requester_id', user.id)
    .maybeSingle()
  if (existing) return { error: 'You already have a request for this project.', existingStatus: existing.status }

  const { data: request, error: insertError } = await supabase
    .from('project_join_requests')
    .insert({
      project_id: projectId,
      requester_id: user.id,
      message: message.trim(),
      skills_offered: skillsOffered,
      status: 'pending',
    })
    .select('id')
    .single()
  if (insertError) return { error: insertError.message }

  // Notify team leader
  const leaderId = (project.team as { leader_id: string } | null)?.leader_id
  if (leaderId) {
    await supabase.from('notifications').insert({
      user_id: leaderId,
      type: 'system',
      title: 'New collaboration request',
      message: `Someone has requested to join "${project.title}"`,
      link: `/projects/${projectId}?tab=team`,
      is_read: false,
    })
  }

  return { success: true, requestId: request.id }
}

export async function respondToJoinRequest(
  requestId: string,
  action: 'accepted' | 'declined',
  responseMessage?: string,
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: request } = await supabase
    .from('project_join_requests')
    .select('id, project_id, requester_id, status')
    .eq('id', requestId)
    .single()
  if (!request) return { error: 'Request not found' }
  if (request.status !== 'pending') return { error: 'This request has already been responded to.' }

  const { data: project } = await supabase
    .from('projects')
    .select('team_id, title, team:teams(leader_id)')
    .eq('id', request.project_id)
    .single()
  if (!project) return { error: 'Project not found' }

  const leaderId = (project.team as { leader_id: string } | null)?.leader_id
  if (leaderId !== user.id) return { error: 'Only the team lead can respond to join requests.' }

  const now = new Date().toISOString()
  const { error: updateError } = await supabase
    .from('project_join_requests')
    .update({
      status: action,
      responded_by: user.id,
      responded_at: now,
      response_message: responseMessage?.trim() || null,
    })
    .eq('id', requestId)
  if (updateError) return { error: updateError.message }

  if (action === 'accepted') {
    const { error: memberError } = await supabase
      .from('team_members')
      .insert({ team_id: project.team_id, user_id: request.requester_id, role: 'contributor' })
    if (memberError) return { error: `Failed to add to team: ${memberError.message}` }
  }

  const notifTitle = action === 'accepted' ? 'Collaboration request accepted!' : 'Collaboration request declined'
  const notifMsg = action === 'accepted'
    ? `You've been added to "${project.title}". Welcome to the team!`
    : `Your request to join "${project.title}" was not accepted.${responseMessage ? ` Reason: ${responseMessage.trim()}` : ''}`

  await supabase.from('notifications').insert({
    user_id: request.requester_id,
    type: 'system',
    title: notifTitle,
    message: notifMsg,
    link: action === 'accepted' ? `/projects/${request.project_id}` : null,
    is_read: false,
  })

  return { success: true }
}

export async function updatePhaseNotes({
  phaseId,
  newNote,
}: {
  phaseId: string
  projectId: string
  currentNotesRaw: string | null
  newNote: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('project_phases')
    .update({ notes: newNote.trim() || null })
    .eq('id', phaseId)

  if (error) return { error: error.message }
  return { success: true, stored: newNote.trim() || null }
}
