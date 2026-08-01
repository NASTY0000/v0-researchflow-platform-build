'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

type GlowVariant = 'purple' | 'teal' | 'gold' | 'none'

const glowMap: Record<GlowVariant, { border: string; shadow: string; hover: string }> = {
  purple: {
    border: 'rgba(139,92,246,0.25)',
    shadow: 'var(--brand-glow)',
    hover:  'var(--brand-glow)',
  },
  teal: {
    border: 'rgba(6,182,212,0.25)',
    shadow: '0 0 32px rgba(6,182,212,0.1)',
    hover:  '0 0 48px rgba(6,182,212,0.3)',
  },
  gold: {
    border: 'rgba(245,158,11,0.25)',
    shadow: '0 0 32px rgba(245,158,11,0.1)',
    hover:  '0 0 48px rgba(245,158,11,0.3)',
  },
  none: {
    border: 'rgba(255,255,255,0.08)',
    shadow: 'none',
    hover:  '0 0 24px rgba(255,255,255,0.05)',
  },
}

interface GlassCardProps {
  children: ReactNode
  className?: string
  glow?: GlowVariant
  /** Disable the hover lift animation */
  static?: boolean
}

export function GlassCard({ children, className, glow = 'purple', static: isStatic = false }: GlassCardProps) {
  const g = glowMap[glow]

  return (
    <motion.div
      className={cn('rounded-2xl', className)}
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${g.border}`,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        boxShadow: g.shadow,
      }}
      whileHover={isStatic ? undefined : {
        y: -3,
        boxShadow: g.hover,
        borderColor: glow === 'none' ? 'rgba(255,255,255,0.12)' : undefined,
        transition: { duration: 0.2, ease: 'easeOut' },
      }}
      whileTap={isStatic ? undefined : { scale: 0.98, transition: { duration: 0.1 } }}
    >
      {children}
    </motion.div>
  )
}
