'use client'

import { motion } from 'framer-motion'
import { Newspaper, BookOpen, Megaphone, Compass, ExternalLink, Clock, Quote, Globe2 } from 'lucide-react'
import { ArticleThumbnail } from '@/components/feed/article-thumbnail'
import { formatDistanceToNow } from 'date-fns'

interface ExternalItem {
  id: string
  category: string
  content_type?: string
  thumbnail_url?: string | null
  title: string
  summary?: string
  url: string
  authors?: string[]
  source_journal?: string
  citation_count?: number
  research_areas?: string[]
  is_african_relevant?: boolean
  deadline?: string
  published_at?: string
  [key: string]: unknown
}

interface ExternalCardProps {
  item: ExternalItem
  index?: number
}

const CATEGORY_CONFIG = {
  news: {
    icon: Newspaper,
    label: 'Science News',
    color: '#38BDF8',
    bg: 'rgba(56,189,248,0.1)',
    border: 'rgba(56,189,248,0.2)',
  },
  publications: {
    icon: BookOpen,
    label: 'Publication',
    color: '#34D399',
    bg: 'rgba(52,211,153,0.1)',
    border: 'rgba(52,211,153,0.2)',
  },
  opportunities: {
    icon: Megaphone,
    label: 'Opportunity',
    color: '#FBBF24',
    bg: 'rgba(251,191,36,0.1)',
    border: 'rgba(251,191,36,0.2)',
  },
  discovery: {
    icon: Compass,
    label: 'Discovery',
    color: '#C084FC',
    bg: 'rgba(192,132,252,0.1)',
    border: 'rgba(192,132,252,0.2)',
  },
}

export function ExternalCard({ item, index = 0 }: ExternalCardProps) {
  const cfg = CATEGORY_CONFIG[item.category as keyof typeof CATEGORY_CONFIG] ?? CATEGORY_CONFIG.news
  const Icon = cfg.icon

  const deadline = item.deadline
  const isUrgent = deadline
    ? new Date(deadline).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000
    : false

  function handleClick() {
    window.open(item.url, '_blank', 'noopener,noreferrer')
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.25) }}
      whileHover={{ y: -2 }}
      onClick={handleClick}
      className="relative rounded-xl overflow-hidden cursor-pointer"
      style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${cfg.border}` }}
    >
      {item.content_type !== 'video' && (
        <ArticleThumbnail
          url={item.url || ''}
          title={item.title}
          thumbnailUrl={item.thumbnail_url}
          category={item.category as string | undefined}
        />
      )}

      {item.content_type === 'video' && item.thumbnail_url && (
        <div className="relative w-full aspect-video overflow-hidden">
          <img
            src={item.thumbnail_url}
            alt={item.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
              <div
                className="w-0 h-0 ml-1"
                style={{
                  borderTop: '10px solid transparent',
                  borderBottom: '10px solid transparent',
                  borderLeft: '16px solid white',
                }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg" style={{ background: cfg.bg }}>
              <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: cfg.color }}>
              {cfg.label}
            </span>
          </div>
          {item.is_african_relevant && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
              style={{ background: 'rgba(34,197,94,0.15)', color: '#4ADE80' }}
            >
              <Globe2 className="w-3 h-3" />
              Africa
            </span>
          )}
        </div>

        <h3 className="font-semibold text-sm leading-snug line-clamp-2 mb-2 flex items-start gap-1.5">
          <span className="line-clamp-2">{item.title}</span>
          <ExternalLink className="w-3 h-3 mt-1 shrink-0 text-muted-foreground" />
        </h3>

        {item.summary && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
            {item.summary}
          </p>
        )}

        {(item.authors?.length || item.source_journal) && (
          <p className="text-xs text-muted-foreground mb-2 truncate">
            {item.authors?.slice(0, 3).join(', ')}
            {item.authors?.length ? (item.source_journal ? ' · ' : '') : ''}
            {item.source_journal}
          </p>
        )}

        {Array.isArray(item.research_areas) && item.research_areas.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {item.research_areas.slice(0, 3).map(area => (
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

        <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3 min-w-0">
            {typeof item.citation_count === 'number' && item.citation_count > 0 && (
              <span className="text-xs flex items-center gap-1 text-muted-foreground">
                <Quote className="w-3 h-3" />
                {item.citation_count}
              </span>
            )}
            {item.published_at && (
              <span className="text-xs text-muted-foreground truncate">
                {formatDistanceToNow(new Date(item.published_at), { addSuffix: true })}
              </span>
            )}
          </div>

          {deadline && (
            <span
              className="text-xs flex items-center gap-1 shrink-0"
              style={{ color: isUrgent ? '#F97316' : 'var(--muted-foreground)' }}
            >
              <Clock className="w-3 h-3" />
              {isUrgent ? 'Closes soon' : formatDistanceToNow(new Date(deadline), { addSuffix: true })}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}
