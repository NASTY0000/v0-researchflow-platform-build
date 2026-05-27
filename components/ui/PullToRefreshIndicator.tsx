'use client'

export function PullToRefreshIndicator({
  pullDistance,
  threshold,
  isRefreshing,
}: {
  pullDistance: number
  threshold: number
  isRefreshing: boolean
}) {
  const progress = Math.min(pullDistance / threshold, 1)
  if (pullDistance === 0 && !isRefreshing) return null

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center pointer-events-none"
      style={{ height: `${Math.max(pullDistance, 0)}px` }}
    >
      <div
        className="w-10 h-10 rounded-full border-2 flex items-center justify-center shadow-lg transition-colors duration-200"
        style={{
          background: '#0F0A1E',
          borderColor: isRefreshing ? '#7C3AED' : 'rgba(124,58,237,0.5)',
        }}
      >
        {isRefreshing ? (
          <svg className="animate-spin" viewBox="0 0 24 24" width="16" height="16">
            <circle
              cx="12" cy="12" r="9"
              stroke="#7C3AED" strokeWidth="2.5" fill="none"
              strokeDasharray="56" strokeDashoffset="20"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <svg
            viewBox="0 0 24 24" width="16" height="16"
            style={{
              transform: `rotate(${progress * 180}deg)`,
              transition: 'transform 0.1s',
              opacity: progress,
            }}
          >
            <path
              d="M12 4v8m0 0l-3-3m3 3l3-3"
              stroke="#7C3AED" strokeWidth="2.5" fill="none"
              strokeLinecap="round" strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
    </div>
  )
}
