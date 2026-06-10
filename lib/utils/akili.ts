import { getAkiliTier } from '@/lib/constants/akili'

export type AkiliDimension = 'knowledge' | 'collaboration' | 'mentorship' | 'technical'

const KNOWLEDGE_EVENTS = [
  'postResearchIdea', 'ideaAttracts3Applicants', 'ideaFormsActiveTeam',
  'completeLiteratureReview', 'submitToShowcase', 'showcaseApproved',
  'showcaseDownloaded25Times',
]

const COLLABORATION_EVENTS = [
  'joinProjectAsCollaborator', 'completeAssignedTask', 'completeAllTasksInProject',
  'receive4to5StarRatingFromLead', 'collaboratedProjectReachesShowcase',
  'completeMarketplaceTask', 'receive4to5StarOnMarketplaceTask',
]

const MENTORSHIP_EVENTS = [
  'acceptMentorshipRequest', 'completeMentorSession', 'menteeCompletesPhase',
  'receive4to5StarSessionRating', 'menteeSubmitsToShowcase', 'postOpenResearchCall',
  'menteeEarnsExpertStatus',
]

const TECHNICAL_EVENTS = [
  'completeOnboardingWithAllSkills', 'firstMarketplaceTaskCompleted',
  'complete5MarketplaceTasks', 'complete10MarketplaceTasks',
  'skillsEndorsedBy3People', 'matchedToProjectForSkills',
  'projectUsingSkillsReachesShowcase',
]

export function getDimensionForEvent(eventType: string): AkiliDimension {
  if (KNOWLEDGE_EVENTS.includes(eventType)) return 'knowledge'
  if (COLLABORATION_EVENTS.includes(eventType)) return 'collaboration'
  if (MENTORSHIP_EVENTS.includes(eventType)) return 'mentorship'
  if (TECHNICAL_EVENTS.includes(eventType)) return 'technical'
  return 'knowledge'
}

export function getAkiliNarrative(score: number): { title: string; narrative: string } {
  const tier = getAkiliTier(score)
  return { title: tier.name, narrative: tier.description }
}

export function getDimensionBadge(dimension: AkiliDimension, score: number): string {
  switch (dimension) {
    case 'knowledge':
      if (score < 500) return 'Idea Spark'
      if (score < 2000) return 'Knowledge Builder'
      if (score < 5000) return 'Research Scholar'
      return 'Published Researcher'
    case 'collaboration':
      if (score < 500) return 'Team Player'
      if (score < 2000) return 'Reliable Contributor'
      if (score < 5000) return 'Core Collaborator'
      return 'Research Partner'
    case 'mentorship':
      if (score < 500) return 'Guide'
      if (score < 2000) return 'Mentor'
      if (score < 5000) return 'Senior Mentor'
      return 'Research Shaper'
    case 'technical':
      if (score < 500) return 'Skilled'
      if (score < 2000) return 'Problem Solver'
      if (score < 5000) return 'Technical Expert'
      return 'Platform Authority'
  }
}

export const DIMENSION_COLORS: Record<AkiliDimension, { bg: string; border: string; text: string; bar: string }> = {
  knowledge:     { bg: 'rgba(168,85,247,0.1)',  border: 'rgba(168,85,247,0.3)',  text: '#C084FC', bar: '#A855F7' },
  collaboration: { bg: 'rgba(6,182,212,0.1)',   border: 'rgba(6,182,212,0.3)',   text: '#22D3EE', bar: '#06B6D4' },
  mentorship:    { bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.3)',   text: '#4ADE80', bar: '#22C55E' },
  technical:     { bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.3)',  text: '#FCD34D', bar: '#F59E0B' },
}

export const DIMENSION_LABELS: Record<AkiliDimension, string> = {
  knowledge:     'Knowledge',
  collaboration: 'Collaboration',
  mentorship:    'Mentorship',
  technical:     'Technical',
}
