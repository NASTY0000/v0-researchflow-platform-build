'use client'

import { useEffect, useState, useCallback } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { BackToHub } from '@/components/ui/back-to-hub'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { VerifiedBadge } from '@/components/ui/VerifiedBadge'
import { ReviewForm } from '@/components/peer-review/ReviewForm'
import { claimReview, getOpenReviews, getMyReviews } from '@/lib/actions/peer-reviews'

// ── Types ─────────────────────────────────────────────────────────────

interface OpenReviewItem {
  id: string
  idea_id: string
  created_at: string
  research_ideas: {
    id: string
    title: string
    description: string
    research_area: string
    author_id: string
    profiles: {
      full_name: string
      avatar_url: string | null
      university_name: string | null
      is_verified: boolean | null
    } | null
  } | null
}

interface MyReviewItem {
  id: string
  status: string
  claimed_at: string | null
  deadline_at: string | null
  completed_at: string | null
  average_score: number | null
  overall_verdict: string | null
  research_ideas: {
    id: string
    title: string
    research_area: string
  } | null
}

// ── Helpers ───────────────────────────────────────────────────────────

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; style: string }> = {
    claimed: { label: 'In Progress', style: 'bg-amber-500/15 text-amber-400 border-amber-500/25' },
    completed: { label: 'Completed', style: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' },
    expired: { label: 'Expired', style: 'bg-red-500/15 text-red-400 border-red-500/25' },
    requested: { label: 'Open', style: 'bg-purple-500/15 text-purple-400 border-purple-500/25' },
  }
  const { label, style } = map[status] ?? { label: status, style: 'bg-muted/30 text-muted-foreground border-border' }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${style}`}>
      {label}
    </span>
  )
}

function VerdictPill({ verdict }: { verdict: string | null }) {
  if (!verdict) return null
  const map: Record<string, { label: string; style: string }> = {
    promising: { label: 'Promising', style: 'text-emerald-400' },
    needs_work: { label: 'Needs Work', style: 'text-amber-400' },
    not_viable: { label: 'Not Viable', style: 'text-red-400' },
  }
  const { label, style } = map[verdict] ?? { label: verdict, style: 'text-muted-foreground' }
  return <span className={`text-xs font-semibold ${style}`}>{label}</span>
}

function ScoreStars({ score }: { score: number }) {
  const filled = Math.round(score)
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <svg key={s} viewBox="0 0 12 12" width="12" height="12">
          <path
            d="M6 1l1.5 3L11 4.5l-2.5 2.25.75 3.25L6 8.25l-3.25 1.75.75-3.25L1 4.5 4.5 4 6 1z"
            fill={s <= filled ? '#FBBF24' : 'rgba(255,255,255,0.1)'}
          />
        </svg>
      ))}
      <span className="text-xs text-amber-400/70 ml-1 font-semibold">
        {Number(score).toFixed(1)}
      </span>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────

export default function PeerReviewPage() {
  const [activeTab, setActiveTab] = useState<'open' | 'mine'>('open')
  const [openReviews, setOpenReviews] = useState<OpenReviewItem[]>([])
  const [myReviews, setMyReviews] = useState<MyReviewItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [claimingId, setClaimingId] = useState<string | null>(null)
  const [claimError, setClaimError] = useState<string | null>(null)
  const [activeReviewForm, setActiveReviewForm] = useState<MyReviewItem | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    const [openRes, myRes] = await Promise.all([getOpenReviews(), getMyReviews()])
    if (openRes.data) setOpenReviews(openRes.data as unknown as OpenReviewItem[])
    if (myRes.data) setMyReviews(myRes.data as unknown as MyReviewItem[])
    setIsLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleClaim(reviewId: string) {
    setClaimingId(reviewId)
    setClaimError(null)
    const result = await claimReview(reviewId)
    if (result.success) {
      await load()
      setActiveTab('mine')
    } else {
      setClaimError(result.error ?? 'Failed to claim')
    }
    setClaimingId(null)
  }

  const claimedReviews = myReviews.filter(r => r.status === 'claimed')
  const completedReviews = myReviews.filter(r => r.status === 'completed')
  const expiredReviews = myReviews.filter(r => r.status === 'expired')

  return (
    <>
      {/* Review form bottom sheet */}
      {activeReviewForm && (
        <div className="fixed inset-0 z-50 flex flex-col">
          <div
            className="flex-1 bg-black/70 backdrop-blur-sm"
            onClick={() => setActiveReviewForm(null)}
          />
          <div className="bg-[#0F0A1E] border-t border-purple-500/20 rounded-t-3xl
            max-h-[90vh] overflow-y-auto p-6 space-y-2">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-bold text-white">Write Your Review</h2>
              <button
                onClick={() => setActiveReviewForm(null)}
                className="text-purple-300/50 hover:text-purple-300 transition-colors text-xl leading-none"
              >
                ×
              </button>
            </div>
            <ReviewForm
              reviewId={activeReviewForm.id}
              ideaTitle={activeReviewForm.research_ideas?.title ?? ''}
              ideaDescription=""
              deadlineAt={activeReviewForm.deadline_at ?? new Date().toISOString()}
              onSuccess={async () => {
                setActiveReviewForm(null)
                await load()
              }}
            />
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto space-y-6">
        <BackToHub href="/community" label="Back to Community" />
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold font-heading flex items-center gap-3">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" className="text-primary">
              <path
                d="M12 2L3 6.5V12c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V6.5L12 2Z"
                fill="rgba(124,58,237,0.2)"
                stroke="#7C3AED"
                strokeWidth="1.5"
              />
              <path
                d="M8.5 12L10.5 14L15.5 9"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Peer Review Network
          </h1>
          <p className="text-muted-foreground mt-1">
            Review research ideas and earn Akili points. Reviewers earn +30 mentorship points per review.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted/20 border border-border rounded-xl w-fit">
          {([
            { id: 'open', label: `Open for Review (${openReviews.length})` },
            { id: 'mine', label: `My Reviews (${myReviews.length})` },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-28 rounded-2xl bg-muted/20 border border-border animate-pulse" />
            ))}
          </div>
        ) : activeTab === 'open' ? (
          /* ── Open for Review ─────────────────────────────────────────────── */
          <div className="space-y-3">
            {claimError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                {claimError}
              </div>
            )}

            {openReviews.length === 0 ? (
              <div className="text-center py-16 space-y-2">
                <div className="text-4xl">🔍</div>
                <p className="font-semibold">No open reviews right now</p>
                <p className="text-sm text-muted-foreground">
                  Check back soon. Researchers are always posting new ideas for review.
                </p>
              </div>
            ) : (
              openReviews.map(review => {
                const idea = review.research_ideas
                const author = idea?.profiles
                return (
                  <div
                    key={review.id}
                    className="p-4 rounded-2xl bg-muted/10 border border-border
                      hover:border-primary/30 transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full
                            bg-purple-500/15 border border-purple-500/25 text-purple-400">
                            {idea?.research_area}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <h3 className="font-semibold text-sm mb-2 line-clamp-2">
                          {idea?.title}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                          {idea?.description}
                        </p>
                        {author && (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={author.avatar_url || undefined} />
                              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                {author.full_name?.charAt(0) || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground">{author.full_name}</span>
                            {author.is_verified && (
                              <VerifiedBadge universityName={author.university_name} size="sm" />
                            )}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleClaim(review.id)}
                        disabled={claimingId === review.id}
                        className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold
                          transition-all whitespace-nowrap ${
                          claimingId === review.id
                            ? 'bg-purple-800/40 text-purple-400/50 cursor-not-allowed'
                            : 'bg-primary/15 border border-primary/30 text-primary hover:bg-primary/25'
                        }`}
                      >
                        {claimingId === review.id ? '↻ Claiming...' : 'Claim Review'}
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        ) : (
          /* ── My Reviews ──────────────────────────────────────────────────── */
          <div className="space-y-6">
            {myReviews.length === 0 ? (
              <div className="text-center py-16 space-y-2">
                <div className="text-4xl">📋</div>
                <p className="font-semibold">No reviews yet</p>
                <p className="text-sm text-muted-foreground">
                  Claim a review from the &ldquo;Open for Review&rdquo; tab to get started.
                </p>
              </div>
            ) : (
              <>
                {/* In Progress */}
                {claimedReviews.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      In Progress ({claimedReviews.length})
                    </h3>
                    {claimedReviews.map(review => {
                      const hoursLeft = review.deadline_at
                        ? Math.max(0, Math.round(
                            (new Date(review.deadline_at).getTime() - Date.now()) / 3600000
                          ))
                        : null
                      return (
                        <div
                          key={review.id}
                          className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/15"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <StatusPill status={review.status} />
                                {hoursLeft !== null && (
                                  <span className={`text-xs font-medium ${
                                    hoursLeft < 12 ? 'text-red-400' : 'text-amber-400/70'
                                  }`}>
                                    {hoursLeft}h left
                                  </span>
                                )}
                              </div>
                              <p className="font-semibold text-sm line-clamp-2">
                                {review.research_ideas?.title}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {review.research_ideas?.research_area}
                              </p>
                            </div>
                            <button
                              onClick={() => setActiveReviewForm(review)}
                              className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold
                                bg-primary/15 border border-primary/30 text-primary
                                hover:bg-primary/25 transition-all whitespace-nowrap"
                            >
                              Continue →
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Completed */}
                {completedReviews.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Completed ({completedReviews.length})
                    </h3>
                    {completedReviews.map(review => (
                      <div
                        key={review.id}
                        className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/15"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <StatusPill status={review.status} />
                              {review.average_score != null && (
                                <ScoreStars score={review.average_score} />
                              )}
                            </div>
                            <p className="font-semibold text-sm line-clamp-2">
                              {review.research_ideas?.title}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-xs text-muted-foreground">
                                {review.research_ideas?.research_area}
                              </p>
                              {review.overall_verdict && (
                                <>
                                  <span className="text-muted-foreground/30">·</span>
                                  <VerdictPill verdict={review.overall_verdict} />
                                </>
                              )}
                            </div>
                            {review.completed_at && (
                              <p className="text-xs text-muted-foreground/50 mt-1">
                                Completed {formatDistanceToNow(new Date(review.completed_at), { addSuffix: true })}
                              </p>
                            )}
                          </div>
                          <div className="flex-shrink-0 text-xs font-semibold text-emerald-400 bg-emerald-500/10
                            border border-emerald-500/20 px-3 py-1.5 rounded-xl">
                            +30 pts
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Expired */}
                {expiredReviews.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Expired ({expiredReviews.length})
                    </h3>
                    {expiredReviews.map(review => (
                      <div
                        key={review.id}
                        className="p-4 rounded-2xl bg-red-500/5 border border-red-500/15 opacity-60"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <StatusPill status={review.status} />
                        </div>
                        <p className="font-semibold text-sm">{review.research_ideas?.title}</p>
                        <p className="text-xs text-muted-foreground">{review.research_ideas?.research_area}</p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </>
  )
}
