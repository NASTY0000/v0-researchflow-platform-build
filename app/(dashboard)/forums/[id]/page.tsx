'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Link from 'next/link'
import {
  ArrowLeft, MessageSquare, ThumbsUp, Eye, Pin,
  Plus, ChevronRight
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Forum {
  id: string
  name: string
  description: string | null
  category: string
  icon: string | null
  post_count: number
}

interface Post {
  id: string
  title: string
  content: string
  upvotes: number
  reply_count: number
  view_count: number
  is_pinned: boolean
  created_at: string
  author: {
    full_name: string | null
    avatar_url: string | null
  } | null
}

export default function ForumDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [forum, setForum] = useState<Forum | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const [{ data: forumData }, { data: postsData }] = await Promise.all([
        supabase.from('forums').select('*').eq('id', params.id).single(),
        supabase
          .from('forum_posts')
          .select('id, title, content, upvotes, reply_count, view_count, is_pinned, created_at, author:profiles(full_name, avatar_url)')
          .eq('forum_id', params.id)
          .order('is_pinned', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(50),
      ])
      setForum(forumData)
      setPosts((postsData || []) as unknown as Post[])
      setLoading(false)
    }
    load()
  }, [params.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!forum) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center text-muted-foreground">
        Forum not found.
      </div>
    )
  }

  const getInitials = (name: string | null) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Back + header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <button onClick={() => router.push('/forums')} className="mt-1 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{forum.icon || '💬'}</span>
              <h1 className="text-xl font-bold font-heading">{forum.name}</h1>
              <Badge variant="outline" className="capitalize text-xs">{forum.category}</Badge>
            </div>
            {forum.description && (
              <p className="text-sm text-muted-foreground mt-1">{forum.description}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">{forum.post_count.toLocaleString()} posts</p>
          </div>
        </div>
        <Link href={`/forums/${forum.id}/new-post`}>
          <Button size="sm" className="flex-shrink-0">
            <Plus className="w-4 h-4 mr-1" />
            New Post
          </Button>
        </Link>
      </div>

      {/* Posts */}
      <div className="space-y-3">
        {posts.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No posts yet. Be the first to start a discussion!</p>
            <Link href={`/forums/${forum.id}/new-post`}>
              <Button className="mt-4" size="sm">Create First Post</Button>
            </Link>
          </div>
        )}
        {posts.map(post => (
          <Link key={post.id} href={`/forums/${forum.id}/posts/${post.id}`}>
            <Card className="hover:border-primary/40 transition-colors cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-9 w-9 flex-shrink-0">
                    <AvatarImage src={post.author?.avatar_url || undefined} />
                    <AvatarFallback>{getInitials(post.author?.full_name || null)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {post.is_pinned && <Pin className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
                      <h2 className="font-semibold text-sm">{post.title}</h2>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{post.content}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>{post.author?.full_name || 'Anonymous'}</span>
                      <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3" /> {post.upvotes}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" /> {post.reply_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" /> {post.view_count}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
