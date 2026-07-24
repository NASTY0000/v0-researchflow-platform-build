'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, ThumbsUp, MessageSquare, Eye, Loader2, Send } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ListPageSkeleton } from '@/components/ui/skeleton-screens'

interface Post {
  id: string
  title: string
  content: string
  upvotes: number
  reply_count: number
  view_count: number
  created_at: string
  forum_id: string
  author_id: string
  author: {
    full_name: string | null
    avatar_url: string | null
  } | null
}

interface Reply {
  id: string
  content: string
  upvotes: number
  created_at: string
  author_id: string
  author: {
    full_name: string | null
    avatar_url: string | null
  } | null
}

export default function PostDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [post, setPost] = useState<Post | null>(null)
  const [replies, setReplies] = useState<Reply[]>([])
  const [loading, setLoading] = useState(true)
  const [replyContent, setReplyContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [replyError, setReplyError] = useState<string | null>(null)
  const [upvoted, setUpvoted] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const viewCounted = useRef(false)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const [{ data: { user } }, { data: postData }, { data: repliesData }] = await Promise.all([
        supabase.auth.getUser(),
        supabase
          .from('forum_posts')
          .select('*')
          .eq('id', params.postId)
          .maybeSingle(),
        supabase
          .from('forum_replies')
          .select('*')
          .eq('post_id', params.postId)
          .order('created_at', { ascending: true }),
      ])

      // Resolve author profiles separately: the profiles(...) join syntax
      // requires FK relationships this database doesn't have.
      const rawReplies = repliesData || []
      const authorIds = [...new Set([
        ...(postData?.author_id ? [postData.author_id] : []),
        ...rawReplies.map(r => r.author_id).filter(Boolean),
      ])]
      let profileById = new Map<string, { id: string; full_name: string | null; avatar_url: string | null }>()
      if (authorIds.length) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', authorIds)
        profileById = new Map((profs || []).map(p => [p.id, p]))
      }

      setCurrentUserId(user?.id || null)
      setPost(postData ? ({ ...postData, author: profileById.get(postData.author_id) ?? null } as unknown as Post) : null)
      setReplies(rawReplies.map(r => ({ ...r, author: profileById.get(r.author_id) ?? null })) as unknown as Reply[])
      setLoading(false)

      // Check if user upvoted
      if (user && postData) {
        const { data: upvoteData } = await supabase
          .from('forum_upvotes')
          .select('id')
          .eq('post_id', params.postId)
          .eq('user_id', user.id)
          .maybeSingle()
        setUpvoted(!!upvoteData)
      }

      // Increment view count once
      if (!viewCounted.current && postData) {
        viewCounted.current = true
        await supabase
          .from('forum_posts')
          .update({ view_count: (postData.view_count || 0) + 1 })
          .eq('id', params.postId)
      }
    }
    load()
  }, [params.postId])

  async function handleUpvote() {
    if (!currentUserId || !post) return

    if (upvoted) {
      await supabase.from('forum_upvotes').delete().eq('post_id', post.id).eq('user_id', currentUserId)
      setUpvoted(false)
      setPost(p => p ? { ...p, upvotes: Math.max(0, p.upvotes - 1) } : p)
    } else {
      await supabase.from('forum_upvotes').insert({ post_id: post.id, user_id: currentUserId })
      await supabase.from('forum_posts').update({ upvotes: post.upvotes + 1 }).eq('id', post.id)
      setUpvoted(true)
      setPost(p => p ? { ...p, upvotes: p.upvotes + 1 } : p)
    }
  }

  async function handleReply(e: React.FormEvent) {
    e.preventDefault()
    if (replyContent.trim().length < 5) {
      setReplyError('Reply must be at least 5 characters.')
      return
    }
    if (!currentUserId || !post) return

    setSubmitting(true)
    setReplyError(null)

    const { data: newReply, error } = await supabase
      .from('forum_replies')
      .insert({ post_id: post.id, author_id: currentUserId, content: replyContent.trim() })
      .select('*')
      .single()

    if (error || !newReply) {
      setReplyError(error?.message || 'Failed to post reply.')
      setSubmitting(false)
      return
    }

    const { data: myProfile } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', currentUserId)
      .maybeSingle()

    await supabase
      .from('forum_posts')
      .update({ reply_count: (post.reply_count || 0) + 1 })
      .eq('id', post.id)

    setReplies(prev => [...prev, { ...newReply, author: myProfile ?? null } as unknown as Reply])
    setPost(p => p ? { ...p, reply_count: p.reply_count + 1 } : p)
    setReplyContent('')
    setSubmitting(false)
  }

  const getInitials = (name: string | null) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <ListPageSkeleton type="post" count={3} />
      </div>
    )
  }

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 text-center text-muted-foreground">
        Post not found.
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Back */}
      <button
        onClick={() => router.push(`/forums/${params.id}`)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to forum
      </button>

      {/* Post */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarImage src={post.author?.avatar_url || undefined} />
              <AvatarFallback>{getInitials(post.author?.full_name || null)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-lg font-bold font-heading">{post.title}</h1>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                <span>{post.author?.full_name || 'Anonymous'}</span>
                <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
              </div>
            </div>
          </div>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
          <div className="flex items-center gap-4 pt-2 border-t border-border">
            <button
              onClick={handleUpvote}
              className={`flex items-center gap-1.5 text-sm transition-colors ${
                upvoted ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ThumbsUp className="w-4 h-4" />
              {post.upvotes} upvotes
            </button>
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MessageSquare className="w-4 h-4" />
              {post.reply_count} replies
            </span>
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Eye className="w-4 h-4" />
              {post.view_count} views
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Replies */}
      {replies.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
          </h2>
          {replies.map(reply => (
            <Card key={reply.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={reply.author?.avatar_url || undefined} />
                    <AvatarFallback>{getInitials(reply.author?.full_name || null)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <span className="font-medium text-foreground">{reply.author?.full_name || 'Anonymous'}</span>
                      <span>{formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}</span>
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{reply.content}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Reply form */}
      <Card>
        <CardContent className="p-4">
          <h2 className="font-semibold text-sm mb-3">Add a Reply</h2>
          {replyError && (
            <Alert variant="destructive" className="mb-3">
              <AlertDescription>{replyError}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleReply} className="space-y-3">
            <Textarea
              value={replyContent}
              onChange={e => setReplyContent(e.target.value)}
              placeholder="Share your thoughts or insights..."
              rows={4}
              maxLength={2000}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{replyContent.length}/2000</p>
              <Button type="submit" size="sm" disabled={submitting || !currentUserId}>
                {submitting ? (
                  <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Posting...</>
                ) : (
                  <><Send className="mr-2 h-3.5 w-3.5" />Post Reply</>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
