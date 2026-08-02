'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { awardAkiliPoints } from './akili'

// ── REQUEST A REVIEW (idea author) ──────────────────────────────────
export async function requestPeerReview(
  ideaId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    const { data: idea } = await supabase
      .from('research_ideas')
      .select('id, author_id, is_open_for_review')
      .eq('id', ideaId)
      .single()

    if (!idea) return { success: false, error: 'Idea not found' }
    if (idea.author_id !== user.id)
      return { success: false, error: 'You can only request reviews for your own ideas' }
    if (idea.is_open_for_review)
      return { success: false, error: 'This idea already has an open review request' }

    const { data: existing } = await supabase
      .from('peer_reviews')
      .select('id, status')
      .eq('idea_id', ideaId)
      .in('status', ['requested', 'claimed'])
      .maybeSingle()

    if (existing)
      return { success: false, error: 'A review is already in progress for this idea' }

    const { error } = await supabase
      .from('peer_reviews')
      .insert({ idea_id: ideaId, author_id: user.id, status: 'requested' })

    if (error) throw error

    await supabase
      .from('research_ideas')
      .update({ is_open_for_review: true })
      .eq('id', ideaId)

    revalidatePath('/ideas')
    revalidatePath(`/ideas/${ideaId}`)
    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to request review'
    console.error('requestPeerReview:', err)
    return { success: false, error: msg }
  }
}

// ── CANCEL REVIEW REQUEST (idea author) ─────────────────────────────
export async function cancelReviewRequest(
  reviewId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    const { data: review } = await supabase
      .from('peer_reviews')
      .select('id, idea_id, author_id, status')
      .eq('id', reviewId)
      .single()

    if (!review) return { success: false, error: 'Review not found' }
    if (review.author_id !== user.id) return { success: false, error: 'Not authorised' }
    if (review.status === 'claimed')
      return {
        success: false,
        error: 'Cannot cancel: a reviewer has already claimed this. Wait for them to complete it.',
      }

    await supabase.from('peer_reviews').delete().eq('id', reviewId)
    await supabase
      .from('research_ideas')
      .update({ is_open_for_review: false })
      .eq('id', review.idea_id)

    revalidatePath('/ideas')
    revalidatePath(`/ideas/${review.idea_id}`)
    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to cancel'
    return { success: false, error: msg }
  }
}

// ── CLAIM A REVIEW (reviewer) ────────────────────────────────────────
export async function claimReview(
  reviewId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    const { data: review } = await supabase
      .from('peer_reviews')
      .select('id, author_id, status, reviewer_id')
      .eq('id', reviewId)
      .single()

    if (!review) return { success: false, error: 'Review not found' }
    if (review.author_id === user.id)
      return { success: false, error: 'You cannot review your own idea' }
    if (review.status !== 'requested')
      return { success: false, error: 'This review is no longer available' }

    const { count } = await supabase
      .from('peer_reviews')
      .select('*', { count: 'exact', head: true })
      .eq('reviewer_id', user.id)
      .eq('status', 'claimed')

    if ((count ?? 0) >= 3)
      return {
        success: false,
        error: 'You have 3 reviews in progress. Complete one before claiming another.',
      }

    const deadline = new Date(Date.now() + 72 * 60 * 60 * 1000)

    const { error } = await supabase
      .from('peer_reviews')
      .update({
        reviewer_id: user.id,
        status: 'claimed',
        claimed_at: new Date().toISOString(),
        deadline_at: deadline.toISOString(),
      })
      .eq('id', reviewId)
      .eq('status', 'requested')

    if (error) throw error

    revalidatePath('/peer-review')
    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to claim review'
    return { success: false, error: msg }
  }
}

// ── SUBMIT A REVIEW (reviewer) ───────────────────────────────────────
export interface ReviewSubmission {
  score_methodology: number
  score_clarity: number
  score_originality: number
  score_feasibility: number
  score_african_context: number
  comment_methodology: string
  comment_clarity: string
  comment_originality: string
  comment_feasibility: string
  comment_african_context: string
  overall_verdict: 'promising' | 'needs_work' | 'not_viable'
  overall_comments: string
}

export async function submitReview(
  reviewId: string,
  data: ReviewSubmission
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    const { data: review } = await supabase
      .from('peer_reviews')
      .select('id, idea_id, author_id, reviewer_id, status, deadline_at')
      .eq('id', reviewId)
      .single()

    if (!review) return { success: false, error: 'Review not found' }
    if (review.reviewer_id !== user.id) return { success: false, error: 'Not authorised' }
    if (review.status !== 'claimed') return { success: false, error: 'Review is not in a claimed state' }

    if (review.deadline_at && new Date(review.deadline_at) < new Date()) {
      await supabase.from('peer_reviews').update({ status: 'expired' }).eq('id', reviewId)
      return { success: false, error: 'Review deadline has passed' }
    }

    const scores = [
      data.score_methodology, data.score_clarity,
      data.score_originality, data.score_feasibility,
      data.score_african_context,
    ]
    if (scores.some(s => s < 1 || s > 5))
      return { success: false, error: 'All scores must be between 1 and 5' }

    const comments = [
      data.comment_methodology, data.comment_clarity,
      data.comment_originality, data.comment_feasibility,
      data.comment_african_context, data.overall_comments,
    ]
    if (comments.some(c => !c?.trim()))
      return { success: false, error: 'All comment fields are required' }

    const average = scores.reduce((a, b) => a + b, 0) / scores.length
    const roundedAvg = Math.round(average * 100) / 100

    const { error: updateError } = await supabase
      .from('peer_reviews')
      .update({
        ...data,
        status: 'completed',
        completed_at: new Date().toISOString(),
        average_score: roundedAvg,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reviewId)

    if (updateError) throw updateError

    await supabase
      .from('research_ideas')
      .update({ is_open_for_review: false })
      .eq('id', review.idea_id)

    // Award Akili points, reviewer gets Mentorship points
    await awardAkiliPoints({
      userId: user.id,
      eventType: 'peer_review_completed',
      points: 30,
      dimension: 'mentorship',
      description: 'Completed a peer review for a research idea',
    })

    // Award idea author Knowledge points
    await awardAkiliPoints({
      userId: review.author_id,
      eventType: 'idea_peer_reviewed',
      points: 20,
      dimension: 'knowledge',
      description: 'Research idea received a peer review',
    })

    // Bonus points if highly rated
    if (roundedAvg >= 4.0) {
      await awardAkiliPoints({
        userId: review.author_id,
        eventType: 'idea_highly_rated',
        points: 10,
        dimension: 'knowledge',
        description: 'Research idea received a highly-rated peer review',
      })
    }

    revalidatePath('/peer-review')
    revalidatePath('/ideas')
    revalidatePath(`/ideas/${review.idea_id}`)
    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to submit review'
    console.error('submitReview:', err)
    return { success: false, error: msg }
  }
}

// ── FETCH OPEN REVIEWS (review board) ───────────────────────────────
export async function getOpenReviews(limit = 20, offset = 0) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('peer_reviews')
    .select(`
      id, idea_id, created_at,
      research_ideas (
        id, title, description, research_area, author_id,
        profiles!research_ideas_author_id_fkey (
          full_name, avatar_url, university_name, is_verified
        )
      )
    `)
    .eq('status', 'requested')
    .neq('author_id', user?.id ?? '')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  return { data, error }
}

// ── FETCH MY REVIEWS (reviewer dashboard) ───────────────────────────
export async function getMyReviews() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('peer_reviews')
    .select(`
      id, status, claimed_at, deadline_at,
      completed_at, average_score, overall_verdict,
      research_ideas (id, title, research_area)
    `)
    .eq('reviewer_id', user.id)
    .order('created_at', { ascending: false })

  return { data, error }
}

// ── FETCH REVIEWS FOR AN IDEA ────────────────────────────────────────
export async function getIdeaReviews(ideaId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('peer_reviews')
    .select(`
      id, completed_at, average_score, overall_verdict,
      score_methodology, score_clarity, score_originality,
      score_feasibility, score_african_context,
      comment_methodology, comment_clarity, comment_originality,
      comment_feasibility, comment_african_context,
      overall_comments,
      profiles!peer_reviews_reviewer_id_fkey (
        full_name, avatar_url, university_name, is_verified
      )
    `)
    .eq('idea_id', ideaId)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })

  return { data, error }
}

// ── FETCH ACTIVE REVIEW FOR AN IDEA ─────────────────────────────────
export async function getActiveReviewForIdea(ideaId: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('peer_reviews')
    .select('id, status')
    .eq('idea_id', ideaId)
    .in('status', ['requested', 'claimed'])
    .maybeSingle()

  return data
}
