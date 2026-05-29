'use client'

interface BaobabLoaderProps {
  size?: 'sm' | 'md' | 'lg'
  fullscreen?: boolean
}

export function BaobabLoader({ size = 'md' }: BaobabLoaderProps) {
  const sizes = { sm: 56, md: 56, lg: 56 }
  const w = sizes[size]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#05010F]">
      <div className="flex flex-col items-center gap-4">
        <svg
          viewBox="0 0 260 260"
          width={w}
          height={w}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="bl-trunk" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5B21B6" />
              <stop offset="100%" stopColor="#2E1065" />
            </linearGradient>
          </defs>

          <path
            d="M 110,172 C 106,200 98,222 95,244 L 147,244 C 145,222 136,200 132,172 Z"
            fill="url(#bl-trunk)"
          />

          {[
            'M 121,172 Q 65,118 12,72',
            'M 121,172 Q 84,108 46,52',
            'M 121,172 Q 101,102 80,42',
            'M 121,172 Q 121,100 121,38',
            'M 121,172 Q 141,102 162,42',
            'M 121,172 Q 158,108 196,52',
            'M 121,172 Q 177,118 230,72',
          ].map((d, i) => (
            <path
              key={i}
              d={d}
              stroke="#7C3AED"
              strokeWidth="10"
              fill="none"
              strokeLinecap="round"
              style={{
                animation: 'branchPulse 2s ease-in-out infinite',
                animationDelay: `${i * 0.18}s`,
              }}
            />
          ))}

          <circle cx="121" cy="38" r="16" fill="rgba(251,191,36,0.2)"
            style={{ animation: 'apexBreath 2s ease-in-out infinite' }} />
          <circle cx="121" cy="38" r="11" fill="#FBBF24"
            style={{ animation: 'apexGlow 2s ease-in-out infinite' }} />

          <style>{`
            @keyframes branchPulse {
              0%, 100% { opacity: 0.25 }
              50% { opacity: 1 }
            }
            @keyframes apexBreath {
              0%, 100% { opacity: 0.15 }
              50% { opacity: 0.5 }
            }
            @keyframes apexGlow {
              0%, 100% { opacity: 0.6; filter: drop-shadow(0 0 4px #FBBF24) }
              50% { opacity: 1; filter: drop-shadow(0 0 12px #FBBF24) }
            }
          `}</style>
        </svg>
        <p className="text-sm text-purple-400/50 tracking-wide"
          style={{ animation: 'apexBreath 2s ease-in-out infinite' }}>
          Loading...
        </p>
      </div>
    </div>
  )
}
