'use client'

import { Trophy } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface WinnerBadgeProps {
  status: 'winner' | 'runner_up'
  challengeTitle?: string
  size?: 'sm' | 'md'
}

export function WinnerBadge({ status, challengeTitle, size = 'md' }: WinnerBadgeProps) {
  const isWinner = status === 'winner'
  const badgeSize = size === 'sm' ? 'text-xs px-2 py-1' : 'text-sm px-3 py-1.5'
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'
  
  const badge = (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold whitespace-nowrap transition-all ${
        isWinner
          ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-400 border border-amber-500/30 hover:border-amber-500/50'
          : 'bg-gradient-to-r from-slate-500/20 to-gray-500/20 text-slate-300 border border-slate-500/30 hover:border-slate-500/50'
      } ${badgeSize}`}
    >
      <Trophy className={`${iconSize} flex-shrink-0`} />
      <span>{isWinner ? '🏆 Challenge Winner' : '🥈 Runner Up'}</span>
    </div>
  )

  if (!challengeTitle) {
    return badge
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent>
          <p className="text-sm font-medium">{challengeTitle}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
