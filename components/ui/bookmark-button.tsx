'use client'

import { useState, useEffect } from 'react'
import { Bookmark, BookmarkCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

interface BookmarkButtonProps {
  contentType: 'idea' | 'showcase' | 'mentor' | 'profile'
  contentId: string
  size?: 'sm' | 'md'
}

export function BookmarkButton({ contentType, contentId, size = 'md' }: BookmarkButtonProps) {
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    checkBookmark()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentId])

  async function checkBookmark() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('user_id', user.id)
      .eq('content_type', contentType)
      .eq('content_id', contentId)
      .maybeSingle()

    setSaved(!!data)
  }

  async function toggleBookmark() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setLoading(true)

    if (saved) {
      await supabase
        .from('bookmarks')
        .delete()
        .eq('user_id', user.id)
        .eq('content_type', contentType)
        .eq('content_id', contentId)
      setSaved(false)
    } else {
      await supabase
        .from('bookmarks')
        .insert({ user_id: user.id, content_type: contentType, content_id: contentId })
      setSaved(true)
    }

    setLoading(false)
  }

  return (
    <Button
      variant="ghost"
      size={size === 'sm' ? 'sm' : 'icon'}
      onClick={toggleBookmark}
      disabled={loading}
      title={saved ? 'Remove bookmark' : 'Save'}
      className={saved ? 'text-primary hover:text-primary/80' : 'text-muted-foreground hover:text-primary'}
    >
      {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
    </Button>
  )
}
