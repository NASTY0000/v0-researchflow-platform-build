'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Loader2 } from 'lucide-react'

export default function NewPostPage() {
  const params = useParams()
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [forumName, setForumName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function loadForum() {
      const { data } = await supabase.from('forums').select('name').eq('id', params.id).single()
      if (data) setForumName(data.name)
    }
    loadForum()
  }, [params.id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (title.trim().length < 10) {
      setError('Title must be at least 10 characters.')
      return
    }
    if (content.trim().length < 20) {
      setError('Post content must be at least 20 characters.')
      return
    }

    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('You must be logged in to post.')
      setLoading(false)
      return
    }

    const { data: post, error: postError } = await supabase
      .from('forum_posts')
      .insert({
        forum_id: params.id,
        author_id: user.id,
        title: title.trim(),
        content: content.trim(),
      })
      .select('id')
      .single()

    if (postError || !post) {
      setError(postError?.message || 'Failed to create post. Please try again.')
      setLoading(false)
      return
    }

    // Increment forum post count
    await supabase.rpc('increment_forum_posts', { forum_id: params.id })

    // Award Akili points
    await supabase.from('akili_score_events').insert({
      user_id: user.id,
      event_type: 'forum_post_created',
      points_earned: 10,
      dimension: 'community',
      description: `Created a forum post: ${title.trim().slice(0, 60)}`,
    })

    router.push(`/forums/${params.id}/posts/${post.id}`)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <button
        onClick={() => router.push(`/forums/${params.id}`)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to {forumName || 'forum'}
      </button>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">New Discussion Post</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Title <span className="text-muted-foreground text-xs">(min. 10 characters)</span></Label>
              <Input
                id="title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="What would you like to discuss?"
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground text-right">{title.length}/200</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="content">Content <span className="text-muted-foreground text-xs">(min. 20 characters)</span></Label>
              <Textarea
                id="content"
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Share your thoughts, questions, or insights..."
                rows={8}
                maxLength={5000}
              />
              <p className="text-xs text-muted-foreground text-right">{content.length}/5000</p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground">
                Posting earns you <span className="text-primary font-medium">+10 Akili points</span>
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/forums/${params.id}`)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Posting...</> : 'Post Discussion'}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
