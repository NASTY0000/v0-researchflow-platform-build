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

    // Use provided interests or fall back to defaults
    const nodes = interests.length > 0 ? interests : [
      { name: 'Research',      weight: 0.5 },
      { name: 'Collaboration', weight: 0.4 },
      { name: 'Innovation',    weight: 0.35 },
      { name: 'Technology',    weight: 0.3 },
      { name: 'Science',       weight: 0.25 },
      { name: 'Data',          weight: 0.2 },
      { name: 'Analysis',      weight: 0.15 },
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

      // Dark background
      ctx!.fillStyle = '#05010F'
      ctx!.fillRect(0, 0, W, H)

      // Subtle radial glow in center-left
      const grd = ctx!.createRadialGradient(W * 0.5, H * 0.6, 0, W * 0.5, H * 0.6, W * 0.55)
      grd.addColorStop(0, 'rgba(124,58,237,0.06)')
      grd.addColorStop(1, 'rgba(0,0,0,0)')
      ctx!.fillStyle = grd
      ctx!.fillRect(0, 0, W, H)

      // Trunk junction point — base of canopy
      const jx = W * 0.5
      const jy = H * 0.82

      // Draw trunk (down from junction to bottom)
      const trunkW = Math.max(6, W * 0.018)
      ctx!.save()
      const trunkGrad = ctx!.createLinearGradient(jx, jy, jx, H)
      trunkGrad.addColorStop(0, '#5B21B6')
      trunkGrad.addColorStop(1, '#2E1065')
      ctx!.strokeStyle = trunkGrad
      ctx!.lineWidth = trunkW
      ctx!.lineCap = 'round'
      ctx!.beginPath()
      ctx!.moveTo(jx, jy)
      ctx!.lineTo(jx, H)
      ctx!.stroke()
      ctx!.restore()

      // Branches — one per interest, fanning out
      const count = Math.min(nodes.length, 9)
      const angleStart = -Math.PI * 0.88
      const angleEnd   = -Math.PI * 0.12
      const angleRange = angleEnd - angleStart

      nodes.slice(0, count).forEach((node, i) => {
        const frac = count === 1 ? 0.5 : i / (count - 1)
        const angle = angleStart + frac * angleRange
        const branchLen = H * 0.72 * (0.55 + node.weight * 0.45)
        const pulse = 0.75 + 0.25 * Math.sin(t * 0.018 + i * 0.7)

        const ex = jx + Math.cos(angle) * branchLen
        const ey = jy + Math.sin(angle) * branchLen

        // Control point slightly upward for natural curve
        const cx1 = jx + Math.cos(angle + 0.3) * branchLen * 0.5
        const cy1 = jy + Math.sin(angle + 0.3) * branchLen * 0.5

        const alpha = 0.25 + 0.65 * pulse
        const lineW = Math.max(1.5, 3.5 * node.weight * pulse)

        ctx!.save()
        ctx!.shadowBlur = 10 * pulse
        ctx!.shadowColor = 'rgba(124,58,237,0.7)'
        ctx!.strokeStyle = `rgba(124,58,237,${alpha})`
        ctx!.lineWidth = lineW
        ctx!.lineCap = 'round'
        ctx!.beginPath()
        ctx!.moveTo(jx, jy)
        ctx!.quadraticCurveTo(cx1, cy1, ex, ey)
        ctx!.stroke()
        ctx!.restore()

        // End node glow
        const nodeR = Math.max(3, 5 * node.weight + 2)
        const nodeAlpha = 0.3 + 0.7 * pulse

        ctx!.save()
        ctx!.shadowBlur = 14 * pulse
        ctx!.shadowColor = 'rgba(139,92,246,0.9)'

        const nodeGrd = ctx!.createRadialGradient(ex, ey, 0, ex, ey, nodeR * 1.8)
        nodeGrd.addColorStop(0, `rgba(196,181,253,${nodeAlpha})`)
        nodeGrd.addColorStop(0.5, `rgba(139,92,246,${nodeAlpha * 0.8})`)
        nodeGrd.addColorStop(1, 'rgba(139,92,246,0)')
        ctx!.fillStyle = nodeGrd
        ctx!.beginPath()
        ctx!.arc(ex, ey, nodeR * 2, 0, Math.PI * 2)
        ctx!.fill()

        ctx!.fillStyle = `rgba(196,181,253,${nodeAlpha})`
        ctx!.beginPath()
        ctx!.arc(ex, ey, nodeR, 0, Math.PI * 2)
        ctx!.fill()
        ctx!.restore()
      })

      // Gold apex node at the top-center
      const apexY = jy - H * 0.72 * 0.95
      const apexPulse = 0.7 + 0.3 * Math.sin(t * 0.025)

      // Outer glow rings
      for (const [mult, a] of [[3.0, 0.08], [2.0, 0.14], [1.2, 0.22]] as [number, number][]) {
        ctx!.save()
        ctx!.shadowBlur = 20 * apexPulse
        ctx!.shadowColor = 'rgba(251,191,36,0.6)'
        const apxGrd = ctx!.createRadialGradient(jx, apexY, 0, jx, apexY, 12 * mult)
        apxGrd.addColorStop(0, `rgba(251,191,36,${a * apexPulse})`)
        apxGrd.addColorStop(1, 'rgba(251,191,36,0)')
        ctx!.fillStyle = apxGrd
        ctx!.beginPath()
        ctx!.arc(jx, apexY, 12 * mult, 0, Math.PI * 2)
        ctx!.fill()
        ctx!.restore()
      }

      ctx!.save()
      ctx!.shadowBlur = 20 * apexPulse
      ctx!.shadowColor = 'rgba(251,191,36,0.9)'
      ctx!.fillStyle = `rgba(251,191,36,${0.85 + 0.15 * apexPulse})`
      ctx!.beginPath()
      ctx!.arc(jx, apexY, 5.5, 0, Math.PI * 2)
      ctx!.fill()
      ctx!.fillStyle = 'rgba(255,255,255,0.9)'
      ctx!.beginPath()
      ctx!.arc(jx, apexY, 2, 0, Math.PI * 2)
      ctx!.fill()
      ctx!.restore()

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
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'block',
      }}
    />
  )
}
