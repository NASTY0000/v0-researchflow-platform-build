'use server'

import { createClient } from '@/lib/supabase/server'
import { getDimensionForEvent } from '@/lib/utils/akili'

export async function awardAkiliPoints(
  userId: string,
  eventType: string,
  points: number,
  description: string,
  relatedId?: string,
) {
  try {
    const supabase = await createClient()
    const dimension = getDimensionForEvent(eventType)
    const dimensionField = `akili_dimension_${dimension}` as const

    await supabase.from('akili_score_events').insert({
      user_id: userId,
      event_type: eventType,
      points_earned: points,
      description,
      related_id: relatedId || null,
    })

    const { data: profile } = await supabase
      .from('profiles')
      .select('akili_score, akili_dimension_knowledge, akili_dimension_collaboration, akili_dimension_mentorship, akili_dimension_technical')
      .eq('id', userId)
      .single()

    if (profile) {
      await supabase
        .from('profiles')
        .update({
          akili_score: ((profile as Record<string, number>)['akili_score'] || 0) + points,
          [dimensionField]: ((profile as Record<string, number>)[dimensionField] || 0) + points,
        })
        .eq('id', userId)
    }
  } catch {
    // Silently fail — akili score errors must never break core functionality
  }
}

// ── KNOWLEDGE ─────────────────────────────────────────────────────────────────

export async function postResearchIdea(userId: string, ideaId: string) {
  await awardAkiliPoints(userId, 'postResearchIdea', 15, 'Posted a new research idea', ideaId)
}

export async function ideaAttracts3Applicants(userId: string, ideaId: string) {
  await awardAkiliPoints(userId, 'ideaAttracts3Applicants', 25, 'Your idea attracted 3 applicants', ideaId)
}

export async function ideaFormsActiveTeam(userId: string, ideaId: string) {
  await awardAkiliPoints(userId, 'ideaFormsActiveTeam', 40, 'Your idea formed an active team', ideaId)
}

export async function completeLiteratureReview(userId: string, projectId: string) {
  await awardAkiliPoints(userId, 'completeLiteratureReview', 30, 'Completed the literature review phase', projectId)
}

export async function submitToShowcase(userId: string, showcaseId: string) {
  await awardAkiliPoints(userId, 'submitToShowcase', 60, 'Submitted research to the showcase', showcaseId)
}

export async function showcaseApproved(userId: string, showcaseId: string) {
  await awardAkiliPoints(userId, 'showcaseApproved', 100, 'Showcase entry approved', showcaseId)
}

export async function showcaseDownloaded25Times(userId: string, showcaseId: string) {
  await awardAkiliPoints(userId, 'showcaseDownloaded25Times', 50, 'Your showcase entry was downloaded 25 times', showcaseId)
}

// ── COLLABORATION ─────────────────────────────────────────────────────────────

export async function joinProjectAsCollaborator(userId: string, projectId: string) {
  await awardAkiliPoints(userId, 'joinProjectAsCollaborator', 20, 'Joined a project as collaborator', projectId)
}

export async function completeAssignedTask(userId: string, taskId: string) {
  await awardAkiliPoints(userId, 'completeAssignedTask', 15, 'Completed an assigned task', taskId)
}

export async function completeAllTasksInProject(userId: string, projectId: string) {
  await awardAkiliPoints(userId, 'completeAllTasksInProject', 50, 'Completed all tasks in a project', projectId)
}

export async function receive4to5StarRatingFromLead(userId: string, projectId: string) {
  await awardAkiliPoints(userId, 'receive4to5StarRatingFromLead', 20, 'Received a 4–5 star rating from project lead', projectId)
}

export async function collaboratedProjectReachesShowcase(userId: string, projectId: string) {
  await awardAkiliPoints(userId, 'collaboratedProjectReachesShowcase', 75, 'A project you collaborated on reached the showcase', projectId)
}

export async function completeMarketplaceTask(userId: string, taskId: string) {
  await awardAkiliPoints(userId, 'completeMarketplaceTask', 10, 'Completed a marketplace task', taskId)
}

export async function receive4to5StarOnMarketplaceTask(userId: string, taskId: string) {
  await awardAkiliPoints(userId, 'receive4to5StarOnMarketplaceTask', 25, 'Received a 4–5 star rating on a marketplace task', taskId)
}

// ── MENTORSHIP ────────────────────────────────────────────────────────────────

export async function acceptMentorshipRequest(userId: string, sessionId: string) {
  await awardAkiliPoints(userId, 'acceptMentorshipRequest', 15, 'Accepted a mentorship request', sessionId)
}

export async function completeMentorSession(userId: string, sessionId: string) {
  await awardAkiliPoints(userId, 'completeMentorSession', 30, 'Completed a mentorship session', sessionId)
}

export async function menteeCompletesPhase(userId: string, projectId: string) {
  await awardAkiliPoints(userId, 'menteeCompletesPhase', 20, 'Your mentee completed a project phase', projectId)
}

export async function receive4to5StarSessionRating(userId: string, sessionId: string) {
  await awardAkiliPoints(userId, 'receive4to5StarSessionRating', 25, 'Received a 4–5 star session rating', sessionId)
}

export async function menteeSubmitsToShowcase(userId: string, showcaseId: string) {
  await awardAkiliPoints(userId, 'menteeSubmitsToShowcase', 80, 'Your mentee submitted to the showcase', showcaseId)
}

export async function postOpenResearchCall(userId: string, callId: string) {
  await awardAkiliPoints(userId, 'postOpenResearchCall', 10, 'Posted an open research call', callId)
}

export async function menteeEarnsExpertStatus(userId: string, menteeId: string) {
  await awardAkiliPoints(userId, 'menteeEarnsExpertStatus', 50, 'Your mentee earned expert status', menteeId)
}

// ── TECHNICAL ─────────────────────────────────────────────────────────────────

export async function completeOnboardingWithAllSkills(userId: string) {
  await awardAkiliPoints(userId, 'completeOnboardingWithAllSkills', 20, 'Completed onboarding with all skills filled in')
}

export async function firstMarketplaceTaskCompleted(userId: string, taskId: string) {
  await awardAkiliPoints(userId, 'firstMarketplaceTaskCompleted', 30, 'Completed your first marketplace task (one-time)', taskId)
}

export async function complete5MarketplaceTasks(userId: string) {
  await awardAkiliPoints(userId, 'complete5MarketplaceTasks', 60, 'Milestone: completed 5 marketplace tasks')
}

export async function complete10MarketplaceTasks(userId: string) {
  await awardAkiliPoints(userId, 'complete10MarketplaceTasks', 150, 'Milestone: completed 10 marketplace tasks')
}

export async function skillsEndorsedBy3People(userId: string) {
  await awardAkiliPoints(userId, 'skillsEndorsedBy3People', 30, 'Your skills were endorsed by 3 people')
}

export async function matchedToProjectForSkills(userId: string, projectId: string) {
  await awardAkiliPoints(userId, 'matchedToProjectForSkills', 10, 'Matched to a project based on your skills', projectId)
}

export async function projectUsingSkillsReachesShowcase(userId: string, projectId: string) {
  await awardAkiliPoints(userId, 'projectUsingSkillsReachesShowcase', 60, 'A project using your skills reached the showcase', projectId)
}
