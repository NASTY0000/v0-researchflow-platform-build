'use server'

import { createServiceRoleClient } from '@/lib/supabase/admin'

type AkiliDimension = 'knowledge' | 'collaboration' | 'mentorship' | 'technical'

export async function awardAkiliPoints({
  userId,
  eventType,
  points,
  dimension,
  description,
  metadata = {},
}: {
  userId: string
  eventType: string
  points: number
  dimension: AkiliDimension
  description: string
  metadata?: Record<string, unknown>
}) {
  try {
    const admin = createServiceRoleClient()
    const dimColumn = `akili_dimension_${dimension}` as const

    await admin.from('akili_score_events').insert({
      user_id: userId,
      event_type: eventType,
      points_earned: points,
      dimension,
      description,
      metadata,
    })

    const { data: profile } = await admin
      .from('profiles')
      .select(`akili_score, ${dimColumn}`)
      .eq('id', userId)
      .single()

    if (profile) {
      await admin
        .from('profiles')
        .update({
          akili_score: ((profile as Record<string, number>).akili_score || 0) + points,
          [dimColumn]: ((profile as Record<string, number>)[dimColumn] || 0) + points,
        })
        .eq('id', userId)
    }

    return { success: true }
  } catch (error) {
    // Silently fail — score errors must never break core functionality
    console.error('Akili award error:', error)
    return { error: 'Failed to award points' }
  }
}

// ── KNOWLEDGE ─────────────────────────────────────────────────────────────────

export async function postResearchIdea(userId: string, ideaId: string) {
  await awardAkiliPoints({ userId, eventType: 'postResearchIdea', points: 15, dimension: 'knowledge', description: 'Posted a new research idea', metadata: { idea_id: ideaId } })
}

export async function ideaAttracts3Applicants(userId: string, ideaId: string) {
  await awardAkiliPoints({ userId, eventType: 'ideaAttracts3Applicants', points: 25, dimension: 'knowledge', description: 'Your idea attracted 3 applicants', metadata: { idea_id: ideaId } })
}

export async function ideaFormsActiveTeam(userId: string, ideaId: string) {
  await awardAkiliPoints({ userId, eventType: 'ideaFormsActiveTeam', points: 40, dimension: 'knowledge', description: 'Your idea formed an active team', metadata: { idea_id: ideaId } })
}

export async function phaseCompleted(userId: string, projectId: string, phaseNumber: number, phaseName: string) {
  await awardAkiliPoints({ userId, eventType: 'phase_completed', points: 30, dimension: 'knowledge', description: `Completed Phase ${phaseNumber}: ${phaseName}`, metadata: { project_id: projectId, phase_number: phaseNumber } })
}

export async function allPhasesCompleted(userId: string, projectId: string) {
  await awardAkiliPoints({ userId, eventType: 'all_phases_completed', points: 75, dimension: 'knowledge', description: 'Completed all 7 research phases', metadata: { project_id: projectId } })
}

export async function submitToShowcase(userId: string, showcaseId: string) {
  await awardAkiliPoints({ userId, eventType: 'submitToShowcase', points: 60, dimension: 'knowledge', description: 'Submitted research to the showcase', metadata: { showcase_id: showcaseId } })
}

export async function showcaseApproved(userId: string, showcaseId: string) {
  await awardAkiliPoints({ userId, eventType: 'showcaseApproved', points: 100, dimension: 'knowledge', description: 'Research published to showcase', metadata: { showcase_id: showcaseId } })
}

export async function showcaseDownloaded25Times(userId: string, showcaseId: string) {
  await awardAkiliPoints({ userId, eventType: 'showcaseDownloaded25Times', points: 50, dimension: 'knowledge', description: 'Your showcase entry was downloaded 25 times', metadata: { showcase_id: showcaseId } })
}

// ── COLLABORATION ─────────────────────────────────────────────────────────────

export async function joinProjectAsCollaborator(userId: string, projectId: string) {
  await awardAkiliPoints({ userId, eventType: 'joinProjectAsCollaborator', points: 20, dimension: 'collaboration', description: 'Joined a research project', metadata: { project_id: projectId } })
}

export async function completeAssignedTask(userId: string, taskId: string) {
  await awardAkiliPoints({ userId, eventType: 'completeAssignedTask', points: 15, dimension: 'collaboration', description: 'Completed an assigned task', metadata: { task_id: taskId } })
}

export async function completeAllTasksInProject(userId: string, projectId: string) {
  await awardAkiliPoints({ userId, eventType: 'completeAllTasksInProject', points: 50, dimension: 'collaboration', description: 'Completed all tasks in a project', metadata: { project_id: projectId } })
}

export async function receive4to5StarRatingFromLead(userId: string, projectId: string) {
  await awardAkiliPoints({ userId, eventType: 'receive4to5StarRatingFromLead', points: 20, dimension: 'collaboration', description: 'Received a 4–5 star rating from project lead', metadata: { project_id: projectId } })
}

export async function collaboratedProjectReachesShowcase(userId: string, projectId: string) {
  await awardAkiliPoints({ userId, eventType: 'collaboratedProjectReachesShowcase', points: 75, dimension: 'collaboration', description: 'A project you collaborated on reached the showcase', metadata: { project_id: projectId } })
}

export async function connectionAccepted(requesterId: string, recipientId: string) {
  await Promise.all([
    awardAkiliPoints({ userId: requesterId, eventType: 'connection_accepted', points: 5, dimension: 'collaboration', description: 'Connected with a researcher' }),
    awardAkiliPoints({ userId: recipientId, eventType: 'connection_accepted', points: 5, dimension: 'collaboration', description: 'Connected with a researcher' }),
  ])
}

export async function completeMarketplaceTask(userId: string, taskId: string) {
  await awardAkiliPoints({ userId, eventType: 'completeMarketplaceTask', points: 10, dimension: 'collaboration', description: 'Completed a marketplace task', metadata: { task_id: taskId } })
}

export async function receive4to5StarOnMarketplaceTask(userId: string, taskId: string) {
  await awardAkiliPoints({ userId, eventType: 'receive4to5StarOnMarketplaceTask', points: 25, dimension: 'collaboration', description: 'Received a 4–5 star rating on a marketplace task', metadata: { task_id: taskId } })
}

// ── MENTORSHIP ────────────────────────────────────────────────────────────────

export async function acceptMentorshipRequest(mentorId: string, studentId: string, sessionId: string) {
  await Promise.all([
    awardAkiliPoints({ userId: mentorId, eventType: 'acceptMentorshipRequest', points: 15, dimension: 'mentorship', description: 'Accepted a mentorship request', metadata: { session_id: sessionId } }),
    awardAkiliPoints({ userId: studentId, eventType: 'mentorship_accepted', points: 20, dimension: 'mentorship', description: 'Mentorship request accepted', metadata: { session_id: sessionId } }),
  ])
}

export async function completeMentorSession(userId: string, sessionId: string) {
  await awardAkiliPoints({ userId, eventType: 'completeMentorSession', points: 30, dimension: 'mentorship', description: 'Completed a mentorship session', metadata: { session_id: sessionId } })
}

export async function menteeMentorSessionCompleted(userId: string, sessionId: string) {
  await awardAkiliPoints({ userId, eventType: 'mentee_session_completed', points: 15, dimension: 'mentorship', description: 'Completed a mentorship session', metadata: { session_id: sessionId } })
}

export async function menteeCompletesPhase(userId: string, projectId: string) {
  await awardAkiliPoints({ userId, eventType: 'menteeCompletesPhase', points: 20, dimension: 'mentorship', description: 'Your mentee completed a project phase', metadata: { project_id: projectId } })
}

export async function receive4to5StarSessionRating(userId: string, sessionId: string) {
  await awardAkiliPoints({ userId, eventType: 'receive4to5StarSessionRating', points: 25, dimension: 'mentorship', description: 'Received a 4–5 star session rating', metadata: { session_id: sessionId } })
}

export async function menteeSubmitsToShowcase(userId: string, showcaseId: string) {
  await awardAkiliPoints({ userId, eventType: 'menteeSubmitsToShowcase', points: 80, dimension: 'mentorship', description: 'Your mentee submitted to the showcase', metadata: { showcase_id: showcaseId } })
}

export async function postOpenResearchCall(userId: string, callId: string) {
  await awardAkiliPoints({ userId, eventType: 'postOpenResearchCall', points: 10, dimension: 'mentorship', description: 'Posted an open research call', metadata: { call_id: callId } })
}

export async function menteeEarnsExpertStatus(userId: string, menteeId: string) {
  await awardAkiliPoints({ userId, eventType: 'menteeEarnsExpertStatus', points: 50, dimension: 'mentorship', description: 'Your mentee earned expert status', metadata: { mentee_id: menteeId } })
}

// ── TECHNICAL ─────────────────────────────────────────────────────────────────

export async function completeOnboardingWithAllSkills(userId: string) {
  await awardAkiliPoints({ userId, eventType: 'completeOnboardingWithAllSkills', points: 20, dimension: 'technical', description: 'Completed onboarding with all skills filled in' })
}

export async function onboardingComplete(userId: string) {
  await awardAkiliPoints({ userId, eventType: 'onboarding_complete', points: 10, dimension: 'knowledge', description: 'Completed profile setup' })
}

export async function firstMarketplaceTaskCompleted(userId: string, taskId: string) {
  await awardAkiliPoints({ userId, eventType: 'firstMarketplaceTaskCompleted', points: 30, dimension: 'technical', description: 'Completed your first marketplace task', metadata: { task_id: taskId } })
}

export async function complete5MarketplaceTasks(userId: string) {
  await awardAkiliPoints({ userId, eventType: 'complete5MarketplaceTasks', points: 60, dimension: 'technical', description: 'Milestone: completed 5 marketplace tasks' })
}

export async function complete10MarketplaceTasks(userId: string) {
  await awardAkiliPoints({ userId, eventType: 'complete10MarketplaceTasks', points: 150, dimension: 'technical', description: 'Milestone: completed 10 marketplace tasks' })
}

export async function skillsEndorsedBy3People(userId: string) {
  await awardAkiliPoints({ userId, eventType: 'skillsEndorsedBy3People', points: 30, dimension: 'technical', description: 'Your skills were endorsed by 3 people' })
}

export async function matchedToProjectForSkills(userId: string, projectId: string) {
  await awardAkiliPoints({ userId, eventType: 'matchedToProjectForSkills', points: 10, dimension: 'technical', description: 'Matched to a project based on your skills', metadata: { project_id: projectId } })
}

export async function projectUsingSkillsReachesShowcase(userId: string, projectId: string) {
  await awardAkiliPoints({ userId, eventType: 'projectUsingSkillsReachesShowcase', points: 60, dimension: 'technical', description: 'A project using your skills reached the showcase', metadata: { project_id: projectId } })
}

export async function connectionAccepted(requesterId: string, acceptorId: string) {
  await Promise.all([
    awardAkiliPoints(requesterId, 'connectionAccepted', 5, 'Your connection request was accepted'),
    awardAkiliPoints(acceptorId, 'connectionAccepted', 5, 'You accepted a connection request'),
  ])
}

export async function onboardingComplete(userId: string) {
  await awardAkiliPoints(userId, 'onboardingComplete', 10, 'Completed onboarding')
}
