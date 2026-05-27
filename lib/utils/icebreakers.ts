import type { Profile } from '@/lib/types/database'

const OPENER_TEMPLATES = [
  (a: string, b: string, shared: string) =>
    `Hi ${b}! I came across your profile and noticed we're both working on ${shared}. I'd love to hear about your approach — maybe there's a collaboration angle here?`,
  (a: string, b: string, shared: string) =>
    `Hey ${b}, I'm ${a} — I saw your work touches on ${shared} too. Would you be open to a quick chat about research directions?`,
  (a: string, b: string, shared: string) =>
    `Hi ${b}! Your research in ${shared} caught my eye. I'm exploring similar territory and think there could be interesting overlap. Care to connect?`,
]

const GENERIC_TEMPLATES = [
  (a: string, b: string) =>
    `Hi ${b}! I'm ${a}. ResearchFlow suggested we might be a good match — I'd love to learn more about what you're currently working on.`,
  (a: string, b: string) =>
    `Hey ${b}, I'm ${a}. I saw your profile and think our research directions could complement each other. Would you be open to a quick intro?`,
  (a: string, b: string) =>
    `Hi ${b}! ResearchFlow connected us and I can see why — I'm keen to hear about your research. Happy to share mine too. Hope to chat soon!`,
]

function firstName(fullName: string | null | undefined): string {
  return fullName?.split(' ')[0] || 'there'
}

function findSharedInterest(
  interestsA: string[] | null | undefined,
  interestsB: string[] | null | undefined,
): string | null {
  if (!interestsA?.length || !interestsB?.length) return null
  const setB = new Set(interestsB.map(s => s.toLowerCase()))
  const match = interestsA.find(s => setB.has(s.toLowerCase()))
  return match ?? null
}

export function generateIcebreaker(currentUser: Profile, match: Profile): string {
  const myName = firstName(currentUser.full_name)
  const theirName = firstName(match.full_name)

  const shared = findSharedInterest(
    currentUser.research_interests,
    match.research_interests,
  )

  if (shared) {
    const tpl = OPENER_TEMPLATES[Math.floor(Math.random() * OPENER_TEMPLATES.length)]
    return tpl(myName, theirName, shared)
  }

  const tpl = GENERIC_TEMPLATES[Math.floor(Math.random() * GENERIC_TEMPLATES.length)]
  return tpl(myName, theirName)
}
