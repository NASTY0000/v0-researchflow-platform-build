'use client'

interface ReviewBadgeProps {
  badge: 'peer_reviewed' | 'highly_rated' | null | undefined
  reviewCount?: number
  averageScore?: number | null
  size?: 'sm' | 'md'
}

export function ReviewBadge({ badge, reviewCount, averageScore, size = 'sm' }: ReviewBadgeProps) {
  if (!badge) return null

  const isHighlyRated = badge === 'highly_rated'

  return (
    <div
      className={`
        inline-flex items-center gap-1.5 rounded-full font-semibold
        ${size === 'sm' ? 'px-2.5 py-1 text-[10px]' : 'px-3 py-1.5 text-xs'}
        ${isHighlyRated
          ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400'
          : 'bg-emerald-500/12 border border-emerald-500/25 text-emerald-400'
        }
      `}
    >
      <svg viewBox="0 0 12 12" width="10" height="10" fill="none">
        <path
          d="M6 1L2 3.25V6c0 2.625 1.875 5.075 4 5.625C8.125 11.075 10 8.625 10 6V3.25L6 1Z"
          fill={isHighlyRated ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.25)'}
          stroke={isHighlyRated ? '#F59E0B' : '#10B981'}
          strokeWidth="0.8"
        />
        <path
          d="M4.25 6L5.25 7L7.75 4.5"
          stroke="white"
          strokeWidth="0.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>{isHighlyRated ? 'Highly Rated' : 'Peer Reviewed'}</span>
      {averageScore != null && (
        <span className={`font-black ${isHighlyRated ? 'text-amber-300' : 'text-emerald-300'}`}>
          {Number(averageScore).toFixed(1)}
        </span>
      )}
      {reviewCount != null && reviewCount > 0 && (
        <span className="opacity-60">· {reviewCount}</span>
      )}
    </div>
  )
}
