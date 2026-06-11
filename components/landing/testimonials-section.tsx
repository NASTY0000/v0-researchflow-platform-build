'use client'

import { Star } from 'lucide-react'
import { Reveal } from './reveal'

const TESTIMONIALS = [
  {
    quote:
      'Within two weeks of joining ResearchFlow, I had three collaborators for my climate adaptation study. We submitted to a peer-reviewed journal six months later — something I could not have done alone.',
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
  return (
    <section id="testimonials" className="relative scroll-mt-16 overflow-hidden bg-[#05010F] px-4 py-28">
      <div className="pointer-events-none absolute right-0 top-1/3 h-96 w-96 rounded-full bg-fuchsia-700/10 blur-[130px]" />

      <div className="relative z-10 mx-auto max-w-7xl">
        <Reveal className="mb-16 text-center">
          <p data-reveal className="label-section mb-3 !text-violet-400/80">Social Proof</p>
          <h2 data-reveal className="font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Trusted by Researchers{' '}
            <span className="bg-gradient-to-r from-[#C084FC] to-[#22D3EE] bg-clip-text text-transparent">Across Africa</span>
          </h2>
        </Reveal>

        <Reveal className="grid gap-5 md:grid-cols-3" stagger={0.12}>
          {TESTIMONIALS.map((t) => (
            <figure
              key={t.author}
              data-reveal
              className="group relative flex flex-col rounded-2xl border border-violet-500/15 bg-white/[0.025] p-7 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-violet-400/35 hover:shadow-[0_16px_48px_rgba(124,58,237,0.18)]"
            >
              <span aria-hidden="true" className="pointer-events-none absolute right-6 top-3 font-heading text-7xl font-extrabold leading-none text-violet-500/10 transition-colors duration-300 group-hover:text-violet-500/20">
                &rdquo;
              </span>
              <div className="mb-4 flex gap-1">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-current text-amber-400" />
                ))}
              </div>
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
