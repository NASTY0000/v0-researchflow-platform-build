// Canonical Akili tier definitions.
// Mirrors the `akili_tiers` table created in supabase/user_state_migration.sql
// and the tiers returned by the get_user_state(p_user_id) RPC.
// All UI surfaces should derive tier name/description from this single list
// (or, for the current user, from useUserState()) so tier names never
// disagree across pages.
export const AKILI_TIERS = [
  { name: 'Emerging Researcher', slug: 'emerging', min: 0, description: 'Just beginning the research journey on ResearchFlow' },
  { name: 'Scholar Researcher', slug: 'scholar', min: 200, description: 'Actively engaging with research on the platform' },
  { name: 'Research Fellow', slug: 'fellow', min: 700, description: 'Consistently contributing to the research community' },
  { name: 'Senior Investigator', slug: 'investigator', min: 1500, description: 'A recognised research contributor' },
  { name: 'Principal Researcher', slug: 'principal', min: 3000, description: 'An expert and leader in research on ResearchFlow' },
] as const

export type AkiliTier = (typeof AKILI_TIERS)[number]

export function getAkiliTier(score: number): AkiliTier {
  let current: AkiliTier = AKILI_TIERS[0]
  for (const tier of AKILI_TIERS) {
    if (score >= tier.min) current = tier
    else break
  }
  return current
}

export function getNextAkiliTier(score: number): AkiliTier | null {
  return AKILI_TIERS.find(t => t.min > score) ?? null
}

export function getAkiliTitle(score: number): string {
  return getAkiliTier(score).name
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
