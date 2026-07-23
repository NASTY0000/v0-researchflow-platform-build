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
