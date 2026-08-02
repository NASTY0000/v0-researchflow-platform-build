'use client'

import { useLayoutEffect, useRef } from 'react'
import { Reveal } from './reveal'
import { gsap } from '@/lib/gsap'

const TESTIMONIALS = [
  {
    quote:
      'Within two weeks of joining ResearchFlow, I had three collaborators for my climate adaptation study. We submitted to a peer-reviewed journal six months later, something I could not have done alone.',
    author: 'Amara Okafor',
    role: 'PhD Candidate, University of Ibadan',
    initial: 'A',
    gradient: 'from-violet-600 to-fuchsia-600',
  },
  {
    quote:
      'The Akili Score system genuinely motivates students to contribute meaningfully. My lab has seen a 40% increase in cross-departmental project proposals since we started using ResearchFlow.',
    author: 'Dr. Chukwuemeka Adeyemi',
    role: 'Associate Professor, Obafemi Awolowo University',
    initial: 'C',
    gradient: 'from-cyan-600 to-violet-600',
  },
  {
    quote:
      'As a female researcher in northern Nigeria, finding a mentor felt impossible. ResearchFlow connected me with a senior researcher in Nairobi in days. That relationship changed my career.',
    author: 'Fatima Al-Hassan',
    role: 'Masters Student, Ahmadu Bello University',
    initial: 'F',
    gradient: 'from-fuchsia-600 to-amber-500',
  },
]

export function TestimonialsSection() {
  const sectionRef = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.utils.toArray<HTMLElement>('[data-testimonial-card]').forEach((card) => {
        card.addEventListener('mouseenter', () => {
          gsap.to(card, { y: -6, duration: 0.35, ease: 'power3.out', overwrite: 'auto' })
        })
        card.addEventListener('mouseleave', () => {
          gsap.to(card, { y: 0, duration: 0.5, ease: 'power2.out', overwrite: 'auto' })
        })
      })
    })
    return () => mm.revert()
  }, [])

  return (
    <section ref={sectionRef} id="testimonials" className="relative scroll-mt-16 overflow-hidden bg-[#05010F] px-4 py-28">
      <div className="pointer-events-none absolute right-0 top-1/3 h-96 w-96 rounded-full bg-fuchsia-700/10 blur-[130px]" />

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* No "Social Proof" eyebrow, heading is the statement */}
        <Reveal className="mb-16 text-center">
          <h2
            data-reveal
            className="font-heading font-extrabold text-white"
            style={{ fontSize: 'clamp(2rem, 4.5vw, 3.25rem)', lineHeight: 1.1, letterSpacing: '-0.03em' }}
          >
            Trusted by Researchers{' '}
            <span className="text-[#C084FC]">Across Africa</span>
          </h2>
        </Reveal>

        <Reveal className="grid gap-5 md:grid-cols-3" stagger={0.12}>
          {TESTIMONIALS.map((t) => (
            <figure
              key={t.author}
              data-reveal
              data-testimonial-card
              className="group relative flex flex-col rounded-2xl border border-violet-500/15 bg-white/[0.025] p-7 backdrop-blur-sm transition-[border-color,box-shadow] duration-300 hover:border-violet-400/35 hover:shadow-[0_16px_48px_rgba(124,58,237,0.18)]"
            >
              {/* Decorative quote mark, visible at 20% opacity, not 10% */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute right-6 top-3 font-heading font-extrabold leading-none text-violet-500/20 transition-colors duration-300 group-hover:text-violet-500/30"
                style={{ fontSize: '6rem', lineHeight: 1 }}
              >
                &rdquo;
              </span>
              <blockquote className="mb-6 flex-1 leading-relaxed text-[#D8CDEE]">&ldquo;{t.quote}&rdquo;</blockquote>
              <figcaption className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${t.gradient} text-sm font-bold text-white shadow-[0_0_16px_rgba(124,58,237,0.4)]`}>
                  {t.initial}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{t.author}</div>
                  <div className="text-xs text-[#9D8BB8]">{t.role}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </Reveal>
      </div>
    </section>
  )
}
