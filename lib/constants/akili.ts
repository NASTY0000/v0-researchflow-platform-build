export const AKILI_TIERS = [
  { min: 0,     max: 999,      title: 'Emerging Researcher' },
  { min: 1000,  max: 2499,     title: 'Active Contributor' },
  { min: 2500,  max: 4999,     title: 'Collaborative Researcher' },
  { min: 5000,  max: 7999,     title: 'Research Builder' },
  { min: 8000,  max: 11999,    title: 'Research Leader' },
  { min: 12000, max: 19999,    title: 'Research Expert' },
  { min: 20000, max: Infinity, title: 'Research Champion' },
]

export function getAkiliTitle(score: number): string {
  const tier = AKILI_TIERS.find(t => score >= t.min && score <= t.max)
  return tier?.title ?? 'Emerging Researcher'
}

export const AKILI_POINTS = {
  onboarding_complete: 10,
  post_idea: 15,
  join_project: 20,
  complete_task: 15,
  accept_connection: 5,
  complete_phase: 30,
  all_phases_complete: 75,
  mentor_session: 30,
  showcase_approved: 100,
}
