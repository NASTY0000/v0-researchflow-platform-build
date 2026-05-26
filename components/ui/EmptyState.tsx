'use client'

import { ReactNode } from 'react'
import Link from 'next/link'

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

export function EmptyState({
  icon, title, description,
  ctaLabel, ctaHref, ctaOnClick,
  secondaryLabel, secondaryHref,
  stat,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-8 max-w-sm mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-5 text-2xl">
        {icon}
      </div>

      <h3 className="text-lg font-bold text-white mb-2 leading-tight">
        {title}
      </h3>

      <p className="text-sm text-purple-300/50 leading-relaxed mb-2">
        {description}
      </p>

      {stat ? (
        <div className="flex items-center gap-1.5 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-green-400/80 font-medium">{stat}</span>
        </div>
      ) : (
        <div className="mb-6" />
      )}

      {ctaLabel && ctaHref && (
        <Link
          href={ctaHref}
          className="w-full h-11 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold flex items-center justify-center transition-colors mb-3"
        >
          {ctaLabel}
        </Link>
      )}
      {ctaLabel && ctaOnClick && (
        <button
          onClick={ctaOnClick}
          className="w-full h-11 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold flex items-center justify-center transition-colors mb-3"
        >
          {ctaLabel}
        </button>
      )}

      {secondaryLabel && secondaryHref && (
        <Link
          href={secondaryHref}
          className="text-sm text-purple-400/60 hover:text-purple-400 transition-colors"
        >
          {secondaryLabel}
        </Link>
      )}
    </div>
  )
}
