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

      {/* Layer 1 — decorative Baobab SVG watermark */}
      <svg
        className="absolute pointer-events-none hidden lg:block"
        style={{
          right: '-40px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '480px',
          opacity: 0.09,
          zIndex: 1,
          filter: 'blur(0.8px)',
          animation: 'bgFloat 16s ease-in-out infinite',
        }}
        viewBox="0 0 520 580"
      >
        <defs>
          <linearGradient id="bgT" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7C3AED"/>
            <stop offset="100%" stopColor="#2E1065"/>
          </linearGradient>
        </defs>
        <path d="M 242,420 C 237,450 230,490 226,540 L 294,540 C 290,490 283,450 278,420 Z" fill="url(#bgT)"/>
        <path d="M 260,420 Q 160,300 25,105"   stroke="#A855F7" strokeWidth="7"   fill="none" strokeLinecap="round"/>
        <path d="M 260,420 Q 195,285 85,90"    stroke="#A855F7" strokeWidth="7"   fill="none" strokeLinecap="round"/>
        <path d="M 260,420 Q 230,270 185,65"   stroke="#A855F7" strokeWidth="7"   fill="none" strokeLinecap="round"/>
        <path d="M 260,420 Q 260,270 260,48"   stroke="#A855F7" strokeWidth="7.5" fill="none" strokeLinecap="round"/>
        <path d="M 260,420 Q 290,270 335,65"   stroke="#A855F7" strokeWidth="7"   fill="none" strokeLinecap="round"/>
        <path d="M 260,420 Q 325,285 435,90"   stroke="#A855F7" strokeWidth="7"   fill="none" strokeLinecap="round"/>
        <path d="M 260,420 Q 360,300 495,105"  stroke="#A855F7" strokeWidth="7"   fill="none" strokeLinecap="round"/>
        <g fill="none" stroke="#C4B5FD" strokeWidth="2" strokeLinecap="round" opacity="0.7">
          <path d="M 25,105 Q 55,92 85,90"/>
          <path d="M 85,90 Q 135,76 185,65"/>
          <path d="M 185,65 Q 222,56 260,48"/>
          <path d="M 260,48 Q 297,56 335,65"/>
          <path d="M 335,65 Q 385,76 435,90"/>
          <path d="M 435,90 Q 465,92 495,105"/>
        </g>
        <circle cx="25"  cy="105" r="11" fill="#8B5CF6"/>
        <circle cx="85"  cy="90"  r="10" fill="#A855F7"/>
        <circle cx="185" cy="65"  r="11" fill="#8B5CF6"/>
        <circle cx="260" cy="48"  r="18" fill="rgba(251,191,36,0.18)"/>
        <circle cx="260" cy="48"  r="12" fill="#FBBF24"/>
        <circle cx="335" cy="65"  r="11" fill="#8B5CF6"/>
        <circle cx="435" cy="90"  r="10" fill="#A855F7"/>
        <circle cx="495" cy="105" r="11" fill="#8B5CF6"/>
      </svg>

      {/* Layer 2 — parallax content */}
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
