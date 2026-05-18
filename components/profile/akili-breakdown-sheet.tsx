'use client'

import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getAkiliTitle, AKILI_TIERS } from '@/lib/constants/akili'
import { formatDistanceToNow } from 'date-fns'

interface AkiliBreakdownSheetProps {
  userId: string
  score: number
  dimensionKnowledge: number
  dimensionCollaboration: number
  dimensionMentorship: number
  dimensionTechnical: number
}

interface ScoreEvent {
  id: string
  description: string | null
  points_earned: number
  created_at: string
}

export function AkiliBreakdownSheet({
  userId, score,
  dimensionKnowledge, dimensionCollaboration,
  dimensionMentorship, dimensionTechnical,
}: AkiliBreakdownSheetProps) {
  const [open, setOpen] = useState(false)
  const [percentile, setPercentile] = useState<number | null>(null)
  const [recentEvents, setRecentEvents] = useState<ScoreEvent[]>([])
  const [thisWeekPoints, setThisWeekPoints] = useState(0)

  const currentTierIndex = AKILI_TIERS.findIndex(t => score >= t.min && score <= t.max)
  const currentTier = AKILI_TIERS[currentTierIndex] ?? AKILI_TIERS[0]
  const nextTier = AKILI_TIERS[currentTierIndex + 1]
  const pointsToNextTier = nextTier ? nextTier.min - score : 0
  const tierProgress = nextTier
    ? Math.round(((score - currentTier.min) / (nextTier.min - currentTier.min)) * 100)
    : 100

  useEffect(() => {
    if (!open) return
    async function load() {
      const supabase = createClient()
      const [totalRes, belowRes, eventsRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).lt('akili_score', score),
        supabase.from('akili_score_events').select('id, description, points_earned, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(5),
      ])
      const pct = Math.round(((belowRes.count ?? 0) / Math.max(totalRes.count ?? 1, 1)) * 100)
      setPercentile(pct)
      if (eventsRes.data) {
        setRecentEvents(eventsRes.data)
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        const weekPoints = eventsRes.data
          .filter(e => e.created_at > weekAgo)
          .reduce((sum, e) => sum + (e.points_earned || 0), 0)
        setThisWeekPoints(weekPoints)
      }
    }
    load()
  }, [open, userId, score])

  const dimensions = [
    { label: 'Knowledge', value: dimensionKnowledge, color: '#7C3AED' },
    { label: 'Collaboration', value: dimensionCollaboration, color: '#22D3EE' },
    { label: 'Mentorship', value: dimensionMentorship, color: '#D97706' },
    { label: 'Technical', value: dimensionTechnical, color: '#059669' },
  ]

  return (
    <>
      <button onClick={() => setOpen(true)} className="text-left hover:opacity-80 transition-opacity group">
        <div className="flex items-center gap-2">
          <span className="text-3xl font-black text-primary">{score.toLocaleString()}</span>
          <div>
            <p className="text-xs font-bold text-primary">AKILI SCORE</p>
            <p className="text-xs text-muted-foreground">{getAkiliTitle(score)}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
        {thisWeekPoints > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            {percentile !== null ? `Top ${100 - percentile}% · ` : ''}{thisWeekPoints > 0 ? `+${thisWeekPoints} this week` : ''}
          </p>
        )}
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Akili Score Breakdown</SheetTitle>
          </SheetHeader>
          <div className="space-y-6 mt-6">
            {/* Total */}
            <div className="text-center p-6 rounded-xl bg-primary/10 border border-primary/20">
              <p className="text-5xl font-black text-primary">{score.toLocaleString()}</p>
              <p className="text-lg font-semibold mt-2">{getAkiliTitle(score)}</p>
              {percentile !== null && (
                <p className="text-sm text-muted-foreground mt-1">Top {100 - percentile}% of researchers</p>
              )}
            </div>

            {/* Next tier progress */}
            {nextTier && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Progress to next tier</span>
                  <span className="text-muted-foreground">{pointsToNextTier} points to go</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all" style={{ width: `${tierProgress}%` }} />
                </div>
                <p className="text-xs text-muted-foreground">Next: {nextTier.title}</p>
              </div>
            )}

            {/* Dimensions */}
            <div className="space-y-3">
              <p className="text-sm font-semibold">Score Dimensions</p>
              {dimensions.map(dim => (
                <div key={dim.label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>{dim.label}</span>
                    <span className="font-semibold">{dim.value || 0}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, ((dim.value || 0) / Math.max(score, 1)) * 100)}%`, background: dim.color }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Recent events */}
            {recentEvents.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-semibold">Recent Activity</p>
                {recentEvents.map(event => (
                  <div key={event.id} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground text-xs">{event.description || event.id}</span>
                    <span className="font-semibold text-primary text-xs">+{event.points_earned}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
