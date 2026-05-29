'use client'

import Link from 'next/link'
import { ReactNode } from 'react'
import { Brain, Users, BookOpen, Wrench, Zap } from 'lucide-react'
import { AnimatePresence } from 'framer-motion'
import { NumberTicker } from '@/components/ui/micro-interactions'
import {
  getCurrentTier,
  getNextTier,
  getPointsToNextTier,
  getTopActions,
} from '@/lib/utils/akili-progress'

interface AkiliProgressCardProps {
  score: number
  dimensions: {
    knowledge: number
    collaboration: number
    mentorship: number
    technical: number
  }
}

export function AkiliProgressCard({ score, dimensions }: AkiliProgressCardProps) {
  const currentTier = getCurrentTier(score)
  const nextTier    = getNextTier(score)
  const pointsLeft  = getPointsToNextTier(score)
  const progressPct = nextTier
    ? ((score - currentTier.min) / (nextTier.min - currentTier.min)) * 100
    : 100
  const topActions  = getTopActions(dimensions)

  const dimConfig: { key: 'knowledge' | 'collaboration' | 'mentorship' | 'technical'; label: string; icon: ReactNode; score: number; barColor: string; max: number }[] = [
    { key: 'knowledge',     label: 'Knowledge',     icon: <Brain    size={18} className="text-purple-400" />, score: dimensions.knowledge,     barColor: '#A855F7', max: 500 },
    { key: 'collaboration', label: 'Collaboration', icon: <Users    size={18} className="text-cyan-400"   />, score: dimensions.collaboration, barColor: '#06B6D4', max: 500 },
    { key: 'mentorship',    label: 'Mentorship',    icon: <BookOpen size={18} className="text-emerald-400"/>, score: dimensions.mentorship,    barColor: '#10B981', max: 500 },
    { key: 'technical',     label: 'Technical',     icon: <Wrench   size={18} className="text-amber-400"  />, score: dimensions.technical,     barColor: '#F59E0B', max: 500 },
  ]

  return (
    <div className="rounded-2xl border border-purple-500/18 p-6 space-y-6"
      style={{ background: 'rgba(255,255,255,0.03)' }}>

      {/* Score + tier */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg,rgba(124,58,237,0.5),rgba(168,85,247,0.3))',
              border: '1px solid rgba(139,92,246,0.4)',
              boxShadow: '0 0 16px rgba(124,58,237,0.35)',
            }}>
            <Zap size={22} className="text-purple-200" fill="currentColor" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: '#7C6A9C' }}>
              Akili Score
            </div>
            <div className="text-3xl font-black leading-none tracking-tight" style={{ color: '#C084FC' }}>
              <AnimatePresence mode="wait">
                <NumberTicker key={score} value={score} />
              </AnimatePresence>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-white leading-tight">{currentTier.name}</div>
          {nextTier && (
            <div className="text-xs mt-0.5" style={{ color: '#7C6A9C' }}>
              {pointsLeft} pts to {nextTier.name}
            </div>
          )}
        </div>
      </div>

      {/* Progress bar to next tier */}
      {nextTier && (
        <div>
          <div className="flex justify-between text-[10px] mb-1.5" style={{ color: '#7C6A9C' }}>
            <span>{currentTier.name}</span>
            <span>{nextTier.name}</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${progressPct}%`,
                background: 'linear-gradient(90deg,#7C3AED,#A855F7)',
              }}
            />
          </div>
          <div className="text-[10px] text-center mt-1.5" style={{ color: '#7C6A9C' }}>
            {Math.round(progressPct)}% of the way there
          </div>
        </div>
      )}

      {/* Dimension breakdown */}
      <div className="space-y-3">
        {dimConfig.map(dim => (
          <div key={dim.key} className="flex items-center gap-3">
            <span className="w-5 h-5 flex items-center justify-center flex-shrink-0">{dim.icon}</span>
            <div className="w-24 flex-shrink-0 text-xs font-medium" style={{ color: '#9B86B8' }}>
              {dim.label}
            </div>
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min((dim.score / dim.max) * 100, 100)}%`,
                  background: dim.barColor,
                }}
              />
            </div>
            <div className="text-xs font-bold w-14 text-right" style={{ color: '#7C6A9C' }}>
              {dim.score} pts
            </div>
          </div>
        ))}
      </div>

      {/* Next actions */}
      <div>
        <div className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: '#7C6A9C' }}>
          Earn points now
        </div>
        <div className="space-y-2">
          {topActions.map((action, i) => (
            <Link
              key={i}
              href={action.href}
              className="flex items-center justify-between p-3 rounded-xl transition-all group"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(139,92,246,0.12)' }}
              onMouseOver={e => {
                const el = e.currentTarget as HTMLAnchorElement
                el.style.borderColor = 'rgba(168,85,247,0.35)'
                el.style.background = 'rgba(124,58,237,0.08)'
              }}
              onMouseOut={e => {
                const el = e.currentTarget as HTMLAnchorElement
                el.style.borderColor = 'rgba(139,92,246,0.12)'
                el.style.background = 'rgba(255,255,255,0.02)'
              }}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: 'rgba(139,92,246,0.18)', color: '#A855F7' }}>
                  +
                </div>
                <div>
                  <div className="text-xs font-semibold" style={{ color: '#E2D9F3' }}>
                    {action.action}
                  </div>
                  <div className="text-[10px]" style={{ color: '#7C6A9C' }}>
                    {action.dimension}
                  </div>
                </div>
              </div>
              <div className="text-xs font-black flex-shrink-0" style={{ color: '#FBBF24' }}>
                +{action.points} pts
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
