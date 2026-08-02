'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MagneticButton } from '@/components/ui/micro-interactions'
import { Reveal } from './reveal'

export function CtaSection() {
  return (
    <section className="relative overflow-hidden bg-[#05010F] px-4 py-28">
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <div
            data-reveal
            className="cta-shimmer noise relative overflow-hidden rounded-[2rem] border border-violet-500/30 px-8 py-16 text-center sm:px-16 sm:py-24"
          >
            {/* Animated aurora backdrop */}
            <div className="pointer-events-none absolute inset-0 bg-[#0A0318]" />
            <div className="aurora-blob pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-violet-600/40 blur-[100px]" />
            <div className="aurora-blob pointer-events-none absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-fuchsia-600/30 blur-[110px] [animation-delay:-4s]" />
            <div className="aurora-blob pointer-events-none absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-cyan-500/20 blur-[100px] [animation-delay:-8s]" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,255,255,0.07),transparent_60%)]" />

            <div className="relative z-10">
              {/* No eyebrow, the aurora speaks for itself */}
              <h2
                className="mx-auto mb-6 max-w-2xl font-heading font-extrabold text-white"
                style={{ fontSize: 'clamp(2.25rem, 5vw, 4rem)', lineHeight: 1.05, letterSpacing: '-0.035em' }}
              >
                Ready to Transform{' '}
                <span className="text-[#C084FC]">Your Research?</span>
              </h2>
              <p className="mx-auto mb-10 max-w-xl text-[#C4B5DE]" style={{ fontSize: '1.0625rem', lineHeight: 1.7 }}>
                Join the growing community of African researchers collaborating, learning, and publishing together.
              </p>
              <div className="flex justify-center">
                <MagneticButton>
                  <Button
                    size="lg"
                    asChild
                    className="group h-14 rounded-full border-none bg-white px-10 text-base font-semibold text-violet-900 shadow-[0_0_40px_rgba(255,255,255,0.25)] transition-all hover:bg-white hover:shadow-[0_0_60px_rgba(255,255,255,0.4)]"
                  >
                    <Link href="/auth/signup">
                      Create Free Account
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1.5" />
                    </Link>
                  </Button>
                </MagneticButton>
              </div>
              <p className="mt-6 text-xs text-[#9D8BB8]">Free forever for core features. No credit card required.</p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
