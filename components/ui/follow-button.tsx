'use client'

import { useState, useEffect } from 'react'
import { UserPlus, UserCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export function FollowButton({ targetUserId }: { targetUserId: string }) {
  const [following, setFollowing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [count, setCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    checkFollow()
    loadCount()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetUserId])

  async function checkFollow() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId)
      .maybeSingle()

    setFollowing(!!data)
  }

  async function loadCount() {
    const { count: c } = await supabase
      .from('follows')
      .select('id', { count: 'exact', head: true })
      .eq('following_id', targetUserId)
    setCount(c || 0)
  }

  async function toggleFollow() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setLoading(true)

    if (following) {
      await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)
      setFollowing(false)
      setCount(c => Math.max(0, c - 1))
      supabase.rpc('decrement_follow_counts', { follower: user.id, followed: targetUserId }).then(() => {})
    } else {
      await supabase
        .from('follows')
        .insert({ follower_id: user.id, following_id: targetUserId })
      setFollowing(true)
      setCount(c => c + 1)
      supabase.rpc('increment_follow_counts', { follower: user.id, followed: targetUserId }).then(() => {})
      supabase.from('notifications').insert({
        user_id: targetUserId,
        type: 'new_follower',
        title: 'New follower',
        message: 'Someone started following you',
        link: '/network',
        is_read: false,
      }).then(() => {})
    }

    setLoading(false)
  }

  return (
    <Button
      variant={following ? 'secondary' : 'outline'}
      size="sm"
      onClick={toggleFollow}
      disabled={loading}
      className="gap-2"
    >
      {following ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
      {following ? 'Following' : 'Follow'}
      <span className="text-muted-foreground text-xs ml-1">{count}</span>
    </Button>
  )
}
