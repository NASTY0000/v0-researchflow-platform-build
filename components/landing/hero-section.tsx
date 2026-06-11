'use client'

import { useLayoutEffect, useRef } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MagneticButton } from '@/components/ui/micro-interactions'
import { gsap } from '@/lib/gsap'

const HeroCanvas = dynamic(() => import('./hero-canvas'), { ssr: false })

const HEADLINE_WORDS = [
  { text: 'Collaborate.', gradient: 'from-[#F8F5FF] to-[#C4B5FD]' },
  { text: 'Discover.', gradient: 'from-[#C084FC] to-[#818CF8]' },
  { text: 'Publish.', gradient: 'from-[#A855F7] to-[#06B6D4]' },
]

const STATS = [
  { value: 100, suffix: '+', label: 'African Universities' },
  { value: 10, suffix: 'K+', label: 'Student Researchers' },
  { value: 500, suffix: '+', label: 'Active Projects' },
  { value: 95, suffix: '%', label: 'Match Success Rate' },
]

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const canvasWrapRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const mm = gsap.matchMedia()

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const section = sectionRef.current
      if (!section) return

      const intro = gsap.timeline({ defaults: { ease: 'power3.out' } })

      intro
        .from('[data-hero-canvas]', { autoAlpha: 0, scale: 1.06, duration: 1.6, ease: 'power2.out' }, 0)
        .from('[data-hero-badge]', { autoAlpha: 0, y: 18, duration: 0.7 }, 0.25)
        .from('[data-hero-char]', {
          yPercent: 112,
          duration: 1.05,
          ease: 'power4.out',
          stagger: 0.022,
        }, 0.4)
        .from('[data-hero-sub]', { autoAlpha: 0, y: 26, duration: 0.8 }, 0.95)
        .from('[data-hero-cta] > *', { autoAlpha: 0, y: 22, duration: 0.7, stagger: 0.1 }, 1.1)
        .from('[data-hero-cue]', { autoAlpha: 0, duration: 0.9 }, 1.6)

      const stats = gsap.utils.toArray<HTMLElement>('[data-hero-stat]')
      gsap.set(stats, { autoAlpha: 0, y: 30 })
      gsap.to(stats, {
        autoAlpha: 1,
        y: 0,
        duration: 0.7,
        ease: 'power3.out',
        stagger: 0.08,
        delay: 1.25,
        clearProps: 'transform,visibility,opacity',
      })

      // Count the stats up once they enter
      gsap.utils.toArray<HTMLElement>('[data-count-to]').forEach((el) => {
        const target = Number(el.dataset.countTo)
        const counter = { value: 0 }
        gsap.to(counter, {
          value: target,
          duration: 1.8,
          delay: 1.3,
          ease: 'power2.out',
          onUpdate: () => {
            el.textContent = String(Math.round(counter.value))
          },
        })
      })

      // Cinematic exit while scrolling away
      gsap.to(contentRef.current, {
        yPercent: 16,
        autoAlpha: 0,
        ease: 'none',
        scrollTrigger: { trigger: section, start: 'top top', end: '88% top', scrub: true },
      })
      gsap.to(canvasWrapRef.current, {
        scale: 1.14,
        autoAlpha: 0.15,
        ease: 'none',
        scrollTrigger: { trigger: section, start: 'top top', end: 'bottom top', scrub: true },
      })

      return () => intro.kill()
    })

    return () => mm.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden bg-[#05010F] px-4 pt-28 pb-16"
    >
      {/* Three.js network globe */}
      <div ref={canvasWrapRef} data-hero-canvas className="absolute inset-0 will-change-transform">
        <HeroCanvas />
      </div>

      {/* Readability + depth overlays */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_42%,rgba(5,1,15,0.55),rgba(5,1,15,0.2)_55%,rgba(5,1,15,0.05))]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent to-[#05010F]" />
      <div className="pointer-events-none absolute inset-0 noise" />

      <div ref={contentRef} className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center text-center will-change-transform">
        <div
          data-hero-badge
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-600/10 px-4 py-2 backdrop-blur-md shadow-[0_0_24px_rgba(124,58,237,0.18)]"
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-300" />
          <span className="text-xs font-medium tracking-wide text-violet-200 sm:text-sm">
            Built for African researchers, by African innovators
          </span>
        </div>

        <h1 className="mb-7 font-heading text-[11vw] font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl xl:text-[5.25rem]">
          {HEADLINE_WORDS.map((word, w) => (
            <span key={word.text} className="inline-block whitespace-nowrap">
              <span className="inline-block overflow-hidden pb-[0.12em] align-bottom">
                {word.text.split('').map((char, c) => (
                  <span
                    key={c}
                    data-hero-char
                    className={`inline-block bg-gradient-to-br ${word.gradient} bg-clip-text text-transparent will-change-transform`}
                  >
                    {char}
                  </span>
                ))}
              </span>
              {w < HEADLINE_WORDS.length - 1 && <span className="inline-block w-[0.28em]" />}
            </span>
          ))}
        </h1>

        <p data-hero-sub className="mx-auto mb-10 max-w-2xl text-base leading-relaxed text-[#B7A8D4] sm:text-lg lg:text-xl">
          The premier research collaboration platform connecting university students across Africa.
          Find collaborators, access mentors, and bring your research ideas to life.
        </p>

        <div data-hero-cta className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <MagneticButton>
            <Button
              size="lg"
              asChild
              className="group h-12 rounded-full border-none bg-gradient-to-br from-violet-600 to-fuchsia-600 px-7 text-base shadow-[0_0_28px_rgba(124,58,237,0.45)] transition-all hover:shadow-[0_0_44px_rgba(168,85,247,0.6)]"
            >
              <Link href="/auth/signup">
                Start Collaborating
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </MagneticButton>
          <MagneticButton>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="h-12 rounded-full border-violet-400/30 bg-white/[0.03] px-7 text-base text-violet-200 backdrop-blur-md hover:border-violet-400/60 hover:bg-violet-500/10 hover:text-violet-100"
            >
              <Link href="#how-it-works">See How It Works</Link>
            </Button>
          </MagneticButton>
        </div>

        {/* Stats */}
        <div className="mt-16 grid w-full max-w-4xl grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              data-hero-stat
              className="group rounded-2xl border border-violet-500/15 bg-white/[0.03] p-5 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-violet-400/40 hover:bg-white/[0.05] hover:shadow-[0_8px_40px_rgba(124,58,237,0.25)]"
            >
              <div className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
                <span className="bg-gradient-to-br from-[#E9D5FF] to-[#818CF8] bg-clip-text text-transparent">
                  <span data-count-to={stat.value}>{stat.value}</span>
                  {stat.suffix}
                </span>
              </div>
              <div className="mt-1 text-xs text-[#9D8BB8] sm:text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll cue */}
      <div data-hero-cue className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2">
        <Link href="#features" aria-label="Scroll to features" className="flex flex-col items-center gap-2 text-[#9D8BB8] transition-colors hover:text-violet-300">
          <span className="text-[10px] uppercase tracking-[0.3em]">Scroll</span>
          <span className="flex h-9 w-5 items-start justify-center rounded-full border border-violet-400/30 p-1">
            <span className="h-2 w-1 animate-scroll-cue rounded-full bg-violet-300" />
          </span>
        </Link>
      </div>
    </section>
  )
}
