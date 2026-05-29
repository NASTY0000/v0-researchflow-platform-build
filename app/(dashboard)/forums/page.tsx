'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { Search, MessageSquare, Users, Pin, TrendingUp } from 'lucide-react'
import { ForumCardSkeleton } from '@/components/ui/skeleton-screens'
import { StaggerContainer, StaggerItem } from '@/components/ui/stagger-container'
import { HoverCardLift } from '@/components/ui/hover-card-lift'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDistanceToNow } from 'date-fns'

interface Forum {
  id: string
  name: string
  description: string | null
  category: string
  icon: string | null
  post_count: number
  member_count: number
  last_activity_at: string | null
  is_pinned: boolean
}

const CATEGORY_COLORS: Record<string, string> = {
  general: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  methodology: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  tools: 'bg-green-500/10 text-green-400 border-green-500/20',
  funding: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  careers: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  discipline: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
}

const CATEGORIES = ['all', 'general', 'methodology', 'tools', 'funding', 'careers', 'discipline']

export default function ForumsPage() {
  const [forums, setForums] = useState<Forum[]>([])
  const [filtered, setFiltered] = useState<Forum[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('forums')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('last_activity_at', { ascending: false })
      console.log('Forums:', data, 'Error:', error)
      setForums(data || [])
      setFiltered(data || [])
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    let result = forums
    if (category !== 'all') result = result.filter(f => f.category === category)
    if (search) result = result.filter(f =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      (f.description || '').toLowerCase().includes(search.toLowerCase())
    )
    setFiltered(result)
  }, [search, category, forums])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => <ForumCardSkeleton key={i} />)}
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">Discussion Forums</h1>
          <p className="text-muted-foreground text-sm mt-1">Connect with researchers across Africa</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search forums..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all border ${
              category === cat
                ? 'bg-primary/20 border-primary/50 text-primary'
                : 'bg-transparent border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Forum list */}
      <StaggerContainer className="space-y-3">
        {filtered.length === 0 && (
          <EmptyState
            icon="💬"
            title="No forums found"
            description="Try a different search or category filter to discover research discussions."
          />
        )}
        {filtered.map(forum => (
          <StaggerItem key={forum.id}>
          <HoverCardLift>
          <Link href={`/forums/${forum.id}`}>
            <Card className="hover:border-primary/40 transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl flex-shrink-0">
                  {forum.icon || '💬'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {forum.is_pinned && <Pin className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
                    <h2 className="font-semibold truncate">{forum.name}</h2>
                    <Badge
                      variant="outline"
                      className={`text-xs capitalize ${CATEGORY_COLORS[forum.category] || 'bg-muted/50 text-muted-foreground'}`}
                    >
                      {forum.category}
                    </Badge>
                  </div>
                  {forum.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{forum.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      {forum.post_count.toLocaleString()} posts
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {forum.member_count.toLocaleString()} members
                    </span>
                    {forum.last_activity_at && (
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {formatDistanceToNow(new Date(forum.last_activity_at), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
          </HoverCardLift>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </div>
  )
}
