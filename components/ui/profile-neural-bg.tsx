'use client'

import { useEffect, useRef } from 'react'

interface Node {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  glowRadius: number
  glowPhase: number
  glowSpeed: number
  color: string
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  alpha: number
  alphaDir: number
}

const BRAND_COLORS = [
  '#7C3AED', '#A855F7', '#6D28D9', '#8B5CF6',
  '#C4B5FD', '#DDD6FE', '#5B21B6', '#4C1D95',
]

export function ProfileNeuralBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const isDark = document.documentElement.classList.contains('dark')

    const nodes: Node[] = []
    const particles: Particle[] = []
    let animId: number

    function resize() {
      if (!canvas) return
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }

    function initNodes() {
      if (!canvas) return
      nodes.length = 0
      for (let i = 0; i < 18; i++) {
        nodes.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          radius: 3 + Math.random() * 3,
          glowRadius: 10 + Math.random() * 20,
          glowPhase: Math.random() * Math.PI * 2,
          glowSpeed: 0.02 + Math.random() * 0.03,
          color: BRAND_COLORS[Math.floor(Math.random() * BRAND_COLORS.length)],
        })
      }
    }

    function initParticles() {
      if (!canvas) return
      particles.length = 0
      for (let i = 0; i < 30; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.2,
          vy: (Math.random() - 0.5) * 0.2,
          size: 0.5 + Math.random() * 1.5,
          alpha: Math.random(),
          alphaDir: Math.random() > 0.5 ? 1 : -1,
        })
      }
    }

    function draw() {
      if (!canvas || !ctx) return
      const w = canvas.width
      const h = canvas.height

      // Background
      ctx.fillStyle = isDark ? '#05010F' : '#F8F6FF'
      ctx.fillRect(0, 0, w, h)

      // Central nebula
      const cx = w / 2
      const cy = h / 2
      const nebula = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.6)
      nebula.addColorStop(0, isDark ? 'rgba(109,40,217,0.18)' : 'rgba(109,40,217,0.08)')
      nebula.addColorStop(0.5, isDark ? 'rgba(109,40,217,0.06)' : 'rgba(109,40,217,0.03)')
      nebula.addColorStop(1, 'transparent')
      ctx.fillStyle = nebula
      ctx.fillRect(0, 0, w, h)

      // Grid lines
      const gridAlpha = isDark ? 0.06 : 0.04
      ctx.strokeStyle = `rgba(124,58,237,${gridAlpha})`
      ctx.lineWidth = 0.5
      for (let x = 0; x < w; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke()
      }
      for (let y = 0; y < h; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
      }

      // Particles
      for (const p of particles) {
        p.alpha += 0.008 * p.alphaDir
        if (p.alpha >= 1) { p.alpha = 1; p.alphaDir = -1 }
        if (p.alpha <= 0) { p.alpha = 0; p.alphaDir = 1 }
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0) p.x = w
        if (p.x > w) p.x = 0
        if (p.y < 0) p.y = h
        if (p.y > h) p.y = 0
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = isDark
          ? `rgba(196,181,253,${p.alpha * 0.6})`
          : `rgba(109,40,217,${p.alpha * 0.3})`
        ctx.fill()
      }

      // Connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x
          const dy = nodes[i].y - nodes[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 120) {
            const alpha = (1 - dist / 120) * (isDark ? 0.25 : 0.15)
            ctx.beginPath()
            ctx.moveTo(nodes[i].x, nodes[i].y)
            ctx.lineTo(nodes[j].x, nodes[j].y)
            ctx.strokeStyle = `rgba(124,58,237,${alpha})`
            ctx.lineWidth = 0.8
            ctx.stroke()
          }
        }
      }

      // Nodes
      for (const node of nodes) {
        node.glowPhase += node.glowSpeed
        const pulse = (Math.sin(node.glowPhase) + 1) / 2
        const glow = node.glowRadius * (0.7 + pulse * 0.3)

        node.x += node.vx
        node.y += node.vy
        if (node.x < 0 || node.x > w) node.vx *= -1
        if (node.y < 0 || node.y > h) node.vy *= -1

        const grad = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, glow)
        grad.addColorStop(0, node.color + (isDark ? '66' : '33'))
        grad.addColorStop(1, 'transparent')
        ctx.beginPath()
        ctx.arc(node.x, node.y, glow, 0, Math.PI * 2)
        ctx.fillStyle = grad
        ctx.fill()

        // Center dot
        ctx.beginPath()
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2)
        ctx.fillStyle = isDark ? '#ffffff' : node.color
        ctx.fill()
      }

      animId = requestAnimationFrame(draw)
    }

    const ro = new ResizeObserver(() => {
      resize()
      initNodes()
      initParticles()
    })
    ro.observe(canvas)

    resize()
    initNodes()
    initParticles()
    draw()

    return () => {
      cancelAnimationFrame(animId)
      ro.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ display: 'block' }}
    />
  )
}
