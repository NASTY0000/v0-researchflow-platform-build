import { createClient } from '@/lib/supabase/server'

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

export interface ContentItem {
  id: string
  type: 'idea' | 'project' | 'grant' | 'mentor' | 'challenge' | 'open_call'
  title: string
  description?: string
  research_areas: string[]
  tags?: string[]
  university_id?: string
  created_at: string
  deadline?: string
  author_id?: string
  target_levels?: string[]
  difficulty_level?: string
  raw_data: Record<string, unknown>
}

export interface UserContext {
  id: string
  research_interests: string[]
  department?: string
  academic_level?: string
  university_id?: string
  connection_ids?: string[]
}

export interface UserScoringContext {
  user: UserContext
  // area_a:area_b -> similarity_score
  adjacencyMap: Map<string, number>
  // research_area -> combined_weight
  behaviouralWeights: Map<string, number>
  // areas user marked not-interested in (last 30d)
  negativeAreaSet: Set<string>
  // content_type:content_id -> Set<user_id> (connections who engaged)
  connectionEngagements: Map<string, Set<string>>
}

export interface ScoredItem extends ContentItem {
  score: number
  score_breakdown: {
    interest_alignment: number
    level_match: number
    proximity: number
    social_signal: number
    temporal: number
    diversity_bonus: number
    feedback_adjustment: number
  }
  is_diversity_inject: boolean
  reason_label: string
}

// Pre-loads all data needed for scoring in a single batch
export async function buildUserScoringContext(
  userContext: UserContext,
  supabase: SupabaseClient
): Promise<UserScoringContext> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const seventyTwoHoursAgo = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString()

  const interests = userContext.research_interests ?? []
  const connectionIds = userContext.connection_ids ?? []

  const [adjacencyResult, weightsResult, negativeResult, socialResult] =
    await Promise.all([
      interests.length
        ? supabase
            .from('research_area_adjacency')
            .select('area_a, area_b, similarity_score')
            .in('area_a', interests)
        : Promise.resolve({ data: [] as { area_a: string; area_b: string; similarity_score: number }[] }),

      supabase
        .from('user_interest_weights')
        .select('research_area, combined_weight')
        .eq('user_id', userContext.id)
        .gt('combined_weight', 0),

      supabase
        .from('feed_engagement_events')
        .select('content_research_areas')
        .eq('user_id', userContext.id)
        .eq('event_type', 'not_interested')
        .gte('created_at', thirtyDaysAgo),

      connectionIds.length
        ? supabase
            .from('feed_engagement_events')
            .select('content_type, content_id, user_id')
            .in('user_id', connectionIds)
            .in('event_type', ['save', 'apply', 'share'])
            .gte('created_at', seventyTwoHoursAgo)
        : Promise.resolve({ data: [] as { content_type: string; content_id: string; user_id: string }[] }),
    ])

  const adjacencyMap = new Map<string, number>()
  for (const row of (adjacencyResult.data ?? [])) {
    adjacencyMap.set(`${row.area_a}:${row.area_b}`, row.similarity_score)
  }

  const behaviouralWeights = new Map<string, number>()
  for (const w of (weightsResult.data ?? [])) {
    behaviouralWeights.set(w.research_area, w.combined_weight)
  }

  const negativeAreaSet = new Set<string>()
  for (const event of (negativeResult.data ?? [])) {
    for (const area of (event.content_research_areas ?? [])) {
      negativeAreaSet.add(area)
    }
  }

  const connectionEngagements = new Map<string, Set<string>>()
  for (const event of (socialResult.data ?? [])) {
    const key = `${event.content_type}:${event.content_id}`
    if (!connectionEngagements.has(key)) connectionEngagements.set(key, new Set())
    connectionEngagements.get(key)!.add(event.user_id)
  }

  return { user: userContext, adjacencyMap, behaviouralWeights, negativeAreaSet, connectionEngagements }
}

// ─── LAYER 1: Interest Alignment ─────────────────────────────────────────────
function scoreInterestAlignment(item: ContentItem, ctx: UserScoringContext): number {
  const interests = ctx.user.research_interests ?? []
  if (!interests.length) return 0.3

  const itemAreas = item.research_areas
  if (!itemAreas.length) return 0.2

  let maxScore = 0

  for (const userArea of interests) {
    for (const itemArea of itemAreas) {
      if (userArea.toLowerCase() === itemArea.toLowerCase()) {
        maxScore = Math.max(maxScore, 1.0)
        continue
      }
      const adjacent = ctx.adjacencyMap.get(`${userArea}:${itemArea}`)
      if (adjacent !== undefined) {
        maxScore = Math.max(maxScore, adjacent)
      }
    }
  }

  // Behavioural boost: if user has engaged with this area before
  for (const itemArea of itemAreas) {
    const weight = ctx.behaviouralWeights.get(itemArea)
    if (weight !== undefined) {
      const boost = Math.min(weight * 0.1, 0.2)
      maxScore = Math.min(1.0, maxScore + boost)
    }
  }

  return maxScore
}

// ─── LAYER 2: Academic Level Match ───────────────────────────────────────────
const LEVEL_MAP: Record<string, number> = {
  undergraduate: 2,
  '100 Level': 1,
  '200 Level': 2,
  '300 Level': 3,
  '400 Level': 4,
  '500 Level': 5,
  masters: 6,
  postdoc: 7,
  phd: 8,
  faculty: 9,
}

function scoreLevelMatch(item: ContentItem, ctx: UserScoringContext): number {
  if (!item.target_levels?.length) return 0.7
  if (!ctx.user.academic_level) return 0.5

  const userNum = LEVEL_MAP[ctx.user.academic_level] ?? 3
  let best = 0
  for (const lvl of item.target_levels) {
    const targetNum = LEVEL_MAP[lvl] ?? 3
    const diff = Math.abs(userNum - targetNum)
    const score = diff === 0 ? 1.0 : diff === 1 ? 0.8 : diff === 2 ? 0.5 : 0.2
    best = Math.max(best, score)
  }
  return best
}

// ─── LAYER 3: Proximity ──────────────────────────────────────────────────────
function scoreProximity(item: ContentItem, ctx: UserScoringContext): number {
  if (!item.university_id) return 0.5 // national content

  if (
    ctx.user.university_id &&
    item.university_id === ctx.user.university_id
  ) {
    return 1.0
  }

  return 0.3
}

// ─── LAYER 4: Social Signals ─────────────────────────────────────────────────
function scoreSocialSignal(item: ContentItem, ctx: UserScoringContext): number {
  if (!ctx.user.connection_ids?.length) return 0

  const key = `${item.type}:${item.id}`
  const engagers = ctx.connectionEngagements.get(key)
  if (!engagers?.size) return 0

  return Math.min(engagers.size / 5, 1.0) * 0.8
}

// ─── LAYER 5: Temporal Urgency ───────────────────────────────────────────────
function scoreTemporalUrgency(item: ContentItem): number {
  const now = Date.now()
  const ageHours = (now - new Date(item.created_at).getTime()) / (1000 * 60 * 60)
  const freshness = Math.max(0, 1 - ageHours / (30 * 24))

  let urgency = 0
  if (item.deadline) {
    const daysLeft = (new Date(item.deadline).getTime() - now) / (1000 * 60 * 60 * 24)
    if (daysLeft < 0) urgency = 0
    else if (daysLeft <= 3) urgency = 1.0
    else if (daysLeft <= 7) urgency = 0.85
    else if (daysLeft <= 14) urgency = 0.65
    else if (daysLeft <= 30) urgency = 0.4
    else urgency = 0.2
  }

  return Math.max(freshness, urgency)
}

// ─── LAYER 6: Feedback Penalty ───────────────────────────────────────────────
function scoreFeedbackAdjustment(item: ContentItem, ctx: UserScoringContext): number {
  const hasNegativeOverlap = item.research_areas.some(area => ctx.negativeAreaSet.has(area))
  return hasNegativeOverlap ? -0.3 : 0
}

// ─── MASTER SCORING FUNCTION ─────────────────────────────────────────────────
export function scoreItem(item: ContentItem, ctx: UserScoringContext): ScoredItem {
  const interestScore = scoreInterestAlignment(item, ctx)
  const levelScore = scoreLevelMatch(item, ctx)
  const proximityScore = scoreProximity(item, ctx)
  const socialScore = scoreSocialSignal(item, ctx)
  const temporalScore = scoreTemporalUrgency(item)
  const feedbackAdj = scoreFeedbackAdjustment(item, ctx)

  const isDiversityCandidate = interestScore > 0.1 && interestScore <= 0.5

  const baseScore =
    interestScore * 0.35 +
    levelScore    * 0.10 +
    proximityScore * 0.15 +
    socialScore   * 0.15 +
    temporalScore * 0.20 +
    feedbackAdj   * 0.05

  const diversityBonus = isDiversityCandidate ? 0.15 : 0
  const finalScore = Math.max(0, Math.min(1, baseScore + diversityBonus))

  let reason = 'Recommended for you'
  if (interestScore > 0.8)     reason = 'Matches your research interests'
  else if (socialScore > 0.5)  reason = 'Popular in your network'
  else if (temporalScore > 0.8) reason = 'Deadline approaching'
  else if (proximityScore > 0.8) reason = 'From your institution'
  else if (isDiversityCandidate) reason = 'Expand your research horizons'

  return {
    ...item,
    score: finalScore,
    score_breakdown: {
      interest_alignment: interestScore,
      level_match: levelScore,
      proximity: proximityScore,
      social_signal: socialScore,
      temporal: temporalScore,
      diversity_bonus: diversityBonus,
      feedback_adjustment: feedbackAdj,
    },
    is_diversity_inject: isDiversityCandidate,
    reason_label: reason,
  }
}
