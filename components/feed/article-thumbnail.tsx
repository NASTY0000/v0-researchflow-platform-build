'use client'

import { useState, useEffect } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Newspaper, BookOpen, Trophy, Telescope, Sparkles } from 'lucide-react'

interface ArticleThumbnailProps {
  url: string
  title: string
  thumbnailUrl?: string | null
  category?: string
}

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  news: Newspaper,
  publications: BookOpen,
  opportunities: Trophy,
  discovery: Telescope,
}

const CATEGORY_COLORS: Record<string, string> = {
  news: 'from-blue-500/20 to-blue-600/10',
  publications: 'from-green-500/20 to-green-600/10',
  opportunities: 'from-yellow-500/20 to-yellow-600/10',
  discovery: 'from-purple-500/20 to-purple-600/10',
}

export function ArticleThumbnail({ url, title, thumbnailUrl, category = 'news' }: ArticleThumbnailProps) {
  const [imgSrc, setImgSrc] = useState<string | null>(thumbnailUrl || null)
  const [loading, setLoading] = useState(!thumbnailUrl)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (thumbnailUrl || failed) return
    if (!url) return

    let cancelled = false

    async function fetchOGImage() {
      try {
        const res = await fetch(
          `https://api.microlink.io?url=${encodeURIComponent(url)}&meta=false&screenshot=false`,
          { signal: AbortSignal.timeout(4000) }
        )
        if (!res.ok) {
          if (!cancelled) setFailed(true)
          return
        }
        const data = await res.json()
        const image = data?.data?.image?.url || null

        if (!cancelled) {
          setImgSrc(image)
          setLoading(false)
          if (!image) setFailed(true)
        }
      } catch {
        if (!cancelled) {
          setFailed(true)
          setLoading(false)
        }
      }
    }

    fetchOGImage()
    return () => {
      cancelled = true
    }
  }, [url, thumbnailUrl, failed])

  const Icon = CATEGORY_ICONS[category] || Sparkles
  const gradient = CATEGORY_COLORS[category] || 'from-primary/20 to-primary/10'

  if (imgSrc && !failed) {
    return (
      <div className="w-full h-44 overflow-hidden">
        <img
          src={imgSrc}
          alt={title}
          className="w-full h-full object-cover"
          onError={() => {
            setImgSrc(null)
            setFailed(true)
          }}
        />
      </div>
    )
  }

  if (loading) {
    return <div className="w-full h-44 overflow-hidden bg-muted animate-pulse" />
  }

  return (
    <div className={`w-full h-32 overflow-hidden bg-gradient-to-br ${gradient} flex items-center justify-center`}>
      <Icon className="w-10 h-10 text-muted-foreground/30" />
    </div>
  )
}
