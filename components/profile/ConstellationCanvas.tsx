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
  x: number; y: number; r: number
  opacity: number; twinkleOffset: number; twinkleSpeed: number
}

interface CompanionStar { dx: number; dy: number; r: number; opacity: number }
interface ShootingStar { x: number; y: number; vx: number; vy: number; life: number; maxLife: number }

const STAR_COLORS = ['#FBBF24', '#67E8F9', '#C4B5FD', '#86EFAC', '#FDA4AF', '#FCA5A5', '#6EE7B7']
const DEFAULTS = [
  { name: 'Research', weight: 0.34 },
  { name: 'Collaboration', weight: 0.33 },
  { name: 'Discovery', weight: 0.33 },
]

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

function getStarPositions(W: number, H: number, n: number): [number, number][] {
  const cx = W * 0.70; const cy = H * 0.50
  if (n === 1) return [[cx, cy]]
  if (n === 2) return [[W * 0.62, H * 0.38], [W * 0.80, H * 0.64]]
  if (n === 3) return [[W * 0.70, H * 0.28], [W * 0.86, H * 0.62], [W * 0.56, H * 0.68]]
  if (n === 4) return [
    [cx, H * 0.20], [cx + W * 0.14, H * 0.50],
    [cx, H * 0.76], [cx - W * 0.12, H * 0.50],
  ]
  const radius = Math.min(W * 0.17, H * 0.30)
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2
    return [cx + Math.cos(a) * radius, cy + Math.sin(a) * radius] as [number, number]
  })
}

export function ConstellationCanvas({ interests }: ConstellationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const container = canvas.parentElement
    if (!container) return

    const active = interests.length > 0 ? interests.slice(0, 7) : DEFAULTS

    let rafId: number
    let time = 0
    let bgStars: BGStar[] = []
    let companions: CompanionStar[][] = []
    let shootingStar: ShootingStar | null = null
    let shootTimer = 300 + Math.floor(Math.random() * 400)
    let travSeg = 0; let travProg = 0

    function resize() {
      canvas!.width = container!.offsetWidth || container!.clientWidth
      canvas!.height = container!.offsetHeight || container!.clientHeight
      const W = canvas!.width; const H = canvas!.height

      bgStars = Array.from({ length: 240 }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        r: 0.2 + Math.random() * 1.2,
        opacity: 0.08 + Math.random() * 0.35,
        twinkleOffset: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.01 + Math.random() * 0.03,
      }))
      companions = active.map(() =>
        Array.from({ length: 2 + Math.floor(Math.random() * 5) }, () => ({
          dx: (Math.random() - 0.5) * 130,
          dy: (Math.random() - 0.5) * 130,
          r: 0.6 + Math.random() * 1.6,
          opacity: 0.2 + Math.random() * 0.4,
        }))
      )
    }

    function draw() {
      const W = canvas!.width; const H = canvas!.height
      if (W === 0 || H === 0) { rafId = requestAnimationFrame(draw); return }
      const ctx = canvas!.getContext('2d')!

      ctx.fillStyle = '#030812'
      ctx.fillRect(0, 0, W, H)

      // Nebula
      const ncx = W * 0.70; const ncy = H * 0.50
      for (const [ox, oy, r, col, al] of [
        [-40, 20, 0.35 * W, '245,158,11', 0.05],
        [50, -30, 0.30 * W, '34,211,238', 0.04],
        [0, 0, 0.40 * W, '139,92,246', 0.06],
      ] as [number, number, number, string, number][]) {
        const g = ctx.createRadialGradient(ncx + ox, ncy + oy, 0, ncx + ox, ncy + oy, r)
        g.addColorStop(0, `rgba(${col},${al})`); g.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
      }

      // Background stars
      for (const s of bgStars) {
        const t = Math.sin(time * s.twinkleSpeed + s.twinkleOffset) * 0.5 + 0.5
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${s.opacity * (0.6 + 0.4 * t)})`
        ctx.fill()
      }

      // Planisphere grid (right 55%)
      ctx.save()
      ctx.strokeStyle = 'rgba(34,211,238,0.04)'
      ctx.lineWidth = 0.5
      const gL = W * 0.45; const gStep = 28
      for (let x = gL; x <= W; x += gStep) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke() }
      for (let y = 0; y <= H; y += gStep) { ctx.beginPath(); ctx.moveTo(gL, y); ctx.lineTo(W, y); ctx.stroke() }
      ctx.restore()

      // Dashed boundary circle
      ctx.save()
      ctx.strokeStyle = 'rgba(34,211,238,0.07)'
      ctx.lineWidth = 0.6
      ctx.setLineDash([4, 8])
      ctx.beginPath()
      ctx.arc(W * 0.70, H * 0.50, Math.min(W, H) * 0.36, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.restore()

      const positions = getStarPositions(W, H, active.length)
      const n = positions.length

      // All pairs for lines
      const segs: [number, number][] = []
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) segs.push([i, j])

      // Draw constellation lines
      for (const [a, b] of segs) {
        const [ax, ay] = positions[a]; const [bx, by] = positions[b]
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by)
        ctx.strokeStyle = 'rgba(251,191,36,0.22)'; ctx.lineWidth = 4; ctx.stroke()
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by)
        ctx.strokeStyle = 'rgba(251,191,36,0.45)'; ctx.lineWidth = 1.2; ctx.stroke()
      }

      // Traveling particle
      if (segs.length > 0) {
        travProg += 0.003
        if (travProg >= 1) { travProg = 0; travSeg = (travSeg + 1) % segs.length }
        const [sa, sb] = segs[travSeg]
        const [x1, y1] = positions[sa]; const [x2, y2] = positions[sb]
        const px = x1 + (x2 - x1) * travProg; const py = y1 + (y2 - y1) * travProg
        const trailT = Math.max(0, travProg - 0.12)
        const tx1 = x1 + (x2 - x1) * trailT; const ty1 = y1 + (y2 - y1) * trailT
        const tg = ctx.createLinearGradient(tx1, ty1, px, py)
        tg.addColorStop(0, 'rgba(251,191,36,0)'); tg.addColorStop(1, 'rgba(251,191,36,0.6)')
        ctx.beginPath(); ctx.moveTo(tx1, ty1); ctx.lineTo(px, py)
        ctx.strokeStyle = tg; ctx.lineWidth = 2; ctx.stroke()
        ctx.save(); ctx.shadowBlur = 14; ctx.shadowColor = 'rgba(251,191,36,0.9)'
        ctx.beginPath(); ctx.arc(px, py, 3.5, 0, Math.PI * 2)
        ctx.fillStyle = '#FBBF24'; ctx.fill(); ctx.restore()
      }

      // Main stars
      for (let i = 0; i < n; i++) {
        const [sx, sy] = positions[i]
        const interest = active[i]
        const color = STAR_COLORS[i % STAR_COLORS.length]
        const [cr, cg, cb] = parseHex(color)
        const pulse = 1 + Math.sin(time * 0.03 + i * 2.1) * 0.08
        const r = (6 + interest.weight * 14) * pulse

        // Companions
        if (companions[i]) {
          for (const c of companions[i]) {
            ctx.beginPath(); ctx.arc(sx + c.dx, sy + c.dy, c.r, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(255,255,255,${c.opacity})`; ctx.fill()
          }
        }

        // Multi-layer glow
        for (const [mult, al] of [[4.5, 0.04], [3.0, 0.09], [1.8, 0.18], [1.1, 0.38]] as [number, number][]) {
          const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * mult)
          g.addColorStop(0, `rgba(${cr},${cg},${cb},${al})`); g.addColorStop(1, 'rgba(0,0,0,0)')
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sx, sy, r * mult, 0, Math.PI * 2); ctx.fill()
        }

        ctx.save(); ctx.shadowBlur = 16; ctx.shadowColor = `rgba(${cr},${cg},${cb},0.8)`
        ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill()
        ctx.restore()

        ctx.beginPath(); ctx.arc(sx, sy, r * 0.38, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.fill()

        // 4-point cross
        ctx.save(); ctx.strokeStyle = `rgba(${cr},${cg},${cb},0.55)`; ctx.lineWidth = 0.8
        const cl = r * 2.4
        for (let a = 0; a < 4; a++) {
          const ang = (a / 4) * Math.PI * 2
          ctx.beginPath()
          ctx.moveTo(sx + Math.cos(ang) * r * 1.1, sy + Math.sin(ang) * r * 1.1)
          ctx.lineTo(sx + Math.cos(ang) * cl, sy + Math.sin(ang) * cl)
          ctx.stroke()
        }
        ctx.restore()

        // Label
        ctx.save(); ctx.font = '8.5px monospace'
        ctx.fillStyle = `rgba(${cr},${cg},${cb},0.7)`; ctx.textAlign = 'center'
        ctx.fillText(interest.name, sx, sy + r + 13); ctx.restore()
      }

      // Shooting star
      shootTimer--
      if (shootTimer <= 0 && !shootingStar) {
        shootingStar = { x: Math.random() * W * 0.4, y: Math.random() * H * 0.3, vx: 4 + Math.random() * 3, vy: 2 + Math.random() * 2, life: 0, maxLife: 50 + Math.floor(Math.random() * 30) }
        shootTimer = 300 + Math.floor(Math.random() * 400)
      }
      if (shootingStar) {
        const s = shootingStar; s.x += s.vx; s.y += s.vy; s.life++
        const fade = 1 - s.life / s.maxLife
        ctx.save()
        const sg = ctx.createLinearGradient(s.x - s.vx * 8, s.y - s.vy * 8, s.x, s.y)
        sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(1, `rgba(255,255,255,${fade * 0.8})`)
        ctx.beginPath(); ctx.moveTo(s.x - s.vx * 8, s.y - s.vy * 8); ctx.lineTo(s.x, s.y)
        ctx.strokeStyle = sg; ctx.lineWidth = 1.5; ctx.stroke()
        ctx.beginPath(); ctx.arc(s.x, s.y, 1.5 * fade, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${fade})`; ctx.fill()
        ctx.restore()
        if (s.life >= s.maxLife || s.x > W || s.y > H) shootingStar = null
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

    return () => { cancelAnimationFrame(rafId); ro.disconnect() }
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
