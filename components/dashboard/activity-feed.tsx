'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { Lightbulb, Users, Trophy, BookOpen, Star, Zap } from 'lucide-react'

interface ActivityItem {
  id: string
  type: 'idea' | 'connection' | 'showcase' | 'challenge' | 'forum' | 'grant'
  message: string
  user: {
    id: string
    name: string
    avatar: string | null
  }
  link: string
  timestamp: string
}

const typeConfig = {
  idea: {
    icon: Lightbulb,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    label: 'posted an idea',
  },
  connection: {
    icon: Users,
    color: 'text-teal-400',
    bg: 'bg-teal-500/10',
    label: 'connected',
  },
  showcase: {
    icon: Star,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    label: 'published research',
  },
  challenge: {
    icon: Trophy,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    label: 'entered a challenge',
  },
  forum: {
    icon: BookOpen,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    label: 'posted in forum',
  },
  grant: {
    icon: Zap,
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    label: 'applied for a grant',
  },
}

export function ActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    loadActivities()
    const cleanup = setupRealtime()
    return cleanup
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadActivities() {
    const [ideasRes, showcaseRes, forumRes] = await Promise.all([
      supabase
        .from('research_ideas')
        .select('id, title, created_at, profiles(id, full_name, avatar_url)')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('showcase_entries')
        .select('id, title, created_at, profiles(id, full_name, avatar_url)')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(3),
      supabase
        .from('forum_posts')
        .select('id, title, created_at, forum_id, profiles(id, full_name, avatar_url)')
        .order('created_at', { ascending: false })
        .limit(4),
    ])

    const items: ActivityItem[] = []

    ideasRes.data?.forEach(idea => {
      if (!idea.profiles) return
      const p = idea.profiles as any
      items.push({
        id: `idea-${idea.id}`,
        type: 'idea',
        message: `"${idea.title.slice(0, 50)}${idea.title.length > 50 ? '...' : ''}"`,
        user: { id: p.id, name: p.full_name, avatar: p.avatar_url },
        link: `/ideas/${idea.id}`,
        timestamp: idea.created_at,
      })
    })

    showcaseRes.data?.forEach(entry => {
      if (!entry.profiles) return
      const p = entry.profiles as any
      items.push({
        id: `showcase-${entry.id}`,
        type: 'showcase',
        message: `"${entry.title.slice(0, 50)}${entry.title.length > 50 ? '...' : ''}"`,
        user: { id: p.id, name: p.full_name, avatar: p.avatar_url },
        link: `/showcase/${entry.id}`,
        timestamp: entry.created_at,
      })
    })

    forumRes.data?.forEach(post => {
      if (!post.profiles) return
      const p = post.profiles as any
      items.push({
        id: `forum-${post.id}`,
        type: 'forum',
        message: `"${post.title.slice(0, 50)}${post.title.length > 50 ? '...' : ''}"`,
        user: { id: p.id, name: p.full_name, avatar: p.avatar_url },
        link: `/forums/${post.forum_id}/posts/${post.id}`,
        timestamp: post.created_at,
      })
    })

    items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    setActivities(items.slice(0, 8))
    setLoading(false)
  }

  function setupRealtime() {
    const channel = supabase
      .channel('activity-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'research_ideas' },
        async (payload) => {
          const { data } = await supabase
            .from('research_ideas')
            .select('id, title, created_at, profiles(id, full_name, avatar_url)')
            .eq('id', payload.new.id)
            .single()

          if (!data?.profiles) return
          const p = data.profiles as any

          const newItem: ActivityItem = {
            id: `idea-${data.id}`,
            type: 'idea',
            message: `"${data.title.slice(0, 50)}"`,
            user: { id: p.id, name: p.full_name, avatar: p.avatar_url },
            link: `/ideas/${data.id}`,
            timestamp: data.created_at,
          }

          setActivities(prev => [newItem, ...prev].slice(0, 8))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl animate-pulse">
            <div className="w-8 h-8 rounded-full bg-muted shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <AnimatePresence mode="popLayout">
        {activities.map((activity, i) => {
          const config = typeConfig[activity.type]
          const Icon = config.icon

          return (
            <motion.div
              key={activity.id}
              layout={!shouldReduceMotion}
              initial={shouldReduceMotion ? false : { opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: 20 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.35, delay: shouldReduceMotion ? 0 : i * 0.05, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link href={activity.link}>
                <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors group">
                  <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                    <Icon className={`w-4 h-4 ${config.color}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        role="link"
                        tabIndex={0}
                        onClick={e => {
                          e.preventDefault()
                          e.stopPropagation()
                          router.push(`/profile/${activity.user.id}`)
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            e.stopPropagation()
                            router.push(`/profile/${activity.user.id}`)
                          }
                        }}
                        className="font-medium text-sm hover:text-primary transition-colors shrink-0 cursor-pointer"
                      >
                        {activity.user.name?.split(' ')[0]}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {config.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5 group-hover:text-foreground/70 transition-colors">
                      {activity.message}
                    </p>
                  </div>

                  <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: false })}
                  </span>
                </div>
              </Link>
            </motion.div>
          )
        })}
      </AnimatePresence>

      {activities.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          No activity yet. Be the first to post!
        </p>
      )}
    </div>
  )
}
