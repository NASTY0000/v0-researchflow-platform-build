'use client'

import { useLayoutEffect, useRef } from 'react'
import { User, Users, Award } from 'lucide-react'
import { gsap } from '@/lib/gsap'

const STEPS = [
  {
    step: '01',
    icon: User,
    color: '#A855F7',
    title: 'Create Your Profile',
    description:
      "Sign up with your university email, add your skills, research interests, and what you're looking to achieve. Your profile is your academic identity on ResearchFlow.",
  },
  {
    step: '02',
    icon: Users,
    color: '#22D3EE',
    title: 'Find Your Match',
    description:
      'Our smart algorithm surfaces collaborators, ideas, and mentors tailored to your research goals. Browse opportunities or let matches come to you.',
  },
  {
    step: '03',
    icon: Award,
    color: '#C084FC',
    title: 'Publish & Grow',
    description:
      'Form teams, manage projects with built-in tools, earn Akili Score points, and publish your completed research to the African academic community.',
  },
]

export function HowItWorksSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const beamRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const section = sectionRef.current
      if (!section) return

      gsap.from(section.querySelectorAll('[data-step-head]'), {
        autoAlpha: 0,
        y: 40,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.1,
        scrollTrigger: { trigger: section, start: 'top 80%', once: true },
      })

      // Central beam draws itself as you scroll through the steps
      gsap.fromTo(
        beamRef.current,
        { scaleY: 0 },
        {
          scaleY: 1,
          transformOrigin: 'top',
          ease: 'none',
          scrollTrigger: {
            trigger: section.querySelector('[data-steps]'),
            start: 'top 70%',
            end: 'bottom 65%',
            scrub: 0.6,
          },
        },
      )

      gsap.utils.toArray<HTMLElement>('[data-step-card]').forEach((card, i) => {
        gsap.from(card, {
          autoAlpha: 0,
          x: i % 2 === 0 ? -56 : 56,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: { trigger: card, start: 'top 80%', once: true },
        })
        const dot = card.parentElement?.querySelector('[data-step-dot]')
        if (dot) {
          gsap.from(dot, {
            scale: 0,
            duration: 0.5,
            ease: 'back.out(2.5)',
            scrollTrigger: { trigger: card, start: 'top 78%', once: true },
          })
        }
      })
    })
    return () => mm.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      className="relative scroll-mt-16 overflow-hidden bg-[#070213] px-4 py-28"
    >
      <div className="pointer-events-none absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />

      <div className="mx-auto max-w-5xl">
        <div className="mb-20 text-center">
          <p data-step-head className="label-section mb-3 !text-violet-400/80">Getting Started</p>
          <h2 data-step-head className="mb-4 font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Get Started in{' '}
            <span className="bg-gradient-to-r from-[#C084FC] to-[#818CF8] bg-clip-text text-transparent">Minutes</span>
          </h2>
          <p data-step-head className="text-[#9D8BB8]">
            Join thousands of researchers already collaborating on ResearchFlow.
          </p>
        </div>

        <div data-steps className="relative">
          {/* Track + animated beam */}
          <div className="absolute left-5 top-0 h-full w-px bg-violet-500/15 md:left-1/2 md:-translate-x-1/2" />
          <div
            ref={beamRef}
            className="absolute left-5 top-0 h-full w-px bg-gradient-to-b from-violet-500 via-fuchsia-500 to-cyan-400 shadow-[0_0_12px_rgba(168,85,247,0.8)] md:left-1/2 md:-translate-x-1/2"
          />

          <div className="space-y-14 md:space-y-24">
            {STEPS.map((item, i) => (
              <div key={item.step} className="relative md:grid md:grid-cols-2 md:gap-16">
                {/* Node on the beam */}
                <span
                  data-step-dot
                  className="absolute left-5 top-9 z-10 -translate-x-1/2 md:left-1/2"
                >
                  <span
                    className="block h-4 w-4 rounded-full border-2 border-[#070213]"
                    style={{ background: item.color, boxShadow: `0 0 16px ${item.color}` }}
                  />
                </span>

                <div className={i % 2 === 0 ? 'md:col-start-1' : 'md:col-start-2'}>
                  <div
                    data-step-card
                    className="group ml-12 rounded-2xl border border-violet-500/15 bg-white/[0.025] p-8 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-violet-400/35 hover:shadow-[0_16px_48px_rgba(124,58,237,0.18)] md:ml-0"
                  >
                    <div className="mb-5 flex items-center gap-4">
                      <div
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
                        style={{ background: `${item.color}1f`, border: `1px solid ${item.color}40` }}
                      >
                        <item.icon className="h-6 w-6" style={{ color: item.color }} />
                      </div>
                      <span className="font-heading text-5xl font-extrabold leading-none tracking-tighter text-white/[0.07]">
                        {item.step}
                      </span>
                    </div>
                    <h3 className="mb-3 font-heading text-xl font-semibold text-white">{item.title}</h3>
                    <p className="text-sm leading-relaxed text-[#9D8BB8]">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
