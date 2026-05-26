interface LogoProps {
  width?: number
  variant?: 'full' | 'icon' | 'horizontal'
  theme?: 'dark' | 'light'
  uid?: string
}

export function Logo({ width = 200, variant = 'full', theme = 'dark', uid = 'rf' }: LogoProps) {
  const textMain = theme === 'dark' ? '#F5F0E8' : '#1E1B4B'
  const textFlow = '#FBBF24'
  const gradId = `rf-trunk-${uid}`

  const mark = (
    <>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5B21B6" />
          <stop offset="100%" stopColor="#2E1065" />
        </linearGradient>
      </defs>
      <path d="M 110,172 C 106,196 99,220 96,244 L 146,244 C 144,220 137,196 133,172 Z" fill={`url(#${gradId})`} />
      {['M 121,172 Q 65,118 12,72','M 121,172 Q 84,108 46,52','M 121,172 Q 101,102 80,42','M 121,172 Q 121,100 121,38','M 121,172 Q 141,102 162,42','M 121,172 Q 158,108 196,52','M 121,172 Q 177,118 230,72'].map((d, i) => (
        <path key={i} d={d} stroke="#7C3AED" strokeWidth="5.5" fill="none" strokeLinecap="round" />
      ))}
      {['M 12,72 Q 29,62 46,52','M 46,52 Q 63,47 80,42','M 80,42 Q 100,39 121,38','M 121,38 Q 141,39 162,42','M 162,42 Q 179,47 196,52','M 196,52 Q 213,62 230,72'].map((d, i) => (
        <path key={i} d={d} stroke="#C4B5FD" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity={0.4} />
      ))}
      {[[12,72,7.5,'#8B5CF6'],[46,52,7,'#A855F7'],[80,42,7.5,'#8B5CF6'],[162,42,7.5,'#8B5CF6'],[196,52,7,'#A855F7'],[230,72,7.5,'#8B5CF6']].map(([cx,cy,r,fill],i) => (
        <circle key={i} cx={cx as number} cy={cy as number} r={r as number} fill={fill as string} />
      ))}
      <circle cx="121" cy="38" r="11" fill="rgba(251,191,36,0.18)" />
      <circle cx="121" cy="38" r="8" fill="#FBBF24" />
    </>
  )

  if (variant === 'icon') {
    return <svg viewBox="0 0 260 260" width={width} height={width} style={{ display: 'block' }}>{mark}</svg>
  }

  if (variant === 'horizontal') {
    return (
      <svg viewBox="0 0 360 80" width={width} style={{ display: 'block' }}>
        <g transform="scale(0.29) translate(0, 10)">{mark}</g>
        <text x="86" y="36" fontFamily="-apple-system, 'Helvetica Neue', Arial, sans-serif" fontSize="28" fontWeight="800" letterSpacing="-0.5">
          <tspan fill={textMain}>Research</tspan><tspan fill={textFlow}>Flow</tspan>
        </text>
        <text x="87" y="55" fontFamily="-apple-system, 'Helvetica Neue', Arial, sans-serif" fontSize="11" fontWeight="500" fill="rgba(124,97,156,0.7)" letterSpacing="0.02em">
          Collaborate &amp; Discover
        </text>
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 260 310" width={width} style={{ display: 'block' }}>
      {mark}
      <text x="121" y="284" textAnchor="middle" fontFamily="-apple-system, 'Helvetica Neue', Arial, sans-serif" fontSize="34" fontWeight="800" letterSpacing="-0.6">
        <tspan fill={textMain}>Research</tspan><tspan fill={textFlow}>Flow</tspan>
      </text>
    </svg>
  )
}
