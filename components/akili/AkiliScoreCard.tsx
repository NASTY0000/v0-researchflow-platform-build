'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  getAkiliNarrative,
  getDimensionBadge,
  DIMENSION_COLORS,
  DIMENSION_LABELS,
  type AkiliDimension,
} from '@/lib/utils/akili'
import { Zap, Brain, Users, BookOpen, Wrench, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface AkiliData {
  akili_score: number
  akili_dimension_knowledge: number
  akili_dimension_collaboration: number
  akili_dimension_mentorship: number
  akili_dimension_technical: number
}

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
  const [data, setData] = useState<AkiliData | null>(null)
  const [events, setEvents] = useState<ScoreEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const [profileRes, eventsRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('akili_score, akili_dimension_knowledge, akili_dimension_collaboration, akili_dimension_mentorship, akili_dimension_technical')
          .eq('id', userId)
          .single(),
        supabase
          .from('akili_score_events')
          .select('id, event_type, points_earned, description, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit),
      ])
      if (profileRes.data) setData(profileRes.data as AkiliData)
      if (eventsRes.data) setEvents(eventsRes.data)
      setIsLoading(false)
    }
    load()
  }, [userId])

  if (isLoading) {
    return (
      <div className="rounded-2xl p-6 animate-pulse" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.15)' }}>
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

  const score = data?.akili_score || 0
  const { title, narrative } = getAkiliNarrative(score)

  const dimensions: { key: AkiliDimension; score: number }[] = [
    { key: 'knowledge',     score: data?.akili_dimension_knowledge     || 0 },
    { key: 'collaboration', score: data?.akili_dimension_collaboration || 0 },
    { key: 'mentorship',    score: data?.akili_dimension_mentorship    || 0 },
    { key: 'technical',     score: data?.akili_dimension_technical     || 0 },
  ]

  return (
    <div className="rounded-2xl p-6 space-y-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.2)' }}>

      {/* Total score + title */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.3),rgba(168,85,247,0.15))', border: '1px solid rgba(139,92,246,0.4)' }}>
            <Zap className="w-6 h-6" style={{ color: '#A855F7' }} />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#7C6A9C' }}>Akili Score</p>
            <p className="text-3xl font-bold font-heading leading-none mt-0.5" style={{ color: '#C084FC' }}>
              {score.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-semibold text-sm leading-tight">{title}</p>
          <p className="text-xs mt-1 leading-relaxed max-w-[160px]" style={{ color: '#7C6A9C' }}>{narrative}</p>
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
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
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
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#7C6A9C' }}>
            Recent Activity
          </p>
          <div className="space-y-0">
            {events.map((event, i) => (
              <div key={event.id}
                className="flex items-start justify-between gap-3 py-2.5"
                style={{ borderBottom: i < events.length - 1 ? '1px solid rgba(139,92,246,0.1)' : 'none' }}>
                <div className="flex-1 min-w-0">
                  <p className="text-xs leading-snug" style={{ color: '#C4B5D8' }}>
                    {event.description || event.event_type}
                  </p>
                  <p className="text-[10px] mt-0.5 flex items-center gap-1" style={{ color: '#7C6A9C' }}>
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
        <p className="text-xs text-center py-1" style={{ color: '#7C6A9C' }}>
          Complete research activities to earn your first Akili Score points
        </p>
      )}
    </div>
  )
}
