'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bookmark, BookmarkCheck, EyeOff, Clock, Sparkles,
  Users, Target, Lightbulb, GraduationCap, Trophy, Star,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface FeedCardProps {
  item: Record<string, unknown>
  meta: {
    type: string
    score: number
    reason: string
    is_diversity: boolean
  }
  onSave: () => void
  onNotInterested: () => void
  onView: () => void
}

const TYPE_CONFIG = {
  idea: {
    icon: Lightbulb,
    label: 'Research Idea',
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.1)',
    border: 'rgba(245,158,11,0.2)',
  },
  project: {
    icon: Users,
    label: 'Open Project',
    color: '#3B82F6',
    bg: 'rgba(59,130,246,0.1)',
    border: 'rgba(59,130,246,0.2)',
  },
  grant: {
    icon: Target,
    label: 'Grant Opportunity',
    color: '#22C55E',
    bg: 'rgba(34,197,94,0.1)',
    border: 'rgba(34,197,94,0.2)',
  },
  mentor: {
    icon: GraduationCap,
    label: 'Mentor Available',
    color: '#A855F7',
    bg: 'rgba(168,85,247,0.1)',
    border: 'rgba(168,85,247,0.2)',
  },
  challenge: {
    icon: Trophy,
    label: 'Challenge',
    color: '#F97316',
    bg: 'rgba(249,115,22,0.1)',
    border: 'rgba(249,115,22,0.2)',
  },
  open_call: {
    icon: Star,
    label: 'Open Call',
    color: '#EC4899',
    bg: 'rgba(236,72,153,0.1)',
    border: 'rgba(236,72,153,0.2)',
  },
}

export function FeedCard({ item, meta, onSave, onNotInterested, onView }: FeedCardProps) {
  const [saved, setSaved]       = useState(false)
  const [dismissed, setDismissed] = useState(false)

  const cfg = TYPE_CONFIG[meta.type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.idea
  const Icon = cfg.icon

  const deadline = item.deadline as string | undefined
  const isUrgent = deadline
    ? new Date(deadline).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000
    : false

  function handleSave(e: React.MouseEvent) {
    e.stopPropagation()
    setSaved(s => !s)
    onSave()
  }

  function handleNotInterested(e: React.MouseEvent) {
    e.stopPropagation()
    setDismissed(true)
    setTimeout(onNotInterested, 250)
  }

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          layout
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, x: -80, transition: { duration: 0.2 } }}
          whileHover={{ y: -2 }}
          transition={{ duration: 0.25 }}
          onClick={onView}
          className="relative rounded-xl overflow-hidden cursor-pointer"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: `1px solid ${cfg.border}`,
          }}
        >
          {/* Urgency stripe */}
          {isUrgent && (
            <div
              className="h-0.5 w-full"
              style={{ background: 'linear-gradient(90deg,#F97316,#EF4444)' }}
            />
          )}

          <div className="p-4">
            {/* Type badge + diversity */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div
                  className="p-1.5 rounded-lg"
                  style={{ background: cfg.bg }}
                >
                  <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                </div>
                <span
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: cfg.color }}
                >
                  {cfg.label}
                </span>
              </div>
              {meta.is_diversity && (
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ background: 'rgba(124,58,237,0.15)', color: '#C084FC' }}
                >
                  <Sparkles className="w-3 h-3" />
                  Discover
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className="font-semibold text-sm leading-snug line-clamp-2 mb-2">
              {item.title as string}
            </h3>

            {/* Description */}
            {item.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
                {item.description as string}
              </p>
            )}

            {/* Research area tags */}
            {Array.isArray(item.research_areas) && (item.research_areas as string[]).length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {(item.research_areas as string[]).slice(0, 3).map((area: string) => (
                  <span
                    key={area}
                    className="px-2 py-0.5 rounded-full text-xs"
                    style={{ background: 'rgba(255,255,255,0.05)', color: '#9D8BB8' }}
                  >
                    {area}
                  </span>
                ))}
              </div>
            )}

            {/* For ideas: research_area (string from DB, not normalized) */}
            {!Array.isArray(item.research_areas) && item.research_area && (
              <div className="flex gap-1 mb-3">
                <span
                  className="px-2 py-0.5 rounded-full text-xs"
                  style={{ background: 'rgba(255,255,255,0.05)', color: '#9D8BB8' }}
                >
                  {item.research_area as string}
                </span>
              </div>
            )}

            {/* Footer */}
            <div
              className="flex items-center justify-between pt-3"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-xs font-medium truncate" style={{ color: '#A78BFA' }}>
                  {meta.reason}
                </span>
                {deadline && (
                  <span
                    className="text-xs flex items-center gap-1"
                    style={{ color: isUrgent ? '#F97316' : 'var(--muted-foreground)' }}
                  >
                    <Clock className="w-3 h-3 shrink-0" />
                    {isUrgent
                      ? 'Closes soon'
                      : formatDistanceToNow(new Date(deadline), { addSuffix: true })}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={handleNotInterested}
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ color: 'rgba(255,255,255,0.2)' }}
                  title="Not interested"
                  onMouseOver={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
                  onMouseOut={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.2)')}
                >
                  <EyeOff className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleSave}
                  className="p-1.5 rounded-lg transition-colors"
                  style={{
                    color: saved ? '#A855F7' : 'rgba(255,255,255,0.2)',
                    background: saved ? 'rgba(168,85,247,0.1)' : 'transparent',
                  }}
                  title={saved ? 'Saved' : 'Save'}
                >
                  {saved
                    ? <BookmarkCheck className="w-3.5 h-3.5" />
                    : <Bookmark className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
