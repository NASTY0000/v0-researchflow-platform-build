'use client'

import { useState } from 'react'
import { requestPeerReview, cancelReviewRequest } from '@/lib/actions/peer-reviews'

interface RequestReviewButtonProps {
  ideaId: string
  isOpenForReview: boolean
  existingReviewId?: string
}

export function RequestReviewButton({
  ideaId,
  isOpenForReview,
  existingReviewId,
}: RequestReviewButtonProps) {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(isOpenForReview)
  const [error, setError] = useState<string | null>(null)

  async function handleRequest() {
    setLoading(true)
    setError(null)
    const result = await requestPeerReview(ideaId)
    setLoading(false)
    if (result.success) setOpen(true)
    else setError(result.error ?? null)
  }

  async function handleCancel() {
    if (!existingReviewId) return
    setLoading(true)
    const result = await cancelReviewRequest(existingReviewId)
    setLoading(false)
    if (result.success) setOpen(false)
    else setError(result.error ?? null)
  }

  return (
    <div className="space-y-2">
      {open ? (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/8 border border-emerald-500/20">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-emerald-400">Open for peer review</p>
            <p className="text-[10px] text-emerald-400/50">
              Researchers in your field can now claim this review
            </p>
          </div>
          <button
            onClick={handleCancel}
            disabled={loading}
            className="text-[10px] text-red-400/60 hover:text-red-400 transition-colors flex-shrink-0 px-2 py-1"
          >
            {loading ? '...' : 'Cancel'}
          </button>
        </div>
      ) : (
        <button
          onClick={handleRequest}
          disabled={loading}
          className={`
            w-full h-10 rounded-xl text-sm font-semibold
            flex items-center justify-center gap-2 transition-all
            ${loading
              ? 'bg-purple-800/40 text-purple-400/50 cursor-not-allowed'
              : 'bg-purple-500/12 border border-purple-500/25 text-purple-300 hover:bg-purple-500/20 hover:border-purple-500/40'
            }
          `}
        >
          {loading ? (
            '↻ Requesting...'
          ) : (
            <>
              <svg viewBox="0 0 16 16" width="14" height="14" fill="none">
                <path
                  d="M8 1L2 4.5V8c0 3.5 2.5 6.75 6 7.5 3.5-.75 6-4 6-7.5V4.5L8 1Z"
                  fill="rgba(124,58,237,0.3)"
                  stroke="#7C3AED"
                  strokeWidth="1"
                />
                <path
                  d="M5.5 8L7 9.5L10.5 6"
                  stroke="white"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Request Peer Review
            </>
          )}
        </button>
      )}
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  )
}
