'use client'

import { useLayoutEffect, useRef } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { gsap } from '@/lib/gsap'

const FOOTER_COLUMNS = [
  {
    heading: 'Platform',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'How It Works', href: '#how-it-works' },
      { label: 'Showcase', href: '/showcase' },
      { label: 'Join', href: '/join' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Terms', href: '/terms' },
      { label: 'Privacy', href: '/privacy' },
    ],
  },
]

export function LandingFooter() {
  const footerRef = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const footer = footerRef.current
      if (!footer) return

      const cols = footer.querySelectorAll('[data-footer-col]')
      const bottom = footer.querySelector('[data-footer-bottom]')

      gsap.from(cols, {
        autoAlpha: 0,
        y: 32,
        duration: 0.8,
        ease: 'power3.out',
        stagger: 0.1,
        scrollTrigger: { trigger: footer, start: 'top 90%', once: true },
      })
      gsap.from(bottom, {
        autoAlpha: 0,
        duration: 0.7,
        ease: 'power2.out',
        delay: 0.4,
        scrollTrigger: { trigger: footer, start: 'top 90%', once: true },
      })
    })
    return () => mm.revert()
  }, [])

  return (
    <footer ref={footerRef} className="relative border-t border-violet-500/10 bg-[#040110] px-4 pb-10 pt-16">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div data-footer-col>
            <Link href="/" aria-label="ResearchFlow home" className="inline-block transition-opacity hover:opacity-85">
              <Logo variant="horizontal" width={170} uid="footer" />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[#7E6BA3]">
              The premier research collaboration platform connecting university students across Africa.
            </p>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <div key={column.heading} data-footer-col>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#9D8BB8]">
                {column.heading}
              </h3>
              <ul className="space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-[#7E6BA3] transition-colors hover:text-violet-300"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          data-footer-bottom
          className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-violet-500/10 pt-8 sm:flex-row"
        >
          <p className="text-sm text-[#7E6BA3]">
            &copy; {new Date().getFullYear()} ResearchFlow. All rights reserved.
          </p>
          <p className="text-xs text-[#5D4A82]">Built for African researchers, by African innovators.</p>
        </div>
      </div>
    </footer>
  )
}
