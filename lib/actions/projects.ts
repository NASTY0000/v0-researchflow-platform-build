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
      phase_id:            phase.id,
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
