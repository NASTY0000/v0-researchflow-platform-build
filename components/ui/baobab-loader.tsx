'use client'

interface BaobabLoaderProps {
  size?: 'sm' | 'md' | 'lg'
  fullscreen?: boolean
}

export function BaobabLoader({ size = 'md', fullscreen = false }: BaobabLoaderProps) {
  const sizes = { sm: 60, md: 100, lg: 160 }
  const w = sizes[size]

  const loader = (
    <svg viewBox="0 0 260 310" width={w} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bl-trunk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5B21B6" />
          <stop offset="100%" stopColor="#2E1065" />
        </linearGradient>
      </defs>

      <path
        d="M 110,172 C 106,196 99,220 96,244 L 146,244 C 144,220 137,196 133,172 Z"
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
          strokeWidth="5.5"
          fill="none"
          strokeLinecap="round"
          style={{
            animation: 'branchPulse 2s ease-in-out infinite',
            animationDelay: `${i * 0.18}s`,
          }}
        />
      ))}

      {[
        { cx: 12,  cy: 72, r: 7.5, fill: '#8B5CF6', delay: 0 },
        { cx: 46,  cy: 52, r: 7,   fill: '#A855F7', delay: 0.18 },
        { cx: 80,  cy: 42, r: 7.5, fill: '#8B5CF6', delay: 0.36 },
        { cx: 162, cy: 42, r: 7.5, fill: '#8B5CF6', delay: 0.72 },
        { cx: 196, cy: 52, r: 7,   fill: '#A855F7', delay: 0.90 },
        { cx: 230, cy: 72, r: 7.5, fill: '#8B5CF6', delay: 1.08 },
      ].map((node, i) => (
        <circle
          key={i}
          cx={node.cx}
          cy={node.cy}
          r={node.r}
          fill={node.fill}
          style={{
            animation: 'nodePulse 2s ease-in-out infinite',
            animationDelay: `${node.delay}s`,
          }}
        />
      ))}

      <circle
        cx="121" cy="38" r="11"
        fill="rgba(251,191,36,0.15)"
        style={{ animation: 'apexBreath 2s ease-in-out infinite' }}
      />
      <circle
        cx="121" cy="38" r="8"
        fill="#FBBF24"
        style={{ animation: 'apexGlow 2s ease-in-out infinite' }}
      />
      <circle cx="121" cy="38" r="3.5" fill="white" opacity="0.95" />

      <style>{`
        @keyframes branchPulse {
          0%, 100% { opacity: 0.25 }
          50% { opacity: 1 }
        }
        @keyframes nodePulse {
          0%, 100% { opacity: 0.2 }
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
  )

  if (fullscreen) {
    return (
      <div style={{
        position: 'fixed', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: '#05010F', zIndex: 9999,
      }}>
        {loader}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
      {loader}
    </div>
  )
}
