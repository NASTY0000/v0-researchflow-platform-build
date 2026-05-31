'use client'

import { useRef } from 'react'
import { useScroll, useTransform, motion } from 'framer-motion'

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
      className="relative overflow-hidden flex flex-col items-center justify-center text-center"
      style={{
        backgroundImage: "url('/hero-bg.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat',
        minHeight: '100svh',
        height: '100svh',
        backgroundColor: '#07030F',
      }}
    >
      {/* Dark overlay for text readability */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'rgba(4, 1, 12, 0.35)', zIndex: 1 }}
      />

      {/* Parallax content */}
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
