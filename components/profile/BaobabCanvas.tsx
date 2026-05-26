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
  x: number
  y: number
  vx: number
  vy: number
  r: number
  opacity: number
}

const DEFAULTS = [
  { name: 'Research', weight: 0.34 },
  { name: 'Collaboration', weight: 0.33 },
  { name: 'Discovery', weight: 0.33 },
]

export function BaobabCanvas({ interests, akiliScore }: BaobabCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const container = canvas.parentElement
    if (!container) return

    const activeInterests = interests.length > 0 ? interests.slice(0, 7) : DEFAULTS

    let rafId: number
    let time = 0
    let particles: Particle[] = []

    function initCanvas() {
      const W = container!.clientWidth
      const H = container!.clientHeight
      canvas!.width = W
      canvas!.height = H

      particles = Array.from({ length: 28 }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: 0.4 + Math.random() * 1.8,
        opacity: 0.1 + Math.random() * 0.3,
      }))
    }

    function draw() {
      const W = canvas!.width
      const H = canvas!.height
      const ctx = canvas!.getContext('2d')!

      ctx.fillStyle = '#05010F'
      ctx.fillRect(0, 0, W, H)

      // Drift particles
      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0) p.x = W
        if (p.x > W) p.x = 0
        if (p.y < 0) p.y = H
        if (p.y > H) p.y = 0
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(139,92,246,${p.opacity})`
        ctx.fill()
      }

      const trunkX = W * 0.72
      const trunkBase = H
      const trunkWidth = 14 + (akiliScore / 2500) * 20
      const trunkHeight = H * 0.38
      const trunkTopY = trunkBase - trunkHeight
      const trunkTopWidth = trunkWidth * 0.5

      // Amber glow at base
      const baseGlow = ctx.createRadialGradient(trunkX, trunkBase, 0, trunkX, trunkBase, 100)
      baseGlow.addColorStop(0, 'rgba(245,158,11,0.25)')
      baseGlow.addColorStop(1, 'rgba(245,158,11,0)')
      ctx.fillStyle = baseGlow
      ctx.beginPath()
      ctx.arc(trunkX, trunkBase, 100, 0, Math.PI * 2)
      ctx.fill()

      // Trunk
      const trunkGrad = ctx.createLinearGradient(trunkX, trunkTopY, trunkX, trunkBase)
      trunkGrad.addColorStop(0, '#5B21B6')
      trunkGrad.addColorStop(1, '#2E1065')
      ctx.fillStyle = trunkGrad
      ctx.beginPath()
      ctx.moveTo(trunkX - trunkTopWidth, trunkTopY)
      ctx.lineTo(trunkX + trunkTopWidth, trunkTopY)
      ctx.lineTo(trunkX + trunkWidth, trunkBase)
      ctx.lineTo(trunkX - trunkWidth, trunkBase)
      ctx.closePath()
      ctx.fill()

      const numBranches = activeInterests.length
      const spreadAngle = (110 * Math.PI) / 180
      const startAngle = -Math.PI / 2 - spreadAngle / 2

      type NodePos = { x: number; y: number; r: number }
      const nodes: NodePos[] = []
      let apexNode: NodePos | null = null
      let highestY = Infinity

      for (let i = 0; i < numBranches; i++) {
        const t = numBranches === 1 ? 0.5 : i / (numBranches - 1)
        const angle = startAngle + t * spreadAngle
        const interest = activeInterests[i]
        const branchLen = 60 + interest.weight * 100
        const thickness = 3.5 + interest.weight * 5

        const bx = trunkX + Math.cos(angle) * branchLen
        const by = trunkTopY + Math.sin(angle) * branchLen

        ctx.beginPath()
        ctx.moveTo(trunkX, trunkTopY)
        ctx.lineTo(bx, by)
        ctx.strokeStyle = '#7C3AED'
        ctx.lineWidth = thickness
        ctx.stroke()

        const pulse = 1 + Math.sin(time * 0.04 + i * 1.8) * 0.12
        const nodeR = (7 + interest.weight * 8) * pulse
        const nodeColor = i % 2 === 0 ? '#8B5CF6' : '#A855F7'

        ctx.beginPath()
        ctx.arc(bx, by, nodeR, 0, Math.PI * 2)
        ctx.fillStyle = nodeColor
        ctx.fill()

        nodes.push({ x: bx, y: by, r: nodeR })

        if (by < highestY) {
          highestY = by
          apexNode = { x: bx, y: by, r: nodeR }
        }
      }

      // Canopy arcs
      for (let i = 0; i < nodes.length - 1; i++) {
        const a = nodes[i]
        const b = nodes[i + 1]
        const cpx = (a.x + b.x) / 2
        const cpy = Math.min(a.y, b.y) - 20
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.quadraticCurveTo(cpx, cpy, b.x, b.y)
        ctx.strokeStyle = 'rgba(196,181,253,0.4)'
        ctx.lineWidth = 1.2
        ctx.stroke()
      }

      // Gold apex
      if (apexNode) {
        ctx.beginPath()
        ctx.arc(apexNode.x, apexNode.y, 11, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(251,191,36,0.18)'
        ctx.fill()

        ctx.beginPath()
        ctx.arc(apexNode.x, apexNode.y, apexNode.r * 0.9, 0, Math.PI * 2)
        ctx.fillStyle = '#FBBF24'
        ctx.fill()
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
  }, [interests, akiliScore])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    />
  )
}
