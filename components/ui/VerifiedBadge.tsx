'use client'

interface VerifiedBadgeProps {
  universityName?: string | null
  size?: 'sm' | 'md' | 'lg'
}

export function VerifiedBadge({ universityName, size = 'sm' }: VerifiedBadgeProps) {
  const sizes = {
    sm: { icon: 14, container: 'w-4 h-4' },
    md: { icon: 16, container: 'w-5 h-5' },
    lg: { icon: 20, container: 'w-6 h-6' },
  }
  const s = sizes[size]

  return (
    <div
      className="relative group inline-flex flex-shrink-0"
      title={universityName ? `Verified researcher at ${universityName}` : 'Verified researcher'}
    >
      <div className={`${s.container} flex items-center justify-center`}>
        <svg viewBox="0 0 24 24" width={s.icon} height={s.icon} fill="none">
          <path
            d="M12 2L3 6.5V12c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V6.5L12 2Z"
            fill="#7C3AED"
            fillOpacity="0.9"
          />
          <path
            d="M8.5 12L10.5 14L15.5 9"
            stroke="white"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 pointer-events-none">
        <div className="bg-[#0F0A1E] border border-purple-500/30 rounded-lg px-3 py-2 text-xs text-white whitespace-nowrap shadow-xl shadow-black/40">
          <div className="flex items-center gap-1.5">
            <span className="text-purple-400">✓</span>
            {universityName ? `Verified · ${universityName}` : 'Verified Researcher'}
          </div>
        </div>
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#0F0A1E]" />
      </div>
    </div>
  )
}
