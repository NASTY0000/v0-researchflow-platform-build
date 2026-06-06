'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { FeedCard } from '@/components/feed/feed-card'
import { Loader2, RefreshCw, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface FeedMeta {
  type: string
  score: number
  reason: string
  is_diversity: boolean
}

interface FeedItem {
  id: string
  title: string
  description?: string
  research_areas?: string[]
  research_area?: string
  deadline?: string
  _feed_meta: FeedMeta
  [key: string]: unknown
}

const TYPE_ROUTES: Record<string, string> = {
  idea:       '/ideas',
  project:    '/projects',
  grant:      '/grants',
  challenge:  '/challenges',
  mentor:     '/mentors',
}

export default function FeedPage() {
  const [items, setItems]         = useState<FeedItem[]>([])
  const [page, setPage]           = useState(1)
  const [hasMore, setHasMore]     = useState(true)
  const [loading, setLoading]     = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const router = useRouter()

  const observerRef  = useRef<IntersectionObserver | null>(null)
  const loadMoreRef  = useRef<HTMLDivElement | null>(null)
  const loadingRef   = useRef(false) // guard against double-invocation

  const loadFeed = useCallback(async (pageNum: number, refresh = false) => {
    if (loadingRef.current) return
    loadingRef.current = true
    setLoading(true)
    if (refresh) setRefreshing(true)

    try {
      const res = await fetch(`/api/feed?page=${pageNum}&pageSize=20`)
      if (!res.ok) throw new Error('Feed request failed')
      const data = await res.json()

      if (data.error) {
        toast.error('Could not load your feed')
        return
      }

      setItems(prev => refresh ? data.items : [...prev, ...data.items])
      setHasMore(data.hasMore)
      setPage(pageNum)
    } catch {
      toast.error('Feed unavailable. Please try again.')
    } finally {
      setLoading(false)
      setRefreshing(false)
      setInitialLoad(false)
      loadingRef.current = false
    }
  }, [])

  // Initial load
  useEffect(() => {
    loadFeed(1)
  }, [loadFeed])

  // Infinite scroll
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loadingRef.current) {
          loadFeed(page + 1)
        }
      },
      { threshold: 0.1 }
    )
    if (loadMoreRef.current) observerRef.current.observe(loadMoreRef.current)
    return () => observerRef.current?.disconnect()
  }, [hasMore, page, loadFeed])

  function trackEngagement(item: FeedItem, eventType: string) {
    const areas = item.research_areas?.length
      ? item.research_areas
      : item.research_area
        ? [item.research_area]
        : []

    fetch('/api/feed/engage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contentType:          item._feed_meta.type,
        contentId:            item.id,
        eventType,
        contentResearchAreas: areas,
      }),
    })
  }

  function handleSave(item: FeedItem) {
    trackEngagement(item, 'save')
    toast.success('Saved to your library')
  }

  function handleNotInterested(item: FeedItem) {
    trackEngagement(item, 'not_interested')
    setItems(prev => prev.filter(i => !(i.id === item.id && i._feed_meta.type === item._feed_meta.type)))
    toast('Got it — we will show you less like this.')
  }

  function handleView(item: FeedItem) {
    trackEngagement(item, 'view')
    const base = TYPE_ROUTES[item._feed_meta.type]
    if (base) router.push(`${base}/${item.id}`)
  }

  function handleRefresh() {
    setItems([])
    setPage(1)
    setHasMore(true)
    loadFeed(1, true)
  }

  if (initialLoad) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="h-6 w-48 rounded-lg bg-muted animate-pulse mb-2" />
            <div className="h-4 w-64 rounded-lg bg-muted animate-pulse" />
          </div>
        </div>
        <div className="grid gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold font-heading flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Your Research Feed
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Personalised to your interests and goals
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
          title="Refresh feed"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Empty state */}
      {items.length === 0 && !loading ? (
        <div className="text-center py-20">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}
          >
            <Sparkles className="w-8 h-8" style={{ color: '#7C6A9C' }} />
          </div>
          <p className="font-medium mb-1">Your feed is being personalised</p>
          <p className="text-sm text-muted-foreground">
            Add research interests in your profile to see relevant opportunities here.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map((item, index) => (
            <motion.div
              key={`${item._feed_meta.type}:${item.id}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.04, 0.25) }}
            >
              <FeedCard
                item={item}
                meta={item._feed_meta}
                onSave={() => handleSave(item)}
                onNotInterested={() => handleNotInterested(item)}
                onView={() => handleView(item)}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={loadMoreRef} className="h-10 mt-4">
        {loading && items.length > 0 && (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        )}
        {!hasMore && items.length > 0 && (
          <p className="text-center text-xs text-muted-foreground py-4">
            You are all caught up — check back tomorrow for new opportunities.
          </p>
        )}
      </div>
    </div>
  )
}
