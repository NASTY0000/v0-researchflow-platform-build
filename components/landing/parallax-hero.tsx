'use client'

import { useRef } from 'react'
import { useScroll, useTransform, motion } from 'framer-motion'
import { HeroBackground } from './HeroBackground'

export function ParallaxHeroWrapper({ children }: { children: React.ReactNode }) {
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })

  const heroY       = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])
  const heroScale   = useTransform(scrollYProgress, [0, 1], [1, 0.95])

  return (
    <section
      className="relative min-h-screen overflow-hidden"
      style={{ backgroundColor: '#07030F' }}
    >
      {/* Layer 0 — animated starfield + planet canvas */}
      <HeroBackground />

      {/* Layer 1 — parallax content */}
      <motion.div
        ref={heroRef}
        style={{ y: heroY, opacity: heroOpacity, scale: heroScale, position: 'relative', zIndex: 10 }}
        className="pt-32 pb-20 px-4"
      >
        {children}
      </motion.div>
    </section>
  )
}
