'use client'

import { useEffect, useRef } from 'react'

interface ConstellationCanvasProps {
  interests?: { name: string; weight: number }[]
  akiliScore?: number
  dimensions?: {
    knowledge: number
    collaboration: number
    mentorship: number
    technical: number
  }
  collaborationCount?: number
}

interface Star {
  x: number; y: number
  r: number; alpha: number
  twinkleOffset: number; twinkleSpeed: number
}

interface ConstellationStar {
  x: number; y: number; r: number
}

export function ConstellationCanvas({ interests = [] }: ConstellationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let rafId = 0
    let t = 0

    // Background stars
    let bgStars: Star[] = []
    // Constellation named stars (positioned as % of canvas)
    let cStars: ConstellationStar[] = []

    // Traveling particle state
    let travProg = 0
    // Shooting star state
    let shootTimer = 0
    let shootMaxLife = 0
    let shootX = 0; let shootY = 0
    let shootVx = 0; let shootVy = 0
    let shootLife = 0

    function getConstellationPositions(W: number, H: number): ConstellationStar[] {
      const pts: [number, number][] = [
        [0.70, 0.25],  // apex
        [0.50, 0.40],  // center
        [0.30, 0.25],  // left shoulder
        [0.20, 0.55],  // left outer
        [0.80, 0.55],  // right outer
        [0.55, 0.70],  // lower right
        [0.42, 0.70],  // lower left
        [0.65, 0.15],  // upper right tip
        [0.35, 0.55],  // mid left
        [0.60, 0.45],  // mid right
      ]
      const count = Math.max(5, Math.min(pts.length, 5 + Math.round((interests.length) / 2)))
      return pts.slice(0, count).map(([px, py]) => ({
        x: px * W, y: py * H,
        r: 2 + Math.random() * 2,
      }))
    }

    function buildStarField(W: number, H: number) {
      bgStars = Array.from({ length: 220 }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        r: 0.3 + Math.random() * 1.2,
        alpha: 0.2 + Math.random() * 0.6,
        twinkleOffset: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.008 + Math.random() * 0.015,
      }))
    }

    function resize() {
      const container = canvas!.parentElement
      if (!container) return
      const W = container.offsetWidth || container.clientWidth || 600
      const H = container.offsetHeight || container.clientHeight || 208
      canvas!.width = W
      canvas!.height = H
      buildStarField(W, H)
      cStars = getConstellationPositions(W, H)
    }

    function newShootingStar(W: number, H: number) {
      const side = Math.random()
      if (side < 0.5) {
        shootX = Math.random() * W * 0.5
        shootY = Math.random() * H * 0.3
        shootVx = 3 + Math.random() * 3
        shootVy = 1 + Math.random() * 2
      } else {
        shootX = W * 0.5 + Math.random() * W * 0.5
        shootY = Math.random() * H * 0.3
        shootVx = -(3 + Math.random() * 3)
        shootVy = 1 + Math.random() * 2
      }
      shootMaxLife = 30 + Math.floor(Math.random() * 25)
      shootLife = shootMaxLife
    }

    function draw() {
      const W = canvas!.width
      const H = canvas!.height
      if (W === 0 || H === 0) return

      // Deep space background
      ctx!.fillStyle = '#05010F'
      ctx!.fillRect(0, 0, W, H)

      // Subtle nebula glow
      const neb = ctx!.createRadialGradient(W * 0.6, H * 0.35, 0, W * 0.6, H * 0.35, W * 0.5)
      neb.addColorStop(0, 'rgba(88,28,135,0.09)')
      neb.addColorStop(0.5, 'rgba(49,10,101,0.05)')
      neb.addColorStop(1, 'rgba(0,0,0,0)')
      ctx!.fillStyle = neb
      ctx!.fillRect(0, 0, W, H)

      // Background twinkling stars
      bgStars.forEach(s => {
        const tw = s.alpha * (0.5 + 0.5 * Math.sin(t * s.twinkleSpeed + s.twinkleOffset))
        ctx!.save()
        ctx!.globalAlpha = tw
        ctx!.fillStyle = '#ffffff'
        ctx!.beginPath()
        ctx!.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx!.fill()
        ctx!.restore()
      })

      // Shooting star
      if (shootTimer <= 0) {
        newShootingStar(W, H)
        shootTimer = 300 + Math.floor(Math.random() * 400)
      } else {
        shootTimer--
      }
      if (shootLife > 0) {
        const progress = shootLife / shootMaxLife
        ctx!.save()
        ctx!.globalAlpha = progress * 0.8
        ctx!.strokeStyle = '#E0D8FF'
        ctx!.lineWidth = 1.5
        ctx!.lineCap = 'round'
        ctx!.beginPath()
        ctx!.moveTo(shootX, shootY)
        ctx!.lineTo(shootX - shootVx * 8, shootY - shootVy * 8)
        ctx!.stroke()
        ctx!.restore()
        shootX += shootVx
        shootY += shootVy
        shootLife--
      }

      // Constellation lines
      if (cStars.length >= 2) {
        // Build edges: connect each star to 1-2 nearest neighbors
        const edges: [number, number][] = []
        cStars.forEach((a, i) => {
          let closest = -1; let closestD = Infinity
          cStars.forEach((b, j) => {
            if (i === j) return
            const d = Math.hypot(a.x - b.x, a.y - b.y)
            if (d < closestD) { closestD = d; closest = j }
          })
          if (closest >= 0 && !edges.some(([x, y]) => (x === closest && y === i))) {
            edges.push([i, closest])
          }
        })

        // Traveling particle along edges
        travProg = (travProg + 0.003) % 1
        const edgeIdx = Math.floor(travProg * edges.length)
        const edgeFrac = (travProg * edges.length) % 1
        const [ai, bi] = edges[edgeIdx] || [0, 1]
        const starA = cStars[ai] || cStars[0]
        const starB = cStars[bi] || cStars[1]
        const travX = starA.x + (starB.x - starA.x) * edgeFrac
        const travY = starA.y + (starB.y - starA.y) * edgeFrac

        // Draw edges with dim glow
        edges.forEach(([ai2, bi2]) => {
          const a = cStars[ai2]; const b = cStars[bi2]
          ctx!.save()
          ctx!.strokeStyle = 'rgba(139,92,246,0.18)'
          ctx!.lineWidth = 1
          ctx!.beginPath()
          ctx!.moveTo(a.x, a.y)
          ctx!.lineTo(b.x, b.y)
          ctx!.stroke()
          ctx!.restore()
        })

        // Traveling particle trail
        const trailLen = 0.12
        const trailStartFrac = Math.max(0, edgeFrac - trailLen)
        const trailX0 = starA.x + (starB.x - starA.x) * trailStartFrac
        const trailY0 = starA.y + (starB.y - starA.y) * trailStartFrac
        const trailGrd = ctx!.createLinearGradient(trailX0, trailY0, travX, travY)
        trailGrd.addColorStop(0, 'rgba(167,139,250,0)')
        trailGrd.addColorStop(1, 'rgba(167,139,250,0.7)')
        ctx!.save()
        ctx!.strokeStyle = trailGrd
        ctx!.lineWidth = 2
        ctx!.lineCap = 'round'
        ctx!.beginPath()
        ctx!.moveTo(trailX0, trailY0)
        ctx!.lineTo(travX, travY)
        ctx!.stroke()
        ctx!.restore()

        // Particle head
        ctx!.save()
        ctx!.shadowBlur = 8
        ctx!.shadowColor = 'rgba(167,139,250,0.9)'
        ctx!.fillStyle = 'rgba(216,180,254,0.95)'
        ctx!.beginPath()
        ctx!.arc(travX, travY, 2.5, 0, Math.PI * 2)
        ctx!.fill()
        ctx!.restore()
      }

      // Constellation star nodes
      cStars.forEach((s, i) => {
        const pulse = 0.7 + 0.3 * Math.sin(t * 0.02 + i * 1.1)

        // Glow
        ctx!.save()
        ctx!.shadowBlur = 12 * pulse
        ctx!.shadowColor = 'rgba(139,92,246,0.9)'
        const grd = ctx!.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 3)
        grd.addColorStop(0, `rgba(216,180,254,${0.6 * pulse})`)
        grd.addColorStop(1, 'rgba(139,92,246,0)')
        ctx!.fillStyle = grd
        ctx!.beginPath()
        ctx!.arc(s.x, s.y, s.r * 3, 0, Math.PI * 2)
        ctx!.fill()
        ctx!.restore()

        // Core
        ctx!.save()
        ctx!.shadowBlur = 6
        ctx!.shadowColor = 'rgba(216,180,254,0.8)'
        ctx!.fillStyle = `rgba(240,220,255,${0.85 * pulse})`
        ctx!.beginPath()
        ctx!.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx!.fill()
        ctx!.restore()
      })

      t++
    }

    function loop() {
      draw()
      rafId = requestAnimationFrame(loop)
    }

    resize()
    loop()

    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(rafId)
      resize()
      // restart loop cleanly
      loop()
    })
    if (canvas.parentElement) ro.observe(canvas.parentElement)

    return () => {
      cancelAnimationFrame(rafId)
      ro.disconnect()
    }
  }, [interests])

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

export default ConstellationCanvas
