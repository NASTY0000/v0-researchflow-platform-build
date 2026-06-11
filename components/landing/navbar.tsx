'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/Logo'

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Testimonials', href: '#testimonials' },
  { label: 'FAQ', href: '#faq' },
]

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const progressRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let rafId = 0
    const onScroll = () => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        setScrolled(window.scrollY > 24)
        const max = document.documentElement.scrollHeight - window.innerHeight
        const progress = max > 0 ? window.scrollY / max : 0
        if (progressRef.current) {
          progressRef.current.style.transform = `scaleX(${progress})`
        }
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'border-b border-violet-500/15 bg-[#05010F]/80 shadow-[0_8px_32px_rgba(5,1,15,0.6)] backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      {/* Reading progress */}
      <div
        ref={progressRef}
        className="absolute inset-x-0 top-0 h-[2px] origin-left scale-x-0 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-400"
      />

      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" aria-label="ResearchFlow home" className="transition-opacity hover:opacity-85">
            <Logo variant="horizontal" width={160} uid="nav" />
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group relative rounded-full px-4 py-2 text-sm text-[#B7A8D4] transition-colors hover:text-white"
              >
                {link.label}
                <span className="absolute inset-x-4 -bottom-px h-px origin-center scale-x-0 bg-gradient-to-r from-violet-500 to-cyan-400 transition-transform duration-300 group-hover:scale-x-100" />
              </Link>
            ))}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <Button variant="ghost" asChild className="rounded-full text-[#B7A8D4] hover:bg-white/5 hover:text-white">
              <Link href="/auth/login">Sign in</Link>
            </Button>
            <Button
              asChild
              className="rounded-full border-none bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-[0_0_20px_rgba(124,58,237,0.35)] transition-shadow hover:shadow-[0_0_32px_rgba(168,85,247,0.55)]"
            >
              <Link href="/auth/signup">Get Started</Link>
            </Button>
          </div>

          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full text-[#B7A8D4] transition-colors hover:bg-white/5 hover:text-white md:hidden"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div
        className={`overflow-hidden border-violet-500/15 bg-[#05010F]/95 backdrop-blur-xl transition-all duration-300 md:hidden ${
          menuOpen ? 'max-h-96 border-b' : 'max-h-0'
        }`}
      >
        <div className="space-y-1 px-4 py-4">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="block rounded-xl px-4 py-3 text-sm text-[#B7A8D4] transition-colors hover:bg-white/5 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
          <div className="flex gap-3 pt-3">
            <Button variant="outline" asChild className="flex-1 rounded-full border-violet-400/30 bg-transparent text-violet-200">
              <Link href="/auth/login">Sign in</Link>
            </Button>
            <Button asChild className="flex-1 rounded-full border-none bg-gradient-to-br from-violet-600 to-fuchsia-600">
              <Link href="/auth/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
