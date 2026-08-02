'use client'

import { useRef, useEffect } from 'react'

interface BaobabCanvasProps {
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

interface Particle {
  x: number; y: number
  vx: number; vy: number
  r: number; opacity: number
}

const DEFAULTS = [
  { name: 'Research', weight: 0.34 },
  { name: 'Collaboration', weight: 0.33 },
  { name: 'Discovery', weight: 0.33 },
]

export function BaobabCanvas({ interests, akiliScore, dimensions }: BaobabCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const container = canvas.parentElement
    if (!container) return

    const active = interests.length > 0 ? interests.slice(0, 7) : DEFAULTS

    let rafId: number
    let time = 0
    let particles: Particle[] = []

    function resize() {
      // Use offsetWidth/offsetHeight so we match the actual rendered CSS size
      canvas!.width = container!.offsetWidth || container!.clientWidth
      canvas!.height = container!.offsetHeight || container!.clientHeight

      const W = canvas!.width
      const H = canvas!.height
      particles = Array.from({ length: 28 }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: 0.6 + Math.random() * 2.0,
        opacity: 0.12 + Math.random() * 0.32,
      }))
    }

    function draw() {
      const W = canvas!.width
      const H = canvas!.height
      if (W === 0 || H === 0) { rafId = requestAnimationFrame(draw); return }
      const ctx = canvas!.getContext('2d')!

      // Clear every frame
      ctx.fillStyle = '#05010F'
      ctx.fillRect(0, 0, W, H)

      // Drifting particles
      ctx.save()
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(139,92,246,${p.opacity})`
        ctx.fill()
      }
      ctx.restore()

      // Junction point: trunk meets branches
      const jx = W * 0.72
      const jy = H * 0.88

      // Ambient aura, drawn BEFORE branches
      const aura = ctx.createRadialGradient(jx, H, 0, jx, H * 0.5, W * 0.7)
      aura.addColorStop(0, 'rgba(245,158,11,0.18)')
      aura.addColorStop(0.4, 'rgba(124,58,237,0.08)')
      aura.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = aura
      ctx.fillRect(0, 0, W, H)

      // Trunk: from jy down to bottom
      const trunkWidth = 14 + (akiliScore / 2500) * 22
      const trunkGrad = ctx.createLinearGradient(jx, jy, jx, H)
      trunkGrad.addColorStop(0, '#5B21B6')
      trunkGrad.addColorStop(1, '#2E1065')
      ctx.fillStyle = trunkGrad
      ctx.beginPath()
      ctx.moveTo(jx - trunkWidth * 0.4, jy)
      ctx.lineTo(jx + trunkWidth * 0.4, jy)
      ctx.lineTo(jx + trunkWidth, H)
      ctx.lineTo(jx - trunkWidth, H)
      ctx.closePath()
      ctx.fill()

      // Branches
      const n = active.length
      const spreadRad = (110 * Math.PI) / 180
      // Branches point upward, angle 0 = right, so upward is -PI/2
      // Spread from (−PI/2 − spread/2) to (−PI/2 + spread/2)
      const baseAngle = -Math.PI / 2
      const maxBranchLen = H * 0.82

      type NodePos = { x: number; y: number; r: number }
      const nodes: NodePos[] = []
      let apexNode: NodePos | null = null
      let lowestY = Infinity

      for (let i = 0; i < n; i++) {
        const t = n === 1 ? 0.5 : i / (n - 1)
        const angle = baseAngle - spreadRad / 2 + t * spreadRad
        const interest = active[i]
        const branchLen = maxBranchLen * (0.55 + interest.weight * 0.45)
        const strokeW = 5 + interest.weight * 4

        const bx = jx + Math.cos(angle) * branchLen
        const by = jy + Math.sin(angle) * branchLen

        // Branch with glow
        ctx.save()
        ctx.shadowBlur = 12
        ctx.shadowColor = 'rgba(124,58,237,0.7)'
        ctx.beginPath()
        ctx.moveTo(jx, jy)
        ctx.lineTo(bx, by)
        ctx.strokeStyle = '#7C3AED'
        ctx.lineWidth = strokeW
        ctx.lineCap = 'round'
        ctx.stroke()
        ctx.restore()

        // Node
        const pulse = 1 + Math.sin(time * 0.04 + i * 1.8) * 0.12
        const nodeR = (8 + interest.weight * 10) * pulse
        const nodeColor = i % 2 === 0 ? '#8B5CF6' : '#A855F7'

        // Node glow
        const glow = ctx.createRadialGradient(bx, by, 0, bx, by, nodeR * 2.8)
        glow.addColorStop(0, 'rgba(139,92,246,0.4)')
        glow.addColorStop(1, 'rgba(139,92,246,0)')
        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(bx, by, nodeR * 2.8, 0, Math.PI * 2)
        ctx.fill()

        ctx.save()
        ctx.shadowBlur = 14
        ctx.shadowColor = 'rgba(139,92,246,0.8)'
        ctx.beginPath()
        ctx.arc(bx, by, nodeR, 0, Math.PI * 2)
        ctx.fillStyle = nodeColor
        ctx.fill()
        ctx.restore()

        nodes.push({ x: bx, y: by, r: nodeR })
        if (by < lowestY) { lowestY = by; apexNode = { x: bx, y: by, r: nodeR } }
      }

      // Canopy arcs between adjacent nodes
      ctx.save()
      ctx.strokeStyle = 'rgba(196,181,253,0.45)'
      ctx.lineWidth = 1.4
      for (let i = 0; i < nodes.length - 1; i++) {
        const a = nodes[i]; const b = nodes[i + 1]
        const cpx = (a.x + b.x) / 2
        const cpy = Math.min(a.y, b.y) - 18
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.quadraticCurveTo(cpx, cpy, b.x, b.y)
        ctx.stroke()
      }
      ctx.restore()

      // Gold apex
      if (apexNode) {
        const { x: ax, y: ay } = apexNode
        const coreR = 10 + (dimensions.knowledge / 20)

        // Three glow rings
        for (const [mult, alpha] of [[3.0, 0.08], [2.0, 0.15], [1.2, 0.30]] as [number, number][]) {
          const g = ctx.createRadialGradient(ax, ay, 0, ax, ay, coreR * mult)
          g.addColorStop(0, `rgba(251,191,36,${alpha})`)
          g.addColorStop(1, 'rgba(251,191,36,0)')
          ctx.fillStyle = g
          ctx.beginPath()
          ctx.arc(ax, ay, coreR * mult, 0, Math.PI * 2)
          ctx.fill()
        }

        ctx.save()
        ctx.shadowBlur = 20
        ctx.shadowColor = 'rgba(251,191,36,1.0)'
        ctx.beginPath()
        ctx.arc(ax, ay, coreR, 0, Math.PI * 2)
        ctx.fillStyle = '#FBBF24'
        ctx.fill()
        ctx.restore()
      }

      time++
      rafId = requestAnimationFrame(draw)
    }

    resize()
    rafId = requestAnimationFrame(draw)

    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(rafId)
      resize()
      rafId = requestAnimationFrame(draw)
    })
    ro.observe(container)

    return () => {
      cancelAnimationFrame(rafId)
      ro.disconnect()
    }
  }, [interests, akiliScore, dimensions])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'block',
      }}
    />
  )
}
