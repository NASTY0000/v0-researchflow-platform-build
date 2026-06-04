'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Link from 'next/link'
import { ArrowLeft, MessageSquare, Plus, ChevronRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ListPageSkeleton } from '@/components/ui/skeleton-screens'

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
  created_at: string
  updated_at: string | null
  author_id: string
  forum_id: string
  profiles: {
    id: string
    full_name: string | null
    avatar_url: string | null
    department: string | null
  } | null
}

export default function ForumDetailPage() {
  const params = useParams()
  const router = useRouter()
  const forumId = params.id as string
  const [forum, setForum] = useState<Forum | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const supabase = createClient()

  async function loadData() {
    try {
      setLoading(true)
      setLoadError(null)

      const forumRes = await supabase
        .from('forums')
        .select('id, name, description, icon, category, post_count')
        .eq('id', forumId)
        .single()

      if (forumRes.error) {
        console.error('Forum error:', forumRes.error)
        setLoadError('Forum not found')
        setLoading(false)
        return
      }

      setForum(forumRes.data)

      const postsRes = await supabase
        .from('forum_posts')
        .select(`
          id,
          title,
          content,
          created_at,
          updated_at,
          author_id,
          forum_id,
          profiles (
            id,
            full_name,
            avatar_url,
            department
          )
        `)
        .eq('forum_id', forumId)
        .order('created_at', { ascending: false })

      if (postsRes.error) {
        console.error('Posts error:', postsRes.error)
      }

      setPosts((postsRes.data || []) as unknown as Post[])
      setLoading(false)
    } catch (err: unknown) {
      console.error('Load error:', err)
      const msg = err instanceof Error ? err.message : 'Failed to load'
      setLoadError(msg)
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [forumId])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <ListPageSkeleton type="post" count={4} />
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center space-y-3">
        <p className="text-muted-foreground text-sm">{loadError}</p>
        <button onClick={loadData} className="text-primary text-sm underline underline-offset-2">Try again</button>
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

  const postCount = forum.post_count ?? 0

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
            <p className="text-xs text-muted-foreground mt-1">{postCount.toLocaleString()} posts</p>
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
                    <AvatarImage src={post.profiles?.avatar_url || undefined} />
                    <AvatarFallback>{getInitials(post.profiles?.full_name || null)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-sm">{post.title}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{post.content}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>{post.profiles?.full_name || 'Anonymous'}</span>
                      <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
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
