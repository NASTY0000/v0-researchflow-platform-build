'use client'

import { useEffect, useRef } from 'react'

interface BaobabCanvasProps {
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

export function BaobabCanvas({ interests = [] }: BaobabCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let rafId = 0
    let t = 0

    const nodes = interests.length > 0 ? interests : [
      { name: 'Research',      weight: 0.5 },
      { name: 'Collaboration', weight: 0.45 },
      { name: 'Innovation',    weight: 0.4 },
      { name: 'Technology',    weight: 0.35 },
      { name: 'Science',       weight: 0.3 },
      { name: 'Data',          weight: 0.25 },
      { name: 'Analysis',      weight: 0.2 },
    ]

    function resize() {
      const container = canvas!.parentElement
      if (!container) return
      const W = container.offsetWidth || container.clientWidth || 600
      const H = container.offsetHeight || container.clientHeight || 208
      canvas!.width = W
      canvas!.height = H
    }

    function draw() {
      const W = canvas!.width
      const H = canvas!.height
      if (W === 0 || H === 0) return

      ctx!.clearRect(0, 0, W, H)

      // Background
      ctx!.fillStyle = '#05010F'
      ctx!.fillRect(0, 0, W, H)

      // Ambient radial glow
      const grd = ctx!.createRadialGradient(W * 0.5, H * 0.55, 0, W * 0.5, H * 0.55, W * 0.6)
      grd.addColorStop(0, 'rgba(124,58,237,0.10)')
      grd.addColorStop(0.5, 'rgba(88,28,135,0.05)')
      grd.addColorStop(1, 'rgba(0,0,0,0)')
      ctx!.fillStyle = grd
      ctx!.fillRect(0, 0, W, H)

      // Trunk junction — base of canopy
      const jx = W * 0.5
      const jy = H * 0.82
      const trunkW = Math.max(10, W * 0.025)  // wider trunk

      // Trunk glow halo
      const tglow = ctx!.createRadialGradient(jx, H, 0, jx, H, trunkW * 5)
      tglow.addColorStop(0, 'rgba(124,58,237,0.35)')
      tglow.addColorStop(1, 'rgba(124,58,237,0)')
      ctx!.fillStyle = tglow
      ctx!.beginPath()
      ctx!.ellipse(jx, H, trunkW * 5, trunkW * 3, 0, 0, Math.PI * 2)
      ctx!.fill()

      // Trunk
      const trunkGrad = ctx!.createLinearGradient(jx, jy, jx, H)
      trunkGrad.addColorStop(0, '#7C3AED')
      trunkGrad.addColorStop(0.5, '#5B21B6')
      trunkGrad.addColorStop(1, '#2E1065')
      ctx!.save()
      ctx!.shadowBlur = 18
      ctx!.shadowColor = 'rgba(124,58,237,0.6)'
      ctx!.strokeStyle = trunkGrad
      ctx!.lineWidth = trunkW
      ctx!.lineCap = 'round'
      ctx!.beginPath()
      ctx!.moveTo(jx, jy)
      ctx!.lineTo(jx, H)
      ctx!.stroke()
      ctx!.restore()

      // Branches
      const count = Math.min(nodes.length, 9)
      const angleStart = -Math.PI * 0.88
      const angleEnd   = -Math.PI * 0.12
      const angleRange = angleEnd - angleStart

      nodes.slice(0, count).forEach((node, i) => {
        const frac = count === 1 ? 0.5 : i / (count - 1)
        const angle = angleStart + frac * angleRange
        const branchLen = H * 0.74 * (0.55 + node.weight * 0.45)
        const pulse = 0.75 + 0.25 * Math.sin(t * 0.018 + i * 0.7)

        const ex = jx + Math.cos(angle) * branchLen
        const ey = jy + Math.sin(angle) * branchLen
        const cx1 = jx + Math.cos(angle + 0.28) * branchLen * 0.5
        const cy1 = jy + Math.sin(angle + 0.28) * branchLen * 0.5

        const alpha = 0.3 + 0.65 * pulse
        const lineW = Math.max(2, 5 * node.weight * pulse)  // thicker branches

        ctx!.save()
        ctx!.shadowBlur = 14 * pulse
        ctx!.shadowColor = 'rgba(124,58,237,0.8)'
        ctx!.strokeStyle = `rgba(139,92,246,${alpha})`
        ctx!.lineWidth = lineW
        ctx!.lineCap = 'round'
        ctx!.beginPath()
        ctx!.moveTo(jx, jy)
        ctx!.quadraticCurveTo(cx1, cy1, ex, ey)
        ctx!.stroke()
        ctx!.restore()

        // Node — bigger and brighter
        const nodeR = Math.max(5, 7 * node.weight + 3)  // was max(3, 5*w+2)
        const nodeAlpha = 0.4 + 0.6 * pulse

        ctx!.save()
        ctx!.shadowBlur = 20 * pulse
        ctx!.shadowColor = 'rgba(167,139,250,1.0)'

        // Outer glow
        const nodeGrd = ctx!.createRadialGradient(ex, ey, 0, ex, ey, nodeR * 2.5)
        nodeGrd.addColorStop(0, `rgba(196,181,253,${nodeAlpha * 0.8})`)
        nodeGrd.addColorStop(0.5, `rgba(139,92,246,${nodeAlpha * 0.5})`)
        nodeGrd.addColorStop(1, 'rgba(139,92,246,0)')
        ctx!.fillStyle = nodeGrd
        ctx!.beginPath()
        ctx!.arc(ex, ey, nodeR * 2.5, 0, Math.PI * 2)
        ctx!.fill()

        // Colored core
        ctx!.fillStyle = i % 2 === 0 ? '#A78BFA' : '#C4B5FD'
        ctx!.beginPath()
        ctx!.arc(ex, ey, nodeR, 0, Math.PI * 2)
        ctx!.fill()

        // White-hot center
        ctx!.fillStyle = 'rgba(255,255,255,0.9)'
        ctx!.beginPath()
        ctx!.arc(ex, ey, nodeR * 0.4, 0, Math.PI * 2)
        ctx!.fill()
        ctx!.restore()
      })

      // Gold apex node
      const apexY = jy - H * 0.72 * 0.95
      const apexPulse = 0.7 + 0.3 * Math.sin(t * 0.025)

      // Outer glow rings (3 layers)
      for (const [mult, a] of [[3.5, 0.08], [2.2, 0.16], [1.3, 0.30]] as [number, number][]) {
        ctx!.save()
        ctx!.shadowBlur = 24 * apexPulse
        ctx!.shadowColor = 'rgba(251,191,36,0.7)'
        const apxGrd = ctx!.createRadialGradient(jx, apexY, 0, jx, apexY, 14 * mult)
        apxGrd.addColorStop(0, `rgba(251,191,36,${a * apexPulse})`)
        apxGrd.addColorStop(1, 'rgba(251,191,36,0)')
        ctx!.fillStyle = apxGrd
        ctx!.beginPath()
        ctx!.arc(jx, apexY, 14 * mult, 0, Math.PI * 2)
        ctx!.fill()
        ctx!.restore()
      }

      // Apex core
      ctx!.save()
      ctx!.shadowBlur = 24 * apexPulse
      ctx!.shadowColor = 'rgba(251,191,36,1.0)'
      ctx!.fillStyle = '#FBBF24'
      ctx!.beginPath()
      ctx!.arc(jx, apexY, 7, 0, Math.PI * 2)  // was 5.5
      ctx!.fill()
      ctx!.fillStyle = 'rgba(255,255,255,0.95)'
      ctx!.beginPath()
      ctx!.arc(jx, apexY, 2.8, 0, Math.PI * 2)
      ctx!.fill()
      ctx!.restore()

      // Apex cross spikes
      const spLen = 7 * 1.8
      ctx!.strokeStyle = 'rgba(251,191,36,0.5)'
      ctx!.lineWidth = 0.8
      ;[[0, -spLen, 0, spLen], [-spLen, 0, spLen, 0]].forEach(([x1, y1, x2, y2]) => {
        ctx!.beginPath()
        ctx!.moveTo(jx + x1, apexY + y1)
        ctx!.lineTo(jx + x2, apexY + y2)
        ctx!.stroke()
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

export default BaobabCanvas
