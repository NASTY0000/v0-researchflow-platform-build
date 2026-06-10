import { getAkiliNarrative } from '@/lib/utils/akili'
import { Zap } from 'lucide-react'

interface AkiliScoreBadgeProps {
  score: number
  showTitle?: boolean
  size?: 'sm' | 'md'
}

export function AkiliScoreBadge({ score, showTitle = true, size = 'sm' }: AkiliScoreBadgeProps) {
  const { title } = getAkiliNarrative(score)
  const isSm = size === 'sm'

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full"
      style={{
        padding: isSm ? '2px 7px' : '4px 10px',
        background: 'rgba(124,58,237,0.12)',
        border: '1px solid rgba(139,92,246,0.25)',
      }}
    >
      <Zap className={isSm ? 'w-2.5 h-2.5' : 'w-3 h-3'} style={{ color: 'var(--primary)' }} />
      <span
        className={`font-bold font-mono tabular-nums ${isSm ? 'text-[10px]' : 'text-xs'}`}
        style={{ color: 'var(--primary)' }}
      >
        {score.toLocaleString()}
      </span>
      {showTitle && (
        <span className={`${isSm ? 'text-[10px]' : 'text-xs'} text-muted-foreground`}>
          · {title}
        </span>
      )}
    </span>
  )
}
