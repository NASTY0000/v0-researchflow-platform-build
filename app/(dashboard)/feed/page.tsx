'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { FeedCard } from '@/components/feed/feed-card'
import { ExternalCard } from '@/components/feed/external-card'
import { Loader2, RefreshCw, Sparkles, Newspaper, BookOpen, Megaphone, Compass } from 'lucide-react'
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

interface ExternalItem {
  id: string
  category: string
  title: string
  description?: string
  url: string
  authors?: string[]
  journal?: string
  citation_count?: number
  research_areas?: string[]
  is_african_relevant?: boolean
  deadline?: string
  published_at?: string
  [key: string]: unknown
}

const FEED_TABS = [
  { id: 'for_you',       label: 'For You',       icon: Sparkles },
  { id: 'news',          label: 'Science News',  icon: Newspaper },
  { id: 'publications',  label: 'Publications',  icon: BookOpen },
  { id: 'opportunities', label: 'Opportunities', icon: Megaphone },
  { id: 'discovery',     label: 'Discovery',     icon: Compass },
] as const

type FeedTabId = typeof FEED_TABS[number]['id']

export default function FeedPage() {
  const [activeTab, setActiveTab] = useState<FeedTabId>('for_you')
  const [items, setItems]         = useState<FeedItem[]>([])
  const [externalItems, setExternalItems] = useState<ExternalItem[]>([])
  const [page, setPage]           = useState(1)
  const [hasMore, setHasMore]     = useState(true)
  const [loading, setLoading]     = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const router = useRouter()

  const observerRef  = useRef<IntersectionObserver | null>(null)
  const loadMoreRef  = useRef<HTMLDivElement | null>(null)
  const loadingRef   = useRef(false) // guard against double-invocation

  const loadFeed = useCallback(async (tab: FeedTabId, pageNum: number, refresh = false) => {
    if (loadingRef.current) return
    loadingRef.current = true
    setLoading(true)
    if (refresh) setRefreshing(true)

    try {
      const url = tab === 'for_you'
        ? `/api/feed?page=${pageNum}&pageSize=20`
        : `/api/feed/external?category=${tab}&page=${pageNum}&pageSize=20`

      const res = await fetch(url)
      if (!res.ok) throw new Error('Feed request failed')
      const data = await res.json()

      if (data.error) {
        toast.error('Could not load your feed')
        return
      }

      if (tab === 'for_you') {
        setItems(prev => refresh ? data.items : [...prev, ...data.items])
      } else {
        setExternalItems(prev => refresh ? data.items : [...prev, ...data.items])
      }
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

  // Load on tab change
  useEffect(() => {
    setItems([])
    setExternalItems([])
    setPage(1)
    setHasMore(true)
    setInitialLoad(true)
    loadFeed(activeTab, 1)
  }, [activeTab]) // eslint-disable-line react-hooks/exhaustive-deps

  // Infinite scroll
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loadingRef.current) {
          loadFeed(activeTab, page + 1)
        }
      },
      { threshold: 0.1 }
    )
    if (loadMoreRef.current) observerRef.current.observe(loadMoreRef.current)
    return () => observerRef.current?.disconnect()
  }, [hasMore, page, activeTab, loadFeed])

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
    setExternalItems([])
    setPage(1)
    setHasMore(true)
    loadFeed(activeTab, 1, true)
  }

  const currentItems: (FeedItem | ExternalItem)[] = activeTab === 'for_you' ? items : externalItems

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

      {/* Tab bar */}
      <div className="flex items-center gap-1.5 mb-5 overflow-x-auto pb-1 -mx-1 px-1">
        {FEED_TABS.map(tab => {
          const TabIcon = tab.icon
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0"
              style={{
                background: active ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.03)',
                color: active ? '#C084FC' : '#9D8BB8',
                border: `1px solid ${active ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.06)'}`,
              }}
            >
              <TabIcon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Empty state */}
      {currentItems.length === 0 && !loading ? (
        <div className="text-center py-20">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}
          >
            <Sparkles className="w-8 h-8" style={{ color: '#7C6A9C' }} />
          </div>
          <p className="font-medium mb-1">
            {activeTab === 'for_you' ? 'Your feed is being personalised' : 'Nothing here yet'}
          </p>
          <p className="text-sm text-muted-foreground">
            {activeTab === 'for_you'
              ? 'Add research interests in your profile to see relevant opportunities here.'
              : 'Check back soon — we refresh this stream regularly.'}
          </p>
        </div>
      ) : activeTab === 'for_you' ? (
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
      ) : (
        <div className="grid gap-3">
          {externalItems.map((item, index) => (
            <ExternalCard key={item.id} item={item} index={index} />
          ))}
        </div>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={loadMoreRef} className="h-10 mt-4">
        {loading && currentItems.length > 0 && (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        )}
        {!hasMore && currentItems.length > 0 && (
          <p className="text-center text-xs text-muted-foreground py-4">
            You are all caught up — check back tomorrow for new opportunities.
          </p>
        )}
      </div>
    </div>
  )
}
