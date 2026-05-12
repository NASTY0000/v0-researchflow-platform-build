'use client'

import { useEffect, useRef, useState } from 'react'

// Particle Field Canvas
function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setIsMobile(window.innerWidth < 768)
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = document.documentElement.scrollHeight
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    const colors = ['#7C3AED', '#C084FC', '#06B6D4']
    const particleCount = isMobile ? 60 : 120
    const particles: Array<{
      x: number
      y: number
      radius: number
      color: string
      opacity: number
      vx: number
      vy: number
    }> = []

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: 1 + Math.random() * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: (isMobile ? 0.2 : 0.3) + Math.random() * 0.3,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
      })
    }

    let animationId: number
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.forEach((p) => {
        p.x += p.vx
        p.y += p.vy

        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.globalAlpha = p.opacity
        ctx.fill()
        ctx.globalAlpha = 1
      })

      animationId = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      cancelAnimationFrame(animationId)
    }
  }, [isMobile])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none select-none"
      style={{ zIndex: 0 }}
    />
  )
}

// Ambient Glow Pools
function AmbientGlows() {
  return (
    <div className="fixed inset-0 pointer-events-none select-none overflow-hidden" style={{ zIndex: 0 }}>
      {/* Pool 1 - Hero top-right */}
      <div
        className="absolute"
        style={{
          top: '-100px',
          right: '-150px',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(ellipse, rgba(91,33,182,0.20) 0%, transparent 70%)',
        }}
      />
      {/* Pool 2 - Mid-page bottom-left */}
      <div
        className="absolute"
        style={{
          top: '50%',
          left: '-150px',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(ellipse, rgba(14,116,144,0.15) 0%, transparent 70%)',
        }}
      />
      {/* Pool 3 - Bottom center */}
      <div
        className="absolute"
        style={{
          bottom: '-100px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '700px',
          height: '400px',
          background: 'radial-gradient(ellipse, rgba(124,58,237,0.18) 0%, transparent 70%)',
        }}
      />
    </div>
  )
}

// 3D Node Network - Hero Section
function NodeNetwork() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setIsMobile(window.innerWidth < 768)
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const nodes = [
    { cx: 50, cy: 80, r: 45, color: '#7C3AED' },
    { cx: 150, cy: 40, r: 30, color: '#C084FC' },
    { cx: 180, cy: 130, r: 35, color: '#06B6D4' },
    { cx: 80, cy: 180, r: 25, color: '#A855F7' },
    { cx: 200, cy: 220, r: 40, color: '#7C3AED' },
    { cx: 250, cy: 100, r: 20, color: '#06B6D4' },
    { cx: 120, cy: 260, r: 28, color: '#C084FC' },
  ]

  const connections = [
    [0, 1], [0, 2], [0, 3], [1, 2], [1, 5], [2, 4], [2, 5], [3, 4], [3, 6], [4, 6]
  ]

  return (
    <div
      className="absolute pointer-events-none select-none will-change-transform"
      style={{
        right: isMobile ? '50%' : '5%',
        top: isMobile ? 'auto' : '50%',
        bottom: isMobile ? '0' : 'auto',
        transform: isMobile ? 'translateX(50%)' : 'translateY(-50%)',
        opacity: isMobile ? 0.2 : 0.4,
        animation: 'float 6s ease-in-out infinite',
      }}
    >
      <svg width="300" height="320" viewBox="0 0 300 320">
        <defs>
          {nodes.map((node, i) => (
            <radialGradient key={`grad-${i}`} id={`node-grad-${i}`}>
              <stop offset="0%" stopColor="white" stopOpacity="0.9" />
              <stop offset="40%" stopColor={node.color} stopOpacity="0.8" />
              <stop offset="100%" stopColor="#3D1280" stopOpacity="0.6" />
            </radialGradient>
          ))}
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Connections */}
        {connections.map(([a, b], i) => (
          <line
            key={`line-${i}`}
            x1={nodes[a].cx}
            y1={nodes[a].cy}
            x2={nodes[b].cx}
            y2={nodes[b].cy}
            stroke="rgba(167,139,250,0.4)"
            strokeWidth="1.5"
          />
        ))}

        {/* Nodes */}
        {nodes.map((node, i) => (
          <circle
            key={`node-${i}`}
            cx={node.cx}
            cy={node.cy}
            r={node.r}
            fill={`url(#node-grad-${i})`}
            filter="url(#glow)"
          />
        ))}
      </svg>
    </div>
  )
}

// DNA Helix - Features Section
function DNAHelix() {
  return (
    <div
      className="absolute pointer-events-none select-none will-change-transform hidden md:block"
      style={{
        left: '-40px',
        top: '50%',
        transform: 'translateY(-50%)',
        opacity: 0.45,
        animation: 'rotateY 8s linear infinite',
        perspective: '500px',
      }}
    >
      <svg width="120" height="400" viewBox="0 0 120 400">
        <defs>
          <filter id="helix-glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Generate DNA helix paths */}
        {Array.from({ length: 20 }).map((_, i) => {
          const y = i * 20
          const x1 = 30 + Math.sin((i * 0.5)) * 25
          const x2 = 90 - Math.sin((i * 0.5)) * 25
          return (
            <g key={i}>
              {/* Rung */}
              <line
                x1={x1}
                y1={y}
                x2={x2}
                y2={y}
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="1"
              />
              {/* Left strand node */}
              <circle
                cx={x1}
                cy={y}
                r="4"
                fill="#7C3AED"
                filter="url(#helix-glow)"
              />
              {/* Right strand node */}
              <circle
                cx={x2}
                cy={y}
                r="4"
                fill="#06B6D4"
                filter="url(#helix-glow)"
              />
            </g>
          )
        })}

        {/* Strand paths */}
        <path
          d={`M ${30 + Math.sin(0) * 25} 0 ${Array.from({ length: 20 }).map((_, i) => `L ${30 + Math.sin(i * 0.5) * 25} ${i * 20}`).join(' ')}`}
          fill="none"
          stroke="#7C3AED"
          strokeWidth="2.5"
          opacity="0.7"
        />
        <path
          d={`M ${90 - Math.sin(0) * 25} 0 ${Array.from({ length: 20 }).map((_, i) => `L ${90 - Math.sin(i * 0.5) * 25} ${i * 20}`).join(' ')}`}
          fill="none"
          stroke="#06B6D4"
          strokeWidth="2.5"
          opacity="0.7"
        />
      </svg>
    </div>
  )
}

// Molecular Structure - Stats Section
function MolecularStructure() {
  return (
    <div
      className="absolute pointer-events-none select-none will-change-transform hidden md:block"
      style={{
        right: '-50px',
        top: '50%',
        transform: 'translateY(-50%)',
        opacity: 0.35,
        animation: 'rotate 12s linear infinite',
      }}
    >
      <svg width="200" height="200" viewBox="0 0 200 200">
        <defs>
          <radialGradient id="center-mol">
            <stop offset="0%" stopColor="white" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#5B21B6" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#3D1280" stopOpacity="0.7" />
          </radialGradient>
          <filter id="mol-glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Connections */}
        {[0, 60, 120, 180, 240, 300].map((angle, i) => {
          const x = 100 + Math.cos((angle * Math.PI) / 180) * 60
          const y = 100 + Math.sin((angle * Math.PI) / 180) * 60
          return (
            <line
              key={`conn-${i}`}
              x1="100"
              y1="100"
              x2={x}
              y2={y}
              stroke="rgba(167,139,250,0.5)"
              strokeWidth="1.5"
            />
          )
        })}

        {/* Center sphere */}
        <circle cx="100" cy="100" r="30" fill="url(#center-mol)" filter="url(#mol-glow)" />
        <circle cx="92" cy="92" r="4" fill="white" opacity="0.7" />

        {/* Orbiting spheres */}
        {[0, 60, 120, 180, 240, 300].map((angle, i) => {
          const x = 100 + Math.cos((angle * Math.PI) / 180) * 60
          const y = 100 + Math.sin((angle * Math.PI) / 180) * 60
          const r = 12 + (i % 2) * 6
          const color = i % 2 === 0 ? '#7C3AED' : '#0E7490'
          return (
            <g key={`orb-${i}`}>
              <circle cx={x} cy={y} r={r} fill={color} filter="url(#mol-glow)" />
              <circle cx={x - 3} cy={y - 3} r="3" fill="white" opacity="0.7" />
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// Footer Scattered Nodes
function FooterNodes() {
  const nodes = [
    { x: '5%', y: '20%', r: 12, color: '#7C3AED', delay: 0 },
    { x: '92%', y: '30%', r: 18, color: '#06B6D4', delay: 1 },
    { x: '8%', y: '70%', r: 10, color: '#C084FC', delay: 2 },
    { x: '88%', y: '75%', r: 14, color: '#A855F7', delay: 0.5 },
  ]

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
      {nodes.map((node, i) => (
        <div
          key={i}
          className="absolute rounded-full will-change-transform"
          style={{
            left: node.x,
            top: node.y,
            width: node.r * 2,
            height: node.r * 2,
            background: `radial-gradient(circle, white 0%, ${node.color} 50%, transparent 100%)`,
            filter: `blur(1px) drop-shadow(0 0 8px ${node.color})`,
            animation: `pulse ${2 + i * 0.5}s ease-in-out infinite`,
            animationDelay: `${node.delay}s`,
          }}
        />
      ))}
    </div>
  )
}

// Main export with section-specific illustrations
export function HeroIllustrations() {
  return <NodeNetwork />
}

export function FeaturesIllustrations() {
  return <DNAHelix />
}

export function StatsIllustrations() {
  return <MolecularStructure />
}

export function FooterIllustrations() {
  return <FooterNodes />
}

export function GlobalIllustrations() {
  return (
    <>
      <ParticleField />
      <AmbientGlows />
    </>
  )
}
