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

const COLORS = ['#FBBF24', '#67E8F9', '#C4B5FD', '#86EFAC', '#FDA4AF']

interface BgStar {
  x: number; y: number; r: number
  op: number; speed: number; offset: number
}

interface MainStar {
  x: number; y: number; r: number
  color: string; name: string
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

    const safeInterests = interests.length > 0 ? interests : [
      { name: 'Research',      weight: 0.5 },
      { name: 'Collaboration', weight: 0.4 },
      { name: 'Innovation',    weight: 0.35 },
    ]

    let bgStars: BgStar[] = []
    let mainStars: MainStar[] = []

    // Traveling particle
    const traveler = { seg: 0, progress: 0 }

    // Shooting star
    let shootTimer = 400
    let shootX = 0, shootY = 0, shootVx = 0, shootVy = 0
    let shootLife = 0, shootMaxLife = 0

    function buildStars() {
      if (!canvas) return
      const W = canvas.width
      const H = canvas.height

      bgStars = Array.from({ length: 200 }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.4 + 0.3,
        op: Math.random() * 0.35 + 0.08,
        speed: Math.random() * 0.025 + 0.008,
        offset: Math.random() * Math.PI * 2,
      }))

      const num = Math.min(safeInterests.length, 5)

      // Fixed positions spread across the canvas (not clustered)
      const positions = [
        { x: W * 0.55, y: H * 0.28 },  // top-center
        { x: W * 0.80, y: H * 0.55 },  // right
        { x: W * 0.38, y: H * 0.60 },  // left
        { x: W * 0.65, y: H * 0.75 },  // bottom-center
        { x: W * 0.88, y: H * 0.30 },  // top-right
      ]

      mainStars = safeInterests.slice(0, num).map((interest, i) => ({
        x: positions[i % positions.length].x,
        y: positions[i % positions.length].y,
        r: 8 + interest.weight * 14,
        color: COLORS[i % COLORS.length],
        name: interest.name,
      }))
    }

    function resize() {
      const container = canvas!.parentElement
      if (!container) return
      const W = container.offsetWidth || container.clientWidth || 600
      const H = container.offsetHeight || container.clientHeight || 208
      canvas!.width = W
      canvas!.height = H
      buildStars()
    }

    function newShoot() {
      const W = canvas!.width; const H = canvas!.height
      shootX = Math.random() * W
      shootY = Math.random() * H * 0.4
      const dir = shootX < W / 2 ? 1 : -1
      shootVx = dir * (3 + Math.random() * 3)
      shootVy = 1 + Math.random() * 2
      shootMaxLife = 28 + Math.floor(Math.random() * 22)
      shootLife = shootMaxLife
      shootTimer = 350 + Math.floor(Math.random() * 450)
    }

    function draw() {
      const W = canvas!.width
      const H = canvas!.height
      if (W === 0 || H === 0) return

      // Deep space
      ctx!.fillStyle = '#05010F'
      ctx!.fillRect(0, 0, W, H)

      // ── Nebula clouds ────────────────────────────────────────
      if (mainStars.length > 0) {
        const cx = mainStars.reduce((s, m) => s + m.x, 0) / mainStars.length
        const cy = mainStars.reduce((s, m) => s + m.y, 0) / mainStars.length

        // Warm gold primary cloud
        const n1 = ctx!.createRadialGradient(cx, cy, 0, cx, cy, W * 0.55)
        n1.addColorStop(0,   'rgba(245,158,11,0.12)')
        n1.addColorStop(0.4, 'rgba(124,58,237,0.06)')
        n1.addColorStop(1,   'rgba(0,0,0,0)')
        ctx!.fillStyle = n1
        ctx!.fillRect(0, 0, W, H)

        // Cool blue secondary cloud
        const n2 = ctx!.createRadialGradient(
          mainStars[0].x, mainStars[0].y, 0,
          mainStars[0].x, mainStars[0].y, W * 0.35
        )
        n2.addColorStop(0, 'rgba(6,182,212,0.08)')
        n2.addColorStop(1, 'rgba(6,182,212,0)')
        ctx!.fillStyle = n2
        ctx!.fillRect(0, 0, W, H)
      }

      // ── Background twinkling stars ────────────────────────────
      bgStars.forEach(s => {
        const twinkle = s.op * (0.7 + 0.3 * Math.sin(t * s.speed + s.offset))
        ctx!.beginPath()
        ctx!.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(210,230,255,${twinkle})`
        ctx!.fill()
      })

      // ── Shooting star ─────────────────────────────────────────
      if (shootTimer <= 0) {
        newShoot()
      } else {
        shootTimer--
      }
      if (shootLife > 0) {
        const prog = shootLife / shootMaxLife
        ctx!.save()
        ctx!.globalAlpha = prog * 0.85
        ctx!.strokeStyle = '#E8E0FF'
        ctx!.lineWidth = 1.5
        ctx!.lineCap = 'round'
        ctx!.shadowBlur = 6
        ctx!.shadowColor = 'rgba(200,180,255,0.8)'
        ctx!.beginPath()
        ctx!.moveTo(shootX, shootY)
        ctx!.lineTo(shootX - shootVx * 9, shootY - shootVy * 9)
        ctx!.stroke()
        ctx!.restore()
        shootX += shootVx; shootY += shootVy; shootLife--
      }

      // ── Constellation lines ───────────────────────────────────
      for (let a = 0; a < mainStars.length; a++) {
        for (let b = a + 1; b < mainStars.length; b++) {
          const sa = mainStars[a]; const sb = mainStars[b]

          // Thick glow pass
          ctx!.beginPath()
          ctx!.moveTo(sa.x, sa.y)
          ctx!.lineTo(sb.x, sb.y)
          ctx!.strokeStyle = 'rgba(251,191,36,0.2)'
          ctx!.lineWidth = 5
          ctx!.shadowBlur = 14
          ctx!.shadowColor = 'rgba(251,191,36,0.5)'
          ctx!.stroke()
          ctx!.shadowBlur = 0

          // Sharp crisp line on top
          ctx!.beginPath()
          ctx!.moveTo(sa.x, sa.y)
          ctx!.lineTo(sb.x, sb.y)
          ctx!.strokeStyle = 'rgba(251,191,36,0.55)'
          ctx!.lineWidth = 1.5
          ctx!.stroke()
        }
      }

      // ── Traveling particle ────────────────────────────────────
      if (mainStars.length >= 2) {
        const connections: [number, number][] = []
        for (let a = 0; a < mainStars.length; a++)
          for (let b = a + 1; b < mainStars.length; b++)
            connections.push([a, b])

        if (connections.length > 0) {
          const [ai, bi] = connections[traveler.seg % connections.length]
          const sa = mainStars[ai]; const sb = mainStars[bi]
          const x = sa.x + (sb.x - sa.x) * traveler.progress
          const y = sa.y + (sb.y - sa.y) * traveler.progress

          // Trail (last 15% of segment)
          const trailStart = Math.max(0, traveler.progress - 0.15)
          const tx0 = sa.x + (sb.x - sa.x) * trailStart
          const ty0 = sa.y + (sb.y - sa.y) * trailStart
          const tg = ctx!.createLinearGradient(tx0, ty0, x, y)
          tg.addColorStop(0, 'rgba(251,191,36,0)')
          tg.addColorStop(1, 'rgba(251,191,36,0.85)')
          ctx!.beginPath()
          ctx!.moveTo(tx0, ty0)
          ctx!.lineTo(x, y)
          ctx!.strokeStyle = tg
          ctx!.lineWidth = 2.5
          ctx!.lineCap = 'round'
          ctx!.stroke()

          // Particle head
          ctx!.beginPath()
          ctx!.arc(x, y, 4.5, 0, Math.PI * 2)
          ctx!.fillStyle = '#FBBF24'
          ctx!.shadowBlur = 18
          ctx!.shadowColor = 'rgba(251,191,36,1.0)'
          ctx!.fill()
          ctx!.shadowBlur = 0

          traveler.progress += 0.004
          if (traveler.progress >= 1) {
            traveler.progress = 0
            traveler.seg = (traveler.seg + 1) % connections.length
          }
        }
      }

      // ── Main constellation stars ──────────────────────────────
      mainStars.forEach((star, i) => {
        const pulse = 1 + Math.sin(t * 0.04 + i * 1.5) * 0.1
        const r = star.r * pulse

        // 3 glow layers (outer → inner)
        const glowSizes  = [3.5, 2.2, 1.4]
        const glowAlphas = [0.08, 0.18, 0.40]

        glowSizes.forEach((scale, layer) => {
          const glowR = r * scale
          const sg = ctx!.createRadialGradient(star.x, star.y, 0, star.x, star.y, glowR)
          const hex = Math.round(glowAlphas[layer] * 255).toString(16).padStart(2, '0')
          sg.addColorStop(0, star.color + hex)
          sg.addColorStop(1, star.color + '00')
          ctx!.beginPath()
          ctx!.arc(star.x, star.y, glowR, 0, Math.PI * 2)
          ctx!.fillStyle = sg
          ctx!.fill()
        })

        // Colored core
        ctx!.beginPath()
        ctx!.arc(star.x, star.y, r, 0, Math.PI * 2)
        ctx!.fillStyle = star.color
        ctx!.shadowBlur = 20
        ctx!.shadowColor = star.color
        ctx!.fill()
        ctx!.shadowBlur = 0

        // White-hot center
        ctx!.beginPath()
        ctx!.arc(star.x, star.y, r * 0.45, 0, Math.PI * 2)
        ctx!.fillStyle = 'rgba(255,255,255,0.95)'
        ctx!.shadowBlur = 10
        ctx!.shadowColor = 'white'
        ctx!.fill()
        ctx!.shadowBlur = 0

        // 4-point star cross
        const spLen = r * 1.8
        ctx!.strokeStyle = star.color + '66'
        ctx!.lineWidth = 0.8
        ;[
          [0, -spLen, 0, spLen],
          [-spLen, 0, spLen, 0],
        ].forEach(([x1, y1, x2, y2]) => {
          ctx!.beginPath()
          ctx!.moveTo(star.x + x1, star.y + y1)
          ctx!.lineTo(star.x + x2, star.y + y2)
          ctx!.stroke()
        })

        // Interest name label
        ctx!.font = 'bold 9px -apple-system, monospace'
        ctx!.fillStyle = star.color + 'BB'
        ctx!.textAlign = 'center'
        ctx!.fillText(star.name.toUpperCase(), star.x, star.y + r + 15)
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
        top: 0, left: 0,
        width: '100%', height: '100%',
        display: 'block',
      }}
    />
  )
}

export default ConstellationCanvas
