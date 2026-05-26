'use client'

import { useRef, useEffect } from 'react'

interface ConstellationCanvasProps {
  interests: Array<{ name: string; weight: number }>
  akiliScore: number
  dimensions: {
    knowledge: number
    collaboration: number
    mentorship: number
    technical: number
  }
  collaborationCount: number
}

interface BGStar {
  x: number
  y: number
  r: number
  opacity: number
  twinkleOffset: number
  twinkleSpeed: number
}

interface CompanionStar {
  dx: number
  dy: number
  r: number
  opacity: number
}

interface ShootingStar {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
}

const STAR_COLORS = ['#FBBF24', '#67E8F9', '#C4B5FD', '#86EFAC', '#FDA4AF', '#FCA5A5', '#6EE7B7']
const DEFAULTS = [
  { name: 'Research', weight: 0.34 },
  { name: 'Collaboration', weight: 0.33 },
  { name: 'Discovery', weight: 0.33 },
]

function getStarPositions(W: number, H: number, n: number): [number, number][] {
  const cx = W * 0.70
  const cy = H * 0.50
  if (n === 1) return [[cx, cy]]
  if (n === 2) return [[W * 0.62, H * 0.40], [W * 0.80, H * 0.62]]
  if (n === 3) return [[W * 0.70, H * 0.30], [W * 0.86, H * 0.62], [W * 0.58, H * 0.68]]
  if (n === 4) return [
    [cx, H * 0.22],
    [cx + W * 0.14, cy],
    [cx, H * 0.75],
    [cx - W * 0.12, cy],
  ]
  // 5+ regular polygon
  const radius = Math.min(W * 0.17, H * 0.28)
  return Array.from({ length: n }, (_, i) => {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2
    return [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius] as [number, number]
  })
}

export function ConstellationCanvas({ interests }: ConstellationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const container = canvas.parentElement
    if (!container) return

    const activeInterests = interests.length > 0 ? interests.slice(0, 7) : DEFAULTS

    let rafId: number
    let time = 0
    let bgStars: BGStar[] = []
    let companions: CompanionStar[][] = []
    let shootingStar: ShootingStar | null = null
    let shootingStarTimer = 300 + Math.floor(Math.random() * 400)

    // Traveling particle state
    let travSegment = 0
    let travProgress = 0

    function initCanvas() {
      const W = container!.clientWidth
      const H = container!.clientHeight
      canvas!.width = W
      canvas!.height = H

      bgStars = Array.from({ length: 240 }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        r: 0.2 + Math.random() * 1.2,
        opacity: 0.08 + Math.random() * 0.35,
        twinkleOffset: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.01 + Math.random() * 0.03,
      }))

      companions = activeInterests.map(() =>
        Array.from({ length: 2 + Math.floor(Math.random() * 5) }, () => ({
          dx: (Math.random() - 0.5) * 130,
          dy: (Math.random() - 0.5) * 130,
          r: 0.6 + Math.random() * 1.6,
          opacity: 0.2 + Math.random() * 0.4,
        }))
      )
    }

    function draw() {
      const W = canvas!.width
      const H = canvas!.height
      const ctx = canvas!.getContext('2d')!

      ctx.fillStyle = '#030812'
      ctx.fillRect(0, 0, W, H)

      // Nebula: 3 overlapping radial gradients
      const nebulaCx = W * 0.68
      const nebulaCy = H * 0.48
      const nebulaConfigs = [
        { cx: nebulaCx - 40, cy: nebulaCy + 20, r: 160, color: '245,158,11', alpha: 0.05 },
        { cx: nebulaCx + 50, cy: nebulaCy - 30, r: 140, color: '34,211,238', alpha: 0.04 },
        { cx: nebulaCx,      cy: nebulaCy,      r: 180, color: '139,92,246', alpha: 0.06 },
      ]
      for (const nb of nebulaConfigs) {
        const g = ctx.createRadialGradient(nb.cx, nb.cy, 0, nb.cx, nb.cy, nb.r)
        g.addColorStop(0, `rgba(${nb.color},${nb.alpha})`)
        g.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(nb.cx, nb.cy, nb.r, 0, Math.PI * 2)
        ctx.fill()
      }

      // Background stars with twinkling
      for (const s of bgStars) {
        const t = Math.sin(time * s.twinkleSpeed + s.twinkleOffset) * 0.5 + 0.5
        const opacity = s.opacity * (0.6 + 0.4 * t)
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${opacity})`
        ctx.fill()
      }

      // Planisphere grid in right 55% of canvas
      ctx.save()
      ctx.strokeStyle = 'rgba(34,211,238,0.04)'
      ctx.lineWidth = 0.5
      const gridLeft = W * 0.45
      const gridStep = 28
      for (let x = gridLeft; x <= W; x += gridStep) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, H)
        ctx.stroke()
      }
      for (let y = 0; y <= H; y += gridStep) {
        ctx.beginPath()
        ctx.moveTo(gridLeft, y)
        ctx.lineTo(W, y)
        ctx.stroke()
      }
      ctx.restore()

      // Dashed circle around constellation center
      const cx = W * 0.70
      const cy = H * 0.50
      ctx.save()
      ctx.strokeStyle = 'rgba(34,211,238,0.06)'
      ctx.lineWidth = 0.5
      ctx.setLineDash([4, 8])
      ctx.beginPath()
      ctx.arc(cx, cy, 100, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.restore()

      const positions = getStarPositions(W, H, activeInterests.length)
      const n = positions.length

      // Build all line segments (all pairs)
      const segments: [number, number][] = []
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          segments.push([i, j])
        }
      }

      // Draw constellation lines
      for (const [a, b] of segments) {
        const [ax, ay] = positions[a]
        const [bx, by] = positions[b]

        // Glow pass
        ctx.beginPath()
        ctx.moveTo(ax, ay)
        ctx.lineTo(bx, by)
        ctx.strokeStyle = 'rgba(251,191,36,0.25)'
        ctx.lineWidth = 4
        ctx.stroke()

        // Main line
        ctx.beginPath()
        ctx.moveTo(ax, ay)
        ctx.lineTo(bx, by)
        ctx.strokeStyle = 'rgba(251,191,36,0.45)'
        ctx.lineWidth = 1.2
        ctx.stroke()
      }

      // Traveling particle along segments
      if (segments.length > 0) {
        travProgress += 0.003
        if (travProgress >= 1) {
          travProgress = 0
          travSegment = (travSegment + 1) % segments.length
        }

        const [sa, sb] = segments[travSegment % segments.length]
        const [x1, y1] = positions[sa]
        const [x2, y2] = positions[sb]
        const px = x1 + (x2 - x1) * travProgress
        const py = y1 + (y2 - y1) * travProgress

        // Trail
        const trailStart = Math.max(0, travProgress - 0.12)
        const tx1 = x1 + (x2 - x1) * trailStart
        const ty1 = y1 + (y2 - y1) * trailStart
        const trailGrad = ctx.createLinearGradient(tx1, ty1, px, py)
        trailGrad.addColorStop(0, 'rgba(251,191,36,0)')
        trailGrad.addColorStop(1, 'rgba(251,191,36,0.5)')
        ctx.beginPath()
        ctx.moveTo(tx1, ty1)
        ctx.lineTo(px, py)
        ctx.strokeStyle = trailGrad
        ctx.lineWidth = 2
        ctx.stroke()

        // Particle
        ctx.save()
        ctx.shadowBlur = 14
        ctx.shadowColor = 'rgba(251,191,36,0.9)'
        ctx.beginPath()
        ctx.arc(px, py, 3.5, 0, Math.PI * 2)
        ctx.fillStyle = '#FBBF24'
        ctx.fill()
        ctx.restore()
      }

      // Main constellation stars
      for (let i = 0; i < n; i++) {
        const [sx, sy] = positions[i]
        const interest = activeInterests[i]
        const color = STAR_COLORS[i % STAR_COLORS.length]
        const pulse = 1 + Math.sin(time * 0.03 + i * 2.1) * 0.08
        const r = (5 + interest.weight * 12) * pulse

        // Companion stars
        if (companions[i]) {
          for (const comp of companions[i]) {
            ctx.beginPath()
            ctx.arc(sx + comp.dx, sy + comp.dy, comp.r, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(255,255,255,${comp.opacity})`
            ctx.fill()
          }
        }

        // Multi-layer glow (4 concentric)
        const glowLayers = [
          { r: r * 4.5, alpha: 0.04 },
          { r: r * 3.0, alpha: 0.08 },
          { r: r * 1.8, alpha: 0.15 },
          { r: r * 1.1, alpha: 0.35 },
        ]
        const [cr, cg, cb] = parseHex(color)
        for (const gl of glowLayers) {
          const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, gl.r)
          g.addColorStop(0, `rgba(${cr},${cg},${cb},${gl.alpha})`)
          g.addColorStop(1, 'rgba(0,0,0,0)')
          ctx.fillStyle = g
          ctx.beginPath()
          ctx.arc(sx, sy, gl.r, 0, Math.PI * 2)
          ctx.fill()
        }

        // Star body
        ctx.beginPath()
        ctx.arc(sx, sy, r, 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.fill()

        // White-hot center
        ctx.beginPath()
        ctx.arc(sx, sy, r * 0.4, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255,255,255,0.95)'
        ctx.fill()

        // 4-point cross lines
        const crossLen = r * 2.4
        ctx.save()
        ctx.strokeStyle = `rgba(${cr},${cg},${cb},0.6)`
        ctx.lineWidth = 0.8
        for (let a = 0; a < 4; a++) {
          const angle = (a / 4) * Math.PI * 2
          ctx.beginPath()
          ctx.moveTo(sx + Math.cos(angle) * r * 1.1, sy + Math.sin(angle) * r * 1.1)
          ctx.lineTo(sx + Math.cos(angle) * crossLen, sy + Math.sin(angle) * crossLen)
          ctx.stroke()
        }
        ctx.restore()

        // Interest label
        ctx.save()
        ctx.font = '8.5px monospace'
        ctx.fillStyle = `rgba(${cr},${cg},${cb},0.7)`
        ctx.textAlign = 'center'
        ctx.fillText(interest.name, sx, sy + r + 14)
        ctx.restore()
      }

      // Shooting star
      shootingStarTimer--
      if (shootingStarTimer <= 0 && !shootingStar) {
        shootingStar = {
          x: Math.random() * W * 0.4,
          y: Math.random() * H * 0.3,
          vx: 4 + Math.random() * 3,
          vy: 2 + Math.random() * 2,
          life: 0,
          maxLife: 50 + Math.floor(Math.random() * 30),
        }
        shootingStarTimer = 300 + Math.floor(Math.random() * 400)
      }

      if (shootingStar) {
        const s = shootingStar
        s.x += s.vx
        s.y += s.vy
        s.life++
        const fade = 1 - s.life / s.maxLife
        const trailLen = 30

        ctx.save()
        const sg = ctx.createLinearGradient(
          s.x - s.vx * trailLen / s.vx, s.y - s.vy * trailLen / s.vx,
          s.x, s.y
        )
        sg.addColorStop(0, 'rgba(255,255,255,0)')
        sg.addColorStop(1, `rgba(255,255,255,${fade * 0.8})`)
        ctx.beginPath()
        ctx.moveTo(s.x - s.vx * 8, s.y - s.vy * 8)
        ctx.lineTo(s.x, s.y)
        ctx.strokeStyle = sg
        ctx.lineWidth = 1.5
        ctx.stroke()

        ctx.beginPath()
        ctx.arc(s.x, s.y, 1.5 * fade, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${fade})`
        ctx.fill()
        ctx.restore()

        if (s.life >= s.maxLife || s.x > W || s.y > H) {
          shootingStar = null
        }
      }

      time++
      rafId = requestAnimationFrame(draw)
    }

    initCanvas()
    rafId = requestAnimationFrame(draw)

    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(rafId)
      initCanvas()
      rafId = requestAnimationFrame(draw)
    })
    observer.observe(container)

    return () => {
      cancelAnimationFrame(rafId)
      observer.disconnect()
    }
  }, [interests])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    />
  )
}

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ]
}
