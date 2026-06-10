'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAkiliState } from '@/lib/hooks/use-akili-state'
import {
  getDimensionBadge,
  DIMENSION_COLORS,
  DIMENSION_LABELS,
  type AkiliDimension,
} from '@/lib/utils/akili'
import { Zap, Brain, Users, BookOpen, Wrench, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface ScoreEvent {
  id: string
  event_type: string
  points_earned: number
  description: string | null
  created_at: string
}

const DIMENSION_ICONS: Record<AkiliDimension, React.ElementType> = {
  knowledge:     Brain,
  collaboration: Users,
  mentorship:    BookOpen,
  technical:     Wrench,
}

const MAX_DIMENSION = 5000

export function AkiliScoreCard({ userId, limit = 5 }: { userId: string; limit?: number }) {
  const { state: akiliState, loading: isLoading } = useAkiliState(userId)
  const [events, setEvents] = useState<ScoreEvent[]>([])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('akili_score_events')
        .select('id, event_type, points_earned, description, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)
      if (data) setEvents(data)
    }
    load()
  }, [userId, limit])

  if (isLoading) {
    return (
      <div className="rounded-2xl p-6 animate-pulse bg-banner" style={{ border: '1px solid rgba(139,92,246,0.15)' }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-muted" />
          <div className="space-y-2">
            <div className="h-3 w-20 bg-muted rounded" />
            <div className="h-7 w-24 bg-muted rounded" />
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-4 bg-muted rounded" />)}
        </div>
      </div>
    )
  }

  const score = akiliState?.total || 0
  const title = akiliState?.tier.name || ''
  const narrative = akiliState?.tier.description || ''

  const dimensions: { key: AkiliDimension; score: number }[] = [
    { key: 'knowledge',     score: akiliState?.dimensions.knowledge     || 0 },
    { key: 'collaboration', score: akiliState?.dimensions.collaboration || 0 },
    { key: 'mentorship',    score: akiliState?.dimensions.mentorship    || 0 },
    { key: 'technical',     score: akiliState?.dimensions.technical     || 0 },
  ]

  return (
    <div className="rounded-2xl p-6 space-y-5 bg-banner" style={{ border: '1px solid rgba(139,92,246,0.2)' }}>

      {/* Total score + title */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.3),rgba(168,85,247,0.15))', border: '1px solid rgba(139,92,246,0.4)' }}>
            <Zap className="w-6 h-6" style={{ color: 'var(--primary)' }} />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-banner-muted-foreground">Akili Score</p>
            <p className="text-3xl font-bold font-heading leading-none mt-0.5" style={{ color: 'var(--primary)' }}>
              {score.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-semibold text-sm leading-tight text-banner-foreground">{title}</p>
          <p className="text-xs mt-1 leading-relaxed max-w-[160px] text-banner-muted-foreground">{narrative}</p>
        </div>
      </div>

      {/* Dimension progress bars */}
      <div className="space-y-3.5">
        {dimensions.map(({ key, score: dimScore }) => {
          const color = DIMENSION_COLORS[key]
          const Icon = DIMENSION_ICONS[key]
          const badge = getDimensionBadge(key, dimScore)
          const pct = Math.min((dimScore / MAX_DIMENSION) * 100, 100)

          return (
            <div key={key}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5" style={{ color: color.text }} />
                  <span className="text-xs font-medium">{DIMENSION_LABELS[key]}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono tabular-nums" style={{ color: color.text }}>
                    {dimScore.toLocaleString()} pts
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                    style={{ background: color.bg, border: `1px solid ${color.border}`, color: color.text }}>
                    {badge}
                  </span>
                </div>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden bg-muted">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, background: `linear-gradient(90deg,${color.bar}70,${color.bar})` }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent events */}
      {events.length > 0 ? (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-3 text-banner-muted-foreground">
            Recent Activity
          </p>
          <div className="space-y-0">
            {events.map((event, i) => (
              <div key={event.id}
                className="flex items-start justify-between gap-3 py-2.5"
                style={{ borderBottom: i < events.length - 1 ? '1px solid rgba(139,92,246,0.1)' : 'none' }}>
                <div className="flex-1 min-w-0">
                  <p className="text-xs leading-snug text-banner-foreground">
                    {event.description || event.event_type}
                  </p>
                  <p className="text-[10px] mt-0.5 flex items-center gap-1 text-banner-muted-foreground">
                    <Clock className="w-2.5 h-2.5" />
                    {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-bold font-mono" style={{ color: '#4ADE80' }}>
                  +{event.points_earned}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-xs text-center py-1 text-banner-muted-foreground">
          Complete research activities to earn your first Akili Score points
        </p>
      )}
    </div>
  )
}
