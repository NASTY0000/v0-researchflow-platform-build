'use client'

import { Trophy, Clock, Users, Zap, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'

interface ChallengeCardProps {
  id: string
  title: string
  description?: string
  researchArea?: string
  prizeDescription?: string
  prizeType?: string
  status: string
  submissionDeadline?: string
  submissionCount: number
  teamCount?: number
  maxTeamSize?: number
  userTeamId?: string
  userHasSubmitted?: boolean
}

const prizeIcons: Record<string, string> = {
  'publication': '📄',
  'mentorship': '🎓',
  'cash': '💰',
  'certificate': '🏆',
  'mixed': '⭐',
}

const statusConfig: Record<string, { color: string; label: string; pulse: boolean }> = {
  'upcoming': { color: 'bg-slate-500/10 text-slate-400 border-slate-500/20', label: 'Upcoming', pulse: false },
  'open': { color: 'bg-green-500/10 text-green-400 border-green-500/20', label: 'Open Now', pulse: true },
  'judging': { color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', label: 'Judging', pulse: false },
  'completed': { color: 'bg-purple-500/10 text-purple-400 border-purple-500/20', label: 'Completed', pulse: false },
}

export function ChallengeCard({
  id,
  title,
  description,
  researchArea,
  prizeDescription,
  prizeType,
  status,
  submissionDeadline,
  submissionCount,
  teamCount = 0,
  maxTeamSize = 4,
  userTeamId,
  userHasSubmitted,
}: ChallengeCardProps) {
  const config = statusConfig[status] || statusConfig['upcoming']
  const daysUntilDeadline = submissionDeadline
    ? Math.ceil(
        (new Date(submissionDeadline).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null
  const isDeadlineUrgent = daysUntilDeadline !== null && daysUntilDeadline <= 3 && daysUntilDeadline > 0

  return (
    <div className="group bg-card border border-border rounded-xl p-6 hover:border-purple-500/50 transition-all duration-300 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold leading-tight">{title}</h3>
          </div>
          {researchArea && (
            <p className="text-xs text-muted-foreground">{researchArea}</p>
          )}
        </div>
        <div className={`px-3 py-1 rounded-lg border text-sm font-medium ${config.color} ${config.pulse ? 'animate-pulse' : ''}`}>
          {config.label}
        </div>
      </div>

      {/* Description */}
      {description && (
        <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
      )}

      {/* Prize */}
      {prizeDescription && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 border border-border">
          <span className="text-lg flex-shrink-0">{prizeIcons[prizeType || 'mixed'] || '⭐'}</span>
          <p className="text-xs text-muted-foreground line-clamp-2">{prizeDescription}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-400" />
          <div className="text-xs">
            <p className="text-muted-foreground">Submissions</p>
            <p className="font-semibold text-foreground">{submissionCount}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-400" />
          <div className="text-xs">
            <p className="text-muted-foreground">Teams</p>
            <p className="font-semibold text-foreground">{teamCount}</p>
          </div>
        </div>
        {submissionDeadline && (
          <div className="flex items-center gap-2">
            <Clock className={`w-4 h-4 ${isDeadlineUrgent ? 'text-red-400' : 'text-yellow-400'}`} />
            <div className="text-xs">
              <p className="text-muted-foreground">Closes</p>
              <p className={`font-semibold ${isDeadlineUrgent ? 'text-red-400' : 'text-foreground'}`}>
                {daysUntilDeadline && daysUntilDeadline > 0 ? `${daysUntilDeadline}d` : 'Expired'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Link href={`/challenges/${id}`} className="flex-1">
          <Button variant="outline" size="sm" className="w-full">
            View Challenge
          </Button>
        </Link>
        {status === 'open' && !userHasSubmitted && (
          <Button
            size="sm"
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
          >
            {userTeamId ? 'Submit Now' : 'Join'}
          </Button>
        )}
      </div>
    </div>
  )
}
