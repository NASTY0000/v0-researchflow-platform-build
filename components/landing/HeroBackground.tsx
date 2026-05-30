'use client'

import { useEffect, useRef } from 'react'

export function HeroBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let W = 0, H = 0, t = 0
    let rafId: number
    let isVisible = true
    let lastFrame = 0
    const FPS_CAP = 30
    const FRAME_MIN_MS = 1000 / FPS_CAP

    let stars: Array<{
      x:number; y:number; r:number
      cr:number; cg:number; cb:number
      op:number; ts:number; to:number; flare:boolean
    }> = []

    let starCanvas: HTMLCanvasElement | null = null
    let starCtx: CanvasRenderingContext2D | null = null
    let starsBuilt = false

    let shoot: {
      x:number; y:number; vx:number; vy:number
      life:number; max:number
    } | null = null
    let shootTimer = 0

    function buildStars() {
      stars = []
      const count = 380
      for (let i = 0; i < count; i++) {
        const rand = Math.random()
        const r = rand < 0.70 ? Math.random() * 0.55 + 0.12
                : rand < 0.92 ? Math.random() * 0.75 + 0.55
                :               Math.random() * 1.1  + 1.3
        const c = Math.random()
        let cr: number, cg: number, cb: number
        if      (c > 0.85) { cr=220; cg=200; cb=255 }
        else if (c > 0.65) { cr=210; cg=220; cb=255 }
        else if (c > 0.3)  { cr=250; cg=248; cb=255 }
        else               { cr=255; cg=248; cb=235 }
        stars.push({
          x: Math.random() * W,
          y: Math.random() * H * 0.82,
          r, cr, cg, cb,
          op: r < 0.6  ? Math.random() * 0.28 + 0.06
            : r < 1.2  ? Math.random() * 0.45 + 0.2
            :            Math.random() * 0.35 + 0.55,
          ts: Math.random() * 0.022 + 0.004,
          to: Math.random() * Math.PI * 2,
          flare: r > 1.4 && Math.random() > 0.35,
        })
      }
      starsBuilt = false
    }

    function prebuildStarCanvas() {
      starCanvas = document.createElement('canvas')
      starCanvas.width  = W
      starCanvas.height = H
      starCtx = starCanvas.getContext('2d')
      if (!starCtx) return

      starCtx.clearRect(0, 0, W, H)

      stars.forEach(s => {
        if (!s.flare || !starCtx) return
        const sp = s.r * 5

        const hg = starCtx.createLinearGradient(s.x-sp, s.y, s.x+sp, s.y)
        hg.addColorStop(0,   `rgba(${s.cr},${s.cg},${s.cb},0)`)
        hg.addColorStop(0.5, `rgba(${s.cr},${s.cg},${s.cb},0.5)`)
        hg.addColorStop(1,   `rgba(${s.cr},${s.cg},${s.cb},0)`)
        starCtx.beginPath()
        starCtx.moveTo(s.x-sp, s.y)
        starCtx.lineTo(s.x+sp, s.y)
        starCtx.strokeStyle = hg
        starCtx.lineWidth = 0.7
        starCtx.stroke()

        const vg = starCtx.createLinearGradient(s.x, s.y-sp, s.x, s.y+sp)
        vg.addColorStop(0,   `rgba(${s.cr},${s.cg},${s.cb},0)`)
        vg.addColorStop(0.5, `rgba(${s.cr},${s.cg},${s.cb},0.5)`)
        vg.addColorStop(1,   `rgba(${s.cr},${s.cg},${s.cb},0)`)
        starCtx.beginPath()
        starCtx.moveTo(s.x, s.y-sp)
        starCtx.lineTo(s.x, s.y+sp)
        starCtx.strokeStyle = vg
        starCtx.lineWidth = 0.5
        starCtx.stroke()
      })
      starsBuilt = true
    }

    function drawStars() {
      if (starsBuilt && starCanvas) {
        ctx.drawImage(starCanvas, 0, 0)
      }

      stars.forEach(s => {
        const op = s.op * (0.72 + 0.28 * Math.sin(t * s.ts + s.to))

        if (s.r > 1.3) {
          ctx.shadowBlur  = s.r * 3
          ctx.shadowColor = `rgba(${s.cr},${s.cg},${s.cb},0.55)`
        }

        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${s.cr},${s.cg},${s.cb},${op})`
        ctx.fill()
        ctx.shadowBlur = 0
      })
    }

    function drawPlanet() {
      const cx = W * 0.5
      const cy = H + H * 0.24
      const pr = H * 0.90

      const body = ctx.createRadialGradient(cx,cy,pr*0.7,cx,cy,pr)
      body.addColorStop(0,    'rgba(20,8,50,0.0)')
      body.addColorStop(0.80, 'rgba(20,8,50,0.12)')
      body.addColorStop(0.92, 'rgba(30,10,70,0.40)')
      body.addColorStop(0.97, 'rgba(15,5,45,0.65)')
      body.addColorStop(1,    'rgba(10,3,30,0.0)')
      ctx.beginPath(); ctx.arc(cx,cy,pr,0,Math.PI*2)
      ctx.fillStyle = body; ctx.fill()

      const ao = ctx.createRadialGradient(cx,cy,pr*0.86,cx,cy,pr*1.1)
      ao.addColorStop(0,    'rgba(80,20,180,0.0)')
      ao.addColorStop(0.25, 'rgba(100,30,200,0.10)')
      ao.addColorStop(0.55, 'rgba(130,50,220,0.20)')
      ao.addColorStop(0.80, 'rgba(160,80,255,0.14)')
      ao.addColorStop(1,    'rgba(180,100,255,0.0)')
      ctx.beginPath(); ctx.arc(cx,cy,pr*1.1,0,Math.PI*2)
      ctx.fillStyle = ao; ctx.fill()

      const ai = ctx.createRadialGradient(cx,cy,pr*0.92,cx,cy,pr*1.015)
      ai.addColorStop(0,    'rgba(120,40,220,0.0)')
      ai.addColorStop(0.35, 'rgba(150,60,240,0.38)')
      ai.addColorStop(0.65, 'rgba(180,90,255,0.55)')
      ai.addColorStop(0.88, 'rgba(200,120,255,0.28)')
      ai.addColorStop(1,    'rgba(200,120,255,0.0)')
      ctx.beginPath(); ctx.arc(cx,cy,pr*1.015,0,Math.PI*2)
      ctx.fillStyle = ai; ctx.fill()

      const rimAngle = Math.acos(
        Math.min(1, Math.max(-1, (cy - H) / pr))
      )
      const rimStart = Math.PI + rimAngle
      const rimEnd   = Math.PI * 2 - rimAngle

      ctx.beginPath(); ctx.arc(cx,cy,pr,rimStart,rimEnd)
      ctx.strokeStyle = 'rgba(160,80,255,0.30)'
      ctx.lineWidth = 16; ctx.shadowBlur = 30
      ctx.shadowColor = 'rgba(150,60,255,0.55)'
      ctx.stroke(); ctx.shadowBlur = 0

      ctx.beginPath(); ctx.arc(cx,cy,pr,rimStart,rimEnd)
      ctx.strokeStyle = 'rgba(190,110,255,0.55)'
      ctx.lineWidth = 4; ctx.shadowBlur = 18
      ctx.shadowColor = 'rgba(180,90,255,0.7)'
      ctx.stroke(); ctx.shadowBlur = 0

      ctx.beginPath(); ctx.arc(cx,cy,pr,rimStart,rimEnd)
      ctx.strokeStyle = 'rgba(220,160,255,0.80)'
      ctx.lineWidth = 1.2; ctx.shadowBlur = 14
      ctx.shadowColor = 'rgba(210,140,255,0.95)'
      ctx.stroke(); ctx.shadowBlur = 0

      const hf = ctx.createLinearGradient(0,H*0.70,0,H)
      hf.addColorStop(0,    'rgba(7,3,15,0)')
      hf.addColorStop(0.45, 'rgba(7,3,15,0.50)')
      hf.addColorStop(1,    'rgba(7,3,15,0.97)')
      ctx.fillStyle = hf
      ctx.fillRect(0, H*0.70, W, H*0.30)
    }

    function maybeShootingStar() {
      shootTimer++
      if (!shoot && shootTimer > 380 + Math.random()*550) {
        const angle = (18 + Math.random()*22) * Math.PI/180
        const spd   = 5.5 + Math.random()*4
        shoot = {
          x: Math.random()*W*0.55, y: Math.random()*H*0.3,
          vx: spd*Math.cos(angle), vy: spd*Math.sin(angle),
          life:0, max:50
        }
        shootTimer = 0
      }
      if (!shoot) return

      const p    = shoot.life / shoot.max
      const fade = Math.sin(p * Math.PI)
      const tl   = 90
      const tx   = shoot.x - shoot.vx*(tl/shoot.vx)
      const ty   = shoot.y - shoot.vy*(tl/shoot.vx)

      const sg = ctx.createLinearGradient(tx,ty,shoot.x,shoot.y)
      sg.addColorStop(0,   'rgba(220,180,255,0)')
      sg.addColorStop(0.6, `rgba(220,180,255,${fade*0.35})`)
      sg.addColorStop(1,   `rgba(255,255,255,${fade*0.85})`)
      ctx.beginPath(); ctx.moveTo(tx,ty); ctx.lineTo(shoot.x,shoot.y)
      ctx.strokeStyle = sg; ctx.lineWidth = 1.4; ctx.stroke()
      ctx.beginPath(); ctx.arc(shoot.x,shoot.y,1.4,0,Math.PI*2)
      ctx.fillStyle = `rgba(255,255,255,${fade*0.9})`; ctx.fill()

      shoot.x += shoot.vx; shoot.y += shoot.vy; shoot.life++
      if (shoot.life >= shoot.max) shoot = null
    }

    function render(timestamp: number) {
      if (!isVisible || document.hidden) {
        rafId = requestAnimationFrame(render)
        return
      }

      if (timestamp - lastFrame < FRAME_MIN_MS) {
        rafId = requestAnimationFrame(render)
        return
      }
      lastFrame = timestamp
      t++

      ctx.fillStyle = '#07030F'
      ctx.fillRect(0, 0, W, H)

      const nb1 = ctx.createRadialGradient(
        W*0.08,H*0.3,0, W*0.08,H*0.3,W*0.35
      )
      nb1.addColorStop(0,'rgba(60,20,140,0.06)')
      nb1.addColorStop(1,'rgba(0,0,0,0)')
      ctx.fillStyle = nb1; ctx.fillRect(0,0,W,H)

      const nb2 = ctx.createRadialGradient(
        W*0.05,H*0.7,0, W*0.05,H*0.7,W*0.28
      )
      nb2.addColorStop(0,'rgba(6,182,212,0.045)')
      nb2.addColorStop(1,'rgba(0,0,0,0)')
      ctx.fillStyle = nb2; ctx.fillRect(0,0,W,H)

      drawStars()
      maybeShootingStar()
      drawPlanet()

      rafId = requestAnimationFrame(render)
    }

    function resize() {
      const parent = canvas.parentElement
      if (!parent) return
      const rect = parent.getBoundingClientRect()
      canvas.width  = rect.width
      canvas.height = rect.height
      W = canvas.width
      H = canvas.height
      buildStars()
      prebuildStarCanvas()
    }

    const observer = new IntersectionObserver(
      (entries) => { isVisible = entries[0].isIntersecting },
      { threshold: 0 }
    )
    observer.observe(canvas)

    window.addEventListener('resize', resize)
    resize()
    rafId = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', resize)
      observer.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        display: 'block',
        zIndex: 0,
      }}
    />
  )
}
