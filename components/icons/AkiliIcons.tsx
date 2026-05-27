'use client'

interface IconProps {
  size?: number
  className?: string
}

// ── AKILI BOLT ──────────────────────────────
// Replaces ⚡ — energy burst with node at center
export function AkiliBolt({ size = 20, className = '' }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      fill="none"
    >
      {/* Outer glow ring */}
      <circle
        cx="12" cy="12" r="10"
        fill="rgba(251,191,36,0.1)"
        stroke="rgba(251,191,36,0.25)"
        strokeWidth="1"
      />
      {/* Lightning bolt */}
      <path
        d="M13.5 3L6 13.5h6L10.5 21l8.5-10.5H13L13.5 3z"
        fill="#FBBF24"
        stroke="rgba(251,191,36,0.4)"
        strokeWidth="0.5"
        strokeLinejoin="round"
      />
      {/* Center node */}
      <circle cx="12" cy="12" r="2" fill="white" opacity="0.9" />
    </svg>
  )
}

// ── KNOWLEDGE ICON ───────────────────────────
// Baobab branch with a gold discovery node at apex
export function KnowledgeIcon({ size = 18, className = '' }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      fill="none"
    >
      {/* Trunk */}
      <path
        d="M12 22 C11.5 19 11 16 10.5 13"
        stroke="#5B21B6"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Branch left */}
      <path
        d="M11 14 Q7 9 3 5"
        stroke="#7C3AED"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      {/* Branch right */}
      <path
        d="M11 14 Q14 9 17 5"
        stroke="#7C3AED"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      {/* Branch center */}
      <path
        d="M11 14 Q11 9 11 3"
        stroke="#7C3AED"
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
      />
      {/* Tip nodes */}
      <circle cx="3"  cy="5" r="2"   fill="#8B5CF6" />
      <circle cx="17" cy="5" r="2"   fill="#A855F7" />
      {/* Apex gold node — the discovery point */}
      <circle cx="11" cy="3" r="2.5" fill="rgba(251,191,36,0.3)" />
      <circle cx="11" cy="3" r="2.5" fill="#FBBF24" />
    </svg>
  )
}

// ── COLLABORATION ICON ───────────────────────
// Two nodes with a gold arc forming between them
export function CollaborationIcon({ size = 18, className = '' }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      fill="none"
    >
      {/* Left researcher node */}
      <circle cx="4.5" cy="14" r="3.5" fill="rgba(139,92,246,0.2)" />
      <circle cx="4.5" cy="14" r="2.2" fill="#8B5CF6" />

      {/* Right researcher node */}
      <circle cx="19.5" cy="14" r="3.5" fill="rgba(168,85,247,0.2)" />
      <circle cx="19.5" cy="14" r="2.2" fill="#A855F7" />

      {/* Connection arc */}
      <path
        d="M7 14 Q12 4 17 14"
        stroke="#FBBF24"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />

      {/* Gold meeting point at arc apex */}
      <circle cx="12" cy="6.5" r="3"   fill="rgba(251,191,36,0.2)" />
      <circle cx="12" cy="6.5" r="2"   fill="#FBBF24" />
    </svg>
  )
}

// ── MENTORSHIP ICON ──────────────────────────
// Mother Node: gold mentor at center, purple
// mentee satellites — Ubuntu in visual form
export function MentorshipIcon({ size = 18, className = '' }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      fill="none"
    >
      {/* Connection lines */}
      <g stroke="rgba(196,181,253,0.55)" strokeWidth="1.2">
        <line x1="12" y1="9"  x2="12" y2="4"  />
        <line x1="12" y1="15" x2="12" y2="20" />
        <line x1="12" y1="12" x2="4"  y2="7"  />
        <line x1="12" y1="12" x2="20" y2="7"  />
        <line x1="12" y1="12" x2="4"  y2="17" />
        <line x1="12" y1="12" x2="20" y2="17" />
      </g>

      {/* Satellite mentee nodes */}
      <circle cx="12" cy="3"  r="2"   fill="#8B5CF6" />
      <circle cx="12" cy="21" r="2"   fill="#8B5CF6" />
      <circle cx="4"  cy="7"  r="1.8" fill="#A855F7" />
      <circle cx="20" cy="7"  r="1.8" fill="#A855F7" />
      <circle cx="4"  cy="17" r="1.8" fill="#8B5CF6" />
      <circle cx="20" cy="17" r="1.8" fill="#8B5CF6" />

      {/* Central mentor node — gold */}
      <circle cx="12" cy="12" r="5"   fill="rgba(217,119,6,0.15)" />
      <circle cx="12" cy="12" r="3.5" fill="#D97706" />
      <circle cx="12" cy="12" r="1.5" fill="rgba(255,255,255,0.8)" />
    </svg>
  )
}

// ── TECHNICAL ICON ───────────────────────────
// Convergence mark: 4 paths flowing to a gold center
export function TechnicalIcon({ size = 18, className = '' }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      fill="none"
    >
      {/* Incoming paths from corners */}
      <path d="M4 4 Q8 8 12 12"   stroke="#8B5CF6" strokeWidth="2"   strokeLinecap="round" />
      <path d="M20 4 Q16 8 12 12" stroke="#8B5CF6" strokeWidth="2"   strokeLinecap="round" />
      <path d="M4 20 Q8 16 12 12" stroke="#7C3AED" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M20 20 Q16 16 12 12" stroke="#7C3AED" strokeWidth="1.8" strokeLinecap="round" />

      {/* Corner source nodes */}
      <circle cx="4"  cy="4"  r="2.2" fill="#8B5CF6" />
      <circle cx="20" cy="4"  r="2.2" fill="#8B5CF6" />
      <circle cx="4"  cy="20" r="2"   fill="#A855F7" />
      <circle cx="20" cy="20" r="2"   fill="#A855F7" />

      {/* Central gold convergence point */}
      <circle cx="12" cy="12" r="5"   fill="rgba(251,191,36,0.15)" />
      <circle cx="12" cy="12" r="3.2" fill="#FBBF24" />
      <circle cx="12" cy="12" r="1.2" fill="white" opacity="0.9" />
    </svg>
  )
}
