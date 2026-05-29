'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { MagneticButton } from '@/components/ui/micro-interactions'

function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let W = 0, H = 0, t = 0
    let stars: any[] = []
    let shoot: any = null
    let shootTimer = 0
    let animId: number

    function buildStars() {
      stars = []
      const count = 420
      for (let i = 0; i < count; i++) {
        const rand = Math.random()
        const r = rand < 0.70
          ? Math.random() * 0.55 + 0.12
          : rand < 0.92
          ? Math.random() * 0.75 + 0.55
          : Math.random() * 1.1 + 1.3

        const c = Math.random()
        let color
        if (c > 0.85)      color = { r:220, g:200, b:255 }
        else if (c > 0.65) color = { r:210, g:220, b:255 }
        else if (c > 0.3)  color = { r:250, g:248, b:255 }
        else               color = { r:255, g:248, b:235 }

        stars.push({
          x: Math.random() * W,
          y: Math.random() * H * 0.82,
          r, color,
          op: r < 0.6  ? Math.random() * 0.28 + 0.06
            : r < 1.2  ? Math.random() * 0.45 + 0.2
            :            Math.random() * 0.35 + 0.55,
          ts: Math.random() * 0.022 + 0.004,
          to: Math.random() * Math.PI * 2,
          flare: r > 1.4 && Math.random() > 0.35,
        })
      }
    }

    function drawStars() {
      stars.forEach(s => {
        const op = s.op * (
          0.72 + 0.28 * Math.sin(t * s.ts + s.to)
        )
        const { r: cr, g: cg, b: cb } = s.color

        if (s.r > 0.9) {
          ctx.shadowBlur = s.r * 3.5
          ctx.shadowColor =
            `rgba(${cr},${cg},${cb},0.65)`
        }

        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${op})`
        ctx.fill()
        ctx.shadowBlur = 0

        if (s.flare) {
          const sp = s.r * 5
          const fo = op * 0.5

          const hg = ctx.createLinearGradient(
            s.x - sp, s.y, s.x + sp, s.y
          )
          hg.addColorStop(0, `rgba(${cr},${cg},${cb},0)`)
          hg.addColorStop(0.5, `rgba(${cr},${cg},${cb},${fo})`)
          hg.addColorStop(1, `rgba(${cr},${cg},${cb},0)`)
          ctx.beginPath()
          ctx.moveTo(s.x - sp, s.y)
          ctx.lineTo(s.x + sp, s.y)
          ctx.strokeStyle = hg
          ctx.lineWidth = 0.7
          ctx.stroke()

          const vg = ctx.createLinearGradient(
            s.x, s.y - sp, s.x, s.y + sp
          )
          vg.addColorStop(0, `rgba(${cr},${cg},${cb},0)`)
          vg.addColorStop(0.5, `rgba(${cr},${cg},${cb},${fo})`)
          vg.addColorStop(1, `rgba(${cr},${cg},${cb},0)`)
          ctx.beginPath()
          ctx.moveTo(s.x, s.y - sp)
          ctx.lineTo(s.x, s.y + sp)
          ctx.strokeStyle = vg
          ctx.lineWidth = 0.5
          ctx.stroke()

          if (s.r > 2.0) {
            const ds = sp * 0.5
            const dop = fo * 0.45
            ;[[1,1],[1,-1],[-1,1],[-1,-1]].forEach(
              ([dx, dy]) => {
                const dg = ctx.createLinearGradient(
                  s.x, s.y,
                  s.x + dx * ds, s.y + dy * ds
                )
                dg.addColorStop(0, `rgba(${cr},${cg},${cb},${dop})`)
                dg.addColorStop(1, `rgba(${cr},${cg},${cb},0)`)
                ctx.beginPath()
                ctx.moveTo(s.x, s.y)
                ctx.lineTo(s.x + dx * ds, s.y + dy * ds)
                ctx.strokeStyle = dg
                ctx.lineWidth = 0.4
                ctx.stroke()
              }
            )
          }
        }
      })
    }

    function drawPlanet() {
      const cx = W * 0.5
      const cy = H + H * 0.24
      const pr = Math.max(W, H) * 0.90

      const body = ctx.createRadialGradient(
        cx, cy, pr * 0.7, cx, cy, pr
      )
      body.addColorStop(0,    'rgba(20,8,50,0.0)')
      body.addColorStop(0.80, 'rgba(20,8,50,0.12)')
      body.addColorStop(0.92, 'rgba(30,10,70,0.40)')
      body.addColorStop(0.97, 'rgba(15,5,45,0.65)')
      body.addColorStop(1,    'rgba(10,3,30,0.0)')
      ctx.beginPath()
      ctx.arc(cx, cy, pr, 0, Math.PI * 2)
      ctx.fillStyle = body
      ctx.fill()

      const ao = ctx.createRadialGradient(
        cx, cy, pr * 0.86, cx, cy, pr * 1.1
      )
      ao.addColorStop(0,    'rgba(80,20,180,0.0)')
      ao.addColorStop(0.25, 'rgba(100,30,200,0.10)')
      ao.addColorStop(0.55, 'rgba(130,50,220,0.20)')
      ao.addColorStop(0.80, 'rgba(160,80,255,0.14)')
      ao.addColorStop(1,    'rgba(180,100,255,0.0)')
      ctx.beginPath()
      ctx.arc(cx, cy, pr * 1.1, 0, Math.PI * 2)
      ctx.fillStyle = ao
      ctx.fill()

      const ai = ctx.createRadialGradient(
        cx, cy, pr * 0.92, cx, cy, pr * 1.015
      )
      ai.addColorStop(0,    'rgba(120,40,220,0.0)')
      ai.addColorStop(0.35, 'rgba(150,60,240,0.38)')
      ai.addColorStop(0.65, 'rgba(180,90,255,0.55)')
      ai.addColorStop(0.88, 'rgba(200,120,255,0.28)')
      ai.addColorStop(1,    'rgba(200,120,255,0.0)')
      ctx.beginPath()
      ctx.arc(cx, cy, pr * 1.015, 0, Math.PI * 2)
      ctx.fillStyle = ai
      ctx.fill()

      const rimAngle = Math.acos(
        Math.min(1, Math.max(-1, (cy - H) / pr))
      )
      const rimStart = Math.PI + rimAngle
      const rimEnd = Math.PI * 2 - rimAngle

      ctx.beginPath()
      ctx.arc(cx, cy, pr, rimStart, rimEnd)
      ctx.strokeStyle = 'rgba(160,80,255,0.30)'
      ctx.lineWidth = 16
      ctx.shadowBlur = 30
      ctx.shadowColor = 'rgba(150,60,255,0.55)'
      ctx.stroke()
      ctx.shadowBlur = 0

      ctx.beginPath()
      ctx.arc(cx, cy, pr, rimStart, rimEnd)
      ctx.strokeStyle = 'rgba(190,110,255,0.55)'
      ctx.lineWidth = 4
      ctx.shadowBlur = 18
      ctx.shadowColor = 'rgba(180,90,255,0.7)'
      ctx.stroke()
      ctx.shadowBlur = 0

      ctx.beginPath()
      ctx.arc(cx, cy, pr, rimStart, rimEnd)
      ctx.strokeStyle = 'rgba(220,160,255,0.80)'
      ctx.lineWidth = 1.2
      ctx.shadowBlur = 14
      ctx.shadowColor = 'rgba(210,140,255,0.95)'
      ctx.stroke()
      ctx.shadowBlur = 0

      const hf = ctx.createLinearGradient(
        0, H * 0.70, 0, H
      )
      hf.addColorStop(0,    'rgba(7,3,15,0)')
      hf.addColorStop(0.45, 'rgba(7,3,15,0.50)')
      hf.addColorStop(1,    'rgba(7,3,15,0.97)')
      ctx.fillStyle = hf
      ctx.fillRect(0, H * 0.70, W, H * 0.30)
    }

    function maybeShootingStar() {
      shootTimer++
      if (!shoot && shootTimer > 380 + Math.random() * 550) {
        const angle = (18 + Math.random() * 22) * Math.PI / 180
        const spd = 5.5 + Math.random() * 4
        shoot = {
          x: Math.random() * W * 0.55,
          y: Math.random() * H * 0.3,
          vx: spd * Math.cos(angle),
          vy: spd * Math.sin(angle),
          life: 0, max: 50,
        }
        shootTimer = 0
      }
      if (!shoot) return

      const p = shoot.life / shoot.max
      const fade = Math.sin(p * Math.PI)
      const tl = 90
      const tx = shoot.x - shoot.vx * (tl / shoot.vx)
      const ty = shoot.y - shoot.vy * (tl / shoot.vx)

      const sg = ctx.createLinearGradient(tx, ty, shoot.x, shoot.y)
      sg.addColorStop(0,   'rgba(220,180,255,0)')
      sg.addColorStop(0.6, `rgba(220,180,255,${fade * 0.35})`)
      sg.addColorStop(1,   `rgba(255,255,255,${fade * 0.85})`)
      ctx.beginPath()
      ctx.moveTo(tx, ty)
      ctx.lineTo(shoot.x, shoot.y)
      ctx.strokeStyle = sg
      ctx.lineWidth = 1.4
      ctx.stroke()

      ctx.beginPath()
      ctx.arc(shoot.x, shoot.y, 1.4, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255,255,255,${fade * 0.9})`
      ctx.fill()

      shoot.x += shoot.vx
      shoot.y += shoot.vy
      shoot.life++
      if (shoot.life >= shoot.max) shoot = null
    }

    function render() {
      t++
      ctx.fillStyle = '#07030F'
      ctx.fillRect(0, 0, W, H)

      const nb1 = ctx.createRadialGradient(
        W * 0.08, H * 0.3, 0,
        W * 0.08, H * 0.3, W * 0.35
      )
      nb1.addColorStop(0, 'rgba(60,20,140,0.06)')
      nb1.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = nb1
      ctx.fillRect(0, 0, W, H)

      const nb2 = ctx.createRadialGradient(
        W * 0.05, H * 0.7, 0,
        W * 0.05, H * 0.7, W * 0.28
      )
      nb2.addColorStop(0, 'rgba(6,182,212,0.045)')
      nb2.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = nb2
      ctx.fillRect(0, 0, W, H)

      drawStars()
      maybeShootingStar()
      drawPlanet()

      animId = requestAnimationFrame(render)
    }

    function resize() {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      W = canvas.width
      H = canvas.height
      buildStars()
    }

    window.addEventListener('resize', resize)
    resize()
    render()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ zIndex: 0 }}
    />
  )
}

export default function LandingPage() {
  return (
    <div style={{
      background: '#07030F',
      color: '#F0ECF8',
      minHeight: '100vh',
      overflowX: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>

      {/* ── NAVBAR ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: '60px',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 48px',
        background: 'rgba(7,3,15,0.6)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(139,92,246,0.12)',
      }}>
        <Link href="/" style={{
          display: 'flex', alignItems: 'center',
          gap: '10px', textDecoration: 'none',
        }}>
          <Logo width={30} variant="icon"/>
          <span style={{
            fontSize: '18px', fontWeight: 700,
            letterSpacing: '-0.02em',
            color: '#F0ECF8',
          }}>
            Research<span style={{ color: '#FBBF24' }}>Flow</span>
          </span>
        </Link>

        <div style={{
          display: 'flex', gap: '36px',
        }} className="hidden md:flex">
          {['Features', 'How It Works', 'Universities'].map(item => (
            <a key={item} href="#" style={{
              fontSize: '14px',
              color: 'rgba(196,181,253,0.6)',
              textDecoration: 'none',
            }}>
              {item}
            </a>
          ))}
        </div>

        <div style={{
          display: 'flex', gap: '12px',
          alignItems: 'center',
        }}>
          <Link href="/auth/login" style={{
            fontSize: '14px', color: '#F0ECF8',
            textDecoration: 'none', padding: '8px 16px',
          }}>
            Sign in
          </Link>
          <Link href="/auth/signup" style={{
            fontSize: '14px', fontWeight: 600,
            color: '#fff',
            padding: '9px 22px', borderRadius: '8px',
            background: 'linear-gradient(135deg,#7C3AED,#A855F7)',
            boxShadow: '0 0 20px rgba(124,58,237,0.45)',
            textDecoration: 'none',
          }}>
            Get Started
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        textAlign: 'center',
        padding: '80px 24px 140px',
      }}>
        {/* Animated canvas background */}
        <HeroCanvas />

        {/* Ghost Baobab — right side, very subtle */}
        <svg
          viewBox="0 0 520 580"
          style={{
            position: 'absolute',
            right: '-40px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '480px',
            opacity: 0.07,
            zIndex: 1,
            pointerEvents: 'none',
            animation: 'bgFloat 16s ease-in-out infinite',
          }}
          className="hidden lg:block"
        >
          <defs>
            <linearGradient id="bgT" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7C3AED"/>
              <stop offset="100%" stopColor="#2E1065"/>
            </linearGradient>
          </defs>
          <path d="M 242,420 C 237,450 230,490 226,540 L 294,540 C 290,490 283,450 278,420 Z" fill="url(#bgT)"/>
          <path d="M 260,420 Q 160,300 25,105" stroke="#A855F7" strokeWidth="7" fill="none" strokeLinecap="round"/>
          <path d="M 260,420 Q 195,285 85,90" stroke="#A855F7" strokeWidth="7" fill="none" strokeLinecap="round"/>
          <path d="M 260,420 Q 230,270 185,65" stroke="#A855F7" strokeWidth="7" fill="none" strokeLinecap="round"/>
          <path d="M 260,420 Q 260,270 260,48" stroke="#A855F7" strokeWidth="7.5" fill="none" strokeLinecap="round"/>
          <path d="M 260,420 Q 290,270 335,65" stroke="#A855F7" strokeWidth="7" fill="none" strokeLinecap="round"/>
          <path d="M 260,420 Q 325,285 435,90" stroke="#A855F7" strokeWidth="7" fill="none" strokeLinecap="round"/>
          <path d="M 260,420 Q 360,300 495,105" stroke="#A855F7" strokeWidth="7" fill="none" strokeLinecap="round"/>
          <g fill="none" stroke="#C4B5FD" strokeWidth="2" strokeLinecap="round" opacity="0.7">
            <path d="M 25,105 Q 55,92 85,90"/>
            <path d="M 85,90 Q 135,76 185,65"/>
            <path d="M 185,65 Q 222,56 260,48"/>
            <path d="M 260,48 Q 297,56 335,65"/>
            <path d="M 335,65 Q 385,76 435,90"/>
            <path d="M 435,90 Q 465,92 495,105"/>
          </g>
          <circle cx="25" cy="105" r="11" fill="#8B5CF6"/>
          <circle cx="85" cy="90" r="10" fill="#A855F7"/>
          <circle cx="185" cy="65" r="11" fill="#8B5CF6"/>
          <circle cx="260" cy="48" r="18" fill="rgba(251,191,36,0.18)"/>
          <circle cx="260" cy="48" r="12" fill="#FBBF24"/>
          <circle cx="335" cy="65" r="11" fill="#8B5CF6"/>
          <circle cx="435" cy="90" r="10" fill="#A855F7"/>
          <circle cx="495" cy="105" r="11" fill="#8B5CF6"/>
        </svg>

        <style>{`
          @keyframes bgFloat {
            0%,100% { transform:translateY(-50%); }
            50% { transform:translateY(-52.5%); }
          }
        `}</style>

        {/* Hero content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22,1,0.36,1] }}
          style={{
            position: 'relative', zIndex: 10,
            maxWidth: '920px', width: '100%',
          }}
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            style={{
              display: 'inline-flex', alignItems: 'center',
              gap: '8px', fontSize: '13px', fontWeight: 500,
              color: 'rgba(196,181,253,0.9)',
              background: 'rgba(124,58,237,0.12)',
              border: '1px solid rgba(139,92,246,0.3)',
              padding: '7px 20px', borderRadius: '100px',
              marginBottom: '32px',
              boxShadow: '0 0 20px rgba(124,58,237,0.15)',
            }}
          >
            ⚡ Built for African researchers, by African innovators
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            style={{
              fontSize: 'clamp(52px, 8vw, 92px)',
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: '-0.025em',
              marginBottom: '22px',
              background: 'linear-gradient(180deg, #E8DEFF 0%, #C4B5FD 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Collaborate. Discover.<br/>Publish.
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7 }}
            style={{
              fontSize: 'clamp(15px, 1.8vw, 18px)',
              color: 'rgba(196,181,253,0.5)',
              lineHeight: 1.75,
              maxWidth: '540px',
              margin: '0 auto 42px',
            }}
          >
            The premier research collaboration platform connecting
            university students across Africa. Find collaborators,
            access mentors, and bring your research ideas to life.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7 }}
            style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'center',
              gap: '14px', flexWrap: 'wrap',
              marginBottom: '72px',
            }}
          >
            <MagneticButton>
              <Link href="/auth/signup" style={{
                display: 'inline-flex', alignItems: 'center',
                gap: '8px', fontSize: '15px', fontWeight: 700,
                color: '#fff',
                padding: '13px 30px', borderRadius: '9px',
                background: 'linear-gradient(135deg,#7C3AED,#A855F7)',
                boxShadow: '0 0 26px rgba(124,58,237,0.55)',
                textDecoration: 'none',
                letterSpacing: '-0.01em',
              }}>
                Start Collaborating →
              </Link>
            </MagneticButton>
            <Link href="/auth/login" style={{
              display: 'inline-flex', alignItems: 'center',
              gap: '8px', fontSize: '15px', fontWeight: 500,
              color: 'rgba(196,181,253,0.8)',
              padding: '13px 26px', borderRadius: '9px',
              border: '1px solid rgba(139,92,246,0.3)',
              background: 'rgba(124,58,237,0.07)',
              textDecoration: 'none',
            }}>
              Sign In
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.7 }}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '12px',
              maxWidth: '860px',
              margin: '0 auto',
            }}
            className="grid-cols-2 sm:grid-cols-4"
          >
            {[
              { num: '100+', label: 'African Universities' },
              { num: '10K+', label: 'Student Researchers' },
              { num: '500+', label: 'Active Projects' },
              { num: '95%', label: 'Match Success Rate' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + i * 0.08 }}
                whileHover={{
                  borderColor: 'rgba(139,92,246,0.35)',
                  background: 'rgba(124,58,237,0.07)',
                }}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(139,92,246,0.18)',
                  borderRadius: '14px',
                  padding: '22px 16px 18px',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{
                  fontSize: '36px', fontWeight: 900,
                  letterSpacing: '-0.03em', lineHeight: 1,
                  marginBottom: '6px',
                  background: 'linear-gradient(135deg, #C4B5FD, #A855F7)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  {stat.num}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: 'rgba(196,181,253,0.4)',
                  letterSpacing: '0.01em',
                }}>
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ── FEATURES SECTION ── */}
      <section style={{
        padding: '120px 24px',
        maxWidth: '1100px',
        margin: '0 auto',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          style={{ textAlign: 'center', marginBottom: '64px' }}
        >
          <p style={{
            fontSize: '13px', fontWeight: 600,
            letterSpacing: '0.15em', textTransform: 'uppercase',
            color: 'rgba(196,181,253,0.5)',
            marginBottom: '16px',
          }}>
            Everything you need
          </p>
          <h2 style={{
            fontSize: 'clamp(32px, 5vw, 52px)',
            fontWeight: 800, letterSpacing: '-0.025em',
            background: 'linear-gradient(180deg, #E8DEFF 0%, #C4B5FD 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '16px',
          }}>
            Built for African Research
          </h2>
          <p style={{
            fontSize: '17px',
            color: 'rgba(196,181,253,0.45)',
            maxWidth: '480px', margin: '0 auto',
            lineHeight: 1.7,
          }}>
            Every feature designed specifically for
            the African research context.
          </p>
        </motion.div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px',
        }} className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: '🤝',
              title: 'Smart Matching',
              desc: 'Algorithm-powered matching connects you with researchers who complement your skills and share your interests.',
              color: '#7C3AED',
            },
            {
              icon: '💡',
              title: 'Ideas Board',
              desc: 'Post research ideas, get feedback from peers, and find collaborators to bring them to life.',
              color: '#0891B2',
            },
            {
              icon: '🎓',
              title: 'Mentor Directory',
              desc: 'Connect with verified mentors from your field for guidance, career advice, and academic support.',
              color: '#059669',
            },
            {
              icon: '💰',
              title: 'Grants Directory',
              desc: 'Discover and apply for funding opportunities across Africa. Never miss a grant deadline again.',
              color: '#D97706',
            },
            {
              icon: '🏆',
              title: 'Akili Score',
              desc: 'Build your research reputation with every contribution. Your Akili score reflects your impact.',
              color: '#7C3AED',
            },
            {
              icon: '📚',
              title: 'Research Showcase',
              desc: 'Publish and share your research work with the African academic community and beyond.',
              color: '#DC2626',
            },
          ].map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.6 }}
              whileHover={{ y: -6 }}
              style={{
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(139,92,246,0.15)',
                borderRadius: '20px',
                padding: '32px 28px',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                transition: 'border-color 0.3s, box-shadow 0.3s',
                cursor: 'default',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = `${feature.color}40`
                el.style.boxShadow = `0 8px 32px ${feature.color}15`
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = 'rgba(139,92,246,0.15)'
                el.style.boxShadow = 'none'
              }}
            >
              <div style={{
                width: '52px', height: '52px',
                borderRadius: '14px',
                background: `${feature.color}20`,
                border: `1px solid ${feature.color}30`,
                display: 'flex', alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                marginBottom: '20px',
              }}>
                {feature.icon}
              </div>
              <h3 style={{
                fontSize: '17px', fontWeight: 700,
                color: '#F0ECF8',
                marginBottom: '10px',
              }}>
                {feature.title}
              </h3>
              <p style={{
                fontSize: '14px',
                color: 'rgba(196,181,253,0.45)',
                lineHeight: 1.7,
              }}>
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA SECTION ── */}
      <section style={{
        padding: '100px 24px',
        textAlign: 'center',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          style={{
            maxWidth: '680px',
            margin: '0 auto',
            background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(34,211,238,0.08))',
            border: '1px solid rgba(124,58,237,0.25)',
            borderRadius: '28px',
            padding: '64px 48px',
          }}
        >
          <h2 style={{
            fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: 800, letterSpacing: '-0.025em',
            background: 'linear-gradient(180deg, #E8DEFF 0%, #C4B5FD 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '16px',
          }}>
            Ready to transform your research?
          </h2>
          <p style={{
            fontSize: '17px',
            color: 'rgba(196,181,253,0.5)',
            marginBottom: '36px',
            lineHeight: 1.7,
          }}>
            Join thousands of African researchers already
            collaborating, discovering, and publishing on ResearchFlow.
          </p>
          <MagneticButton>
            <Link href="/auth/signup" style={{
              display: 'inline-flex', alignItems: 'center',
              gap: '8px', fontSize: '16px', fontWeight: 700,
              color: '#fff',
              padding: '15px 36px', borderRadius: '10px',
              background: 'linear-gradient(135deg,#7C3AED,#A855F7)',
              boxShadow: '0 0 30px rgba(124,58,237,0.5)',
              textDecoration: 'none',
            }}>
              Join ResearchFlow Free →
            </Link>
          </MagneticButton>
          <p style={{
            fontSize: '13px',
            color: 'rgba(196,181,253,0.3)',
            marginTop: '16px',
          }}>
            Free forever · No credit card required
          </p>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        borderTop: '1px solid rgba(139,92,246,0.12)',
        padding: '40px 48px',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '16px',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center',
          gap: '8px',
        }}>
          <Logo width={24} variant="icon"/>
          <span style={{
            fontSize: '15px', fontWeight: 700,
            color: '#F0ECF8',
          }}>
            Research<span style={{ color: '#FBBF24' }}>Flow</span>
          </span>
        </div>
        <p style={{
          fontSize: '13px',
          color: 'rgba(196,181,253,0.3)',
        }}>
          © 2026 ResearchFlow · researchflowafrica.com
        </p>
        <div style={{
          display: 'flex', gap: '24px',
        }}>
          {['Privacy', 'Terms', 'Contact'].map(item => (
            <a key={item} href="#" style={{
              fontSize: '13px',
              color: 'rgba(196,181,253,0.3)',
              textDecoration: 'none',
            }}>
              {item}
            </a>
          ))}
        </div>
      </footer>
    </div>
  )
}
