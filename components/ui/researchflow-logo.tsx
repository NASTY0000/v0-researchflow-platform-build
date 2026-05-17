import { useId } from 'react'

interface ResearchFlowLogoProps {
  size?: number
  showText?: boolean
  className?: string
}

export function ResearchFlowLogo({ size = 40, showText = true, className = '' }: ResearchFlowLogoProps) {
  const id = useId().replace(/:/g, '')
  const scale = size / 40

  // Africa-shaped network nodes (normalized to ~40x40 viewBox centered)
  // Representing key geographic points of Africa as network nodes
  const nodes = [
    { x: 20, y: 5,  r: 2.2, color: '#22D3EE', glow: true  },   // North (Morocco area)
    { x: 14, y: 10, r: 1.5, color: '#818CF8', glow: false },   // NW coast
    { x: 26, y: 9,  r: 1.5, color: '#818CF8', glow: false },   // NE (Egypt)
    { x: 10, y: 17, r: 1.8, color: '#22D3EE', glow: true  },   // West Africa
    { x: 20, y: 16, r: 1.4, color: '#C084FC', glow: false },   // Central N
    { x: 28, y: 14, r: 1.4, color: '#C084FC', glow: false },   // East Africa N
    { x: 8,  y: 24, r: 1.5, color: '#818CF8', glow: false },   // West coast
    { x: 15, y: 24, r: 2.0, color: '#F472B6', glow: true  },   // Central Africa
    { x: 25, y: 22, r: 1.5, color: '#818CF8', glow: false },   // East Africa
    { x: 30, y: 20, r: 1.4, color: '#22D3EE', glow: true  },   // Horn of Africa
    { x: 18, y: 30, r: 1.5, color: '#C084FC', glow: false },   // Southern Central
    { x: 27, y: 29, r: 1.4, color: '#818CF8', glow: false },   // SE Africa
    { x: 20, y: 36, r: 1.8, color: '#22D3EE', glow: true  },   // South Africa tip
  ]

  // Connection edges between nodes
  const edges = [
    [0, 1], [0, 2], [0, 4],
    [1, 3], [1, 4],
    [2, 4], [2, 5],
    [3, 6], [3, 7],
    [4, 5], [4, 7],
    [5, 8], [5, 9],
    [6, 7],
    [7, 8], [7, 10],
    [8, 9], [8, 11],
    [10, 11], [10, 12],
    [11, 12],
  ]

  // Scattered background particles
  const particles = [
    { x: 3,  y: 8  }, { x: 35, y: 5  }, { x: 2,  y: 20 },
    { x: 36, y: 18 }, { x: 5,  y: 32 }, { x: 33, y: 32 },
    { x: 12, y: 3  }, { x: 28, y: 3  }, { x: 1,  y: 14 },
    { x: 38, y: 28 }, { x: 7,  y: 38 }, { x: 32, y: 38 },
  ]

  const iconSize = 40
  // Total SVG width: icon + gap + text (if shown)
  const textWidth = showText ? 88 : 0
  const svgWidth = (iconSize + (showText ? 6 + textWidth : 0))
  const svgHeight = iconSize

  return (
    <svg
      width={svgWidth * scale}
      height={svgHeight * scale}
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="ResearchFlow"
    >
      <defs>
        {/* Glow filter for glowing nodes */}
        <filter id={`${id}-glow`} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* Subtle overall glow for the icon area */}
        <filter id={`${id}-soft`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* Gradient for "Research" text */}
        <linearGradient id={`${id}-text1`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#A855F7" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
        {/* Gradient for "Flow" text */}
        <linearGradient id={`${id}-text2`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#22D3EE" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
        {/* Orbital ring gradient - back half (dimmer) */}
        <linearGradient id={`${id}-ringBack`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6D28D9" stopOpacity="0.25" />
          <stop offset="50%" stopColor="#22D3EE" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#6D28D9" stopOpacity="0.25" />
        </linearGradient>
        {/* Orbital ring gradient - front half (brighter) */}
        <linearGradient id={`${id}-ringFront`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.7" />
          <stop offset="50%" stopColor="#22D3EE" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.7" />
        </linearGradient>
        {/* Clip for back half of ring (top) */}
        <clipPath id={`${id}-ringBackClip`}>
          <rect x="0" y="0" width={iconSize} height={iconSize / 2} />
        </clipPath>
        {/* Clip for front half of ring (bottom) */}
        <clipPath id={`${id}-ringFrontClip`}>
          <rect x="0" y={iconSize / 2} width={iconSize} height={iconSize / 2} />
        </clipPath>
      </defs>

      {/* ── Icon area (40×40) ── */}

      {/* Background particles */}
      {particles.map((p, i) => (
        <circle
          key={`p-${i}`}
          cx={p.x}
          cy={p.y}
          r={0.5}
          fill="#6D28D9"
          opacity={0.4}
        />
      ))}

      {/* Orbital ring — back half (behind Africa) */}
      <ellipse
        cx={20}
        cy={20}
        rx={17}
        ry={6.5}
        stroke={`url(#${id}-ringBack)`}
        strokeWidth="1.2"
        fill="none"
        clipPath={`url(#${id}-ringBackClip)`}
        strokeDasharray="3 1.5"
      />

      {/* Connection lines between nodes */}
      <g opacity={0.45} filter={`url(#${id}-soft)`}>
        {edges.map(([a, b], i) => (
          <line
            key={`e-${i}`}
            x1={nodes[a].x}
            y1={nodes[a].y}
            x2={nodes[b].x}
            y2={nodes[b].y}
            stroke="#6D28D9"
            strokeWidth="0.6"
            opacity={0.7}
          />
        ))}
      </g>

      {/* Non-glowing nodes */}
      {nodes.filter(n => !n.glow).map((node, i) => (
        <circle
          key={`n-${i}`}
          cx={node.x}
          cy={node.y}
          r={node.r}
          fill={node.color}
          opacity={0.75}
        />
      ))}

      {/* Glowing nodes (rendered on top with filter) */}
      {nodes.filter(n => n.glow).map((node, i) => (
        <circle
          key={`ng-${i}`}
          cx={node.x}
          cy={node.y}
          r={node.r}
          fill={node.color}
          filter={`url(#${id}-glow)`}
        />
      ))}

      {/* Orbital ring — front half (in front of Africa) */}
      <ellipse
        cx={20}
        cy={20}
        rx={17}
        ry={6.5}
        stroke={`url(#${id}-ringFront)`}
        strokeWidth="1.4"
        fill="none"
        clipPath={`url(#${id}-ringFrontClip)`}
      />

      {/* ── Text area ── */}
      {showText && (
        <g transform={`translate(${iconSize + 6}, 0)`}>
          {/* "Research" */}
          <text
            x={0}
            y={16}
            fontFamily="inherit"
            fontSize="10"
            fontWeight="700"
            fill={`url(#${id}-text1)`}
            letterSpacing="-0.2"
          >
            Research
          </text>
          {/* "Flow" */}
          <text
            x={0}
            y={28}
            fontFamily="inherit"
            fontSize="10"
            fontWeight="700"
            fill={`url(#${id}-text2)`}
            letterSpacing="-0.2"
          >
            Flow
          </text>
          {/* Subtitle */}
          <text
            x={0}
            y={37}
            fontFamily="inherit"
            fontSize="5.5"
            fontWeight="400"
            fill="#6D28D9"
            opacity={0.6}
            letterSpacing="0.3"
          >
            AFRICA
          </text>
        </g>
      )}
    </svg>
  )
}
