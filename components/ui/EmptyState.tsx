'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description: string
  ctaLabel?: string
  ctaHref?: string
  ctaOnClick?: () => void
  secondaryLabel?: string
  secondaryHref?: string
  stat?: string
}

// Decorative baobab branch SVG
function BaobabDecoration() {
  return (
    <svg
      className="absolute bottom-0 left-1/2 -translate-x-1/2 opacity-[0.06] pointer-events-none select-none"
      width="260" height="80" viewBox="0 0 260 80" fill="none"
      aria-hidden="true"
    >
      <path d="M130 80 L130 40" stroke="#A855F7" strokeWidth="3" strokeLinecap="round" />
      <path d="M130 40 L90 10" stroke="#A855F7" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M130 40 L170 10" stroke="#A855F7" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M130 55 L60 30" stroke="#A855F7" strokeWidth="2" strokeLinecap="round" />
      <path d="M130 55 L200 30" stroke="#A855F7" strokeWidth="2" strokeLinecap="round" />
      <path d="M90 10 L70 0"   stroke="#A855F7" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M90 10 L105 2"  stroke="#A855F7" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M170 10 L155 2" stroke="#A855F7" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M170 10 L190 0" stroke="#A855F7" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M60 30 L45 22"  stroke="#A855F7" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M200 30 L215 22" stroke="#A855F7" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function EmptyState({
  icon, title, description,
  ctaLabel, ctaHref, ctaOnClick,
  secondaryLabel, secondaryHref,
  stat,
}: EmptyStateProps) {
  return (
    <motion.div
      className="relative flex flex-col items-center justify-center text-center py-16 px-8 max-w-sm mx-auto overflow-hidden"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <BaobabDecoration />

      {/* Icon with glow ring */}
      <motion.div
        className="relative mb-6"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Outer glow ring — dark only */}
        <div
          className="absolute inset-0 rounded-2xl hidden dark:block"
          style={{
            background: 'radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)',
            transform: 'scale(1.8)',
            filter: 'blur(12px)',
          }}
        />
        {/* Inner ring */}
        <div
          className="absolute -inset-2 rounded-2xl opacity-50 border border-border dark:border-[rgba(139,92,246,0.3)]"
          style={{ borderRadius: '20px' }}
        />
        <div
          className="relative w-16 h-16 rounded-2xl flex items-center justify-center text-2xl bg-accent border border-border dark:bg-[rgba(124,58,237,0.12)] dark:border-[rgba(139,92,246,0.3)] dark:shadow-[0_0_24px_rgba(124,58,237,0.2)]"
        >
          {icon}
        </div>
      </motion.div>

      <motion.h3
        className="text-lg font-bold text-foreground mb-2 leading-tight"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        {title}
      </motion.h3>

      <motion.p
        className="text-sm leading-relaxed mb-2 text-muted-foreground"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
      >
        {description}
      </motion.p>

      {stat ? (
        <motion.div
          className="flex items-center gap-1.5 mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-green-400/80 font-medium">{stat}</span>
        </motion.div>
      ) : (
        <div className="mb-6" />
      )}

      {ctaLabel && ctaHref && (
        <motion.div
          className="w-full"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
        >
          <Link
            href={ctaHref}
            className="w-full h-11 rounded-xl text-primary-foreground text-sm font-semibold flex items-center justify-center transition-all mb-3 bg-primary hover:bg-primary/90 dark:bg-[linear-gradient(135deg,#7C3AED,#A855F7)] dark:shadow-[0_0_20px_rgba(124,58,237,0.3)]"
          >
            {ctaLabel}
          </Link>
        </motion.div>
      )}
      {ctaLabel && ctaOnClick && (
        <motion.div
          className="w-full"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
        >
          <button
            onClick={ctaOnClick}
            className="w-full h-11 rounded-xl text-primary-foreground text-sm font-semibold flex items-center justify-center transition-all mb-3 bg-primary hover:bg-primary/90 dark:bg-[linear-gradient(135deg,#7C3AED,#A855F7)] dark:shadow-[0_0_20px_rgba(124,58,237,0.3)]"
          >
            {ctaLabel}
          </button>
        </motion.div>
      )}

      {secondaryLabel && secondaryHref && (
        <Link
          href={secondaryHref}
          className="text-sm transition-colors text-muted-foreground hover:text-primary"
        >
          {secondaryLabel}
        </Link>
      )}
    </motion.div>
  )
}
