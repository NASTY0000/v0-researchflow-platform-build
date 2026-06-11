'use client'

import { useLayoutEffect, useRef } from 'react'
import { gsap } from '@/lib/gsap'

/**
 * Scroll-triggered reveal wrapper. Children marked with [data-reveal] are
 * staggered in as the wrapper enters the viewport; if none are marked the
 * wrapper itself animates. Uses an IntersectionObserver (rather than
 * ScrollTrigger) so trigger positions stay correct however late the layout
 * settles. No-ops under prefers-reduced-motion so content stays visible
 * without JS-driven motion.
 */
export function Reveal({
  children,
  className = '',
  y = 44,
  stagger = 0.09,
  as: Tag = 'div',
}: {
  children: React.ReactNode
  className?: string
  y?: number
  stagger?: number
  as?: 'div' | 'section' | 'span'
}) {
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const nested = el.querySelectorAll('[data-reveal]')
    const targets: Element[] | Element = nested.length ? Array.from(nested) : el
    gsap.set(targets, { autoAlpha: 0, y })

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        observer.disconnect()
        gsap.to(targets, {
          autoAlpha: 1,
          y: 0,
          duration: 0.9,
          ease: 'power3.out',
          stagger,
          overwrite: 'auto',
          clearProps: 'transform,visibility,opacity',
        })
      },
      { rootMargin: '0px 0px -12% 0px' },
    )
    observer.observe(el)

    return () => {
      observer.disconnect()
      gsap.set(targets, { clearProps: 'all' })
    }
  }, [y, stagger])

  return (
    <Tag ref={ref as React.Ref<never>} className={className}>
      {children}
    </Tag>
  )
}
