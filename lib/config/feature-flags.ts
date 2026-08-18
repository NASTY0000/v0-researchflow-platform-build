export const featureFlags = {
  myFeed: false,
  agreements: false,
  myProjects: false,
  openProjects: false,
  journalsAndConferences: false,
  forum: false,
  peerReview: false,
  challenges: false,
  adminShowcaseReview: false,
  adminAnalytics: false,
  adminResearchInsights: false,
  adminGrantApplications: false,
  adminGrants: false,
  adminInstitution: false,
} as const

export type FeatureFlag = keyof typeof featureFlags

export const featureLabels: Record<FeatureFlag, string> = {
  myFeed: 'My Feed', agreements: 'Agreements', myProjects: 'My Projects', openProjects: 'Open Projects',
  journalsAndConferences: 'Journals & Conferences', forum: 'Forum', peerReview: 'Peer Review', challenges: 'Challenges',
  adminShowcaseReview: 'Showcase Review', adminAnalytics: 'Analytics', adminResearchInsights: 'Research Insights',
  adminGrantApplications: 'Grant Applications', adminGrants: 'Grants', adminInstitution: 'Institution',
}

export function isFeatureEnabled(feature: FeatureFlag) {
  return featureFlags[feature]
}
