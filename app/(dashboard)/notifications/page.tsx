'use client'

import { useEffect, useState, useCallback } from 'react'
import { Bell, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import type { Notification } from '@/lib/types/database'
import { EmptyState } from '@/components/ui/EmptyState'
import { NotificationSkeleton } from '@/components/ui/SkeletonLayouts'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'
import { PullToRefreshIndicator } from '@/components/ui/PullToRefreshIndicator'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadNotifications = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
    if (data) setNotifications(data)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  const { pullDistance, isRefreshing, threshold } = usePullToRefresh(loadNotifications)

  async function markAllRead() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const cardStyle = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(139,92,246,0.15)',
    borderRadius: '16px',
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-3">
        {Array.from({ length: 5 }).map((_, i) => <NotificationSkeleton key={i} />)}
      </div>
    )
  }

  const unread = notifications.filter(n => !n.is_read)

  return (
    <>
    <PullToRefreshIndicator pullDistance={pullDistance} threshold={threshold} isRefreshing={isRefreshing} />
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading" style={{ letterSpacing: '-0.02em' }}>Notifications</h1>
          <p className="text-sm mt-0.5" style={{ color: '#7C6A9C' }}>
            {unread.length > 0 ? `${unread.length} unread` : 'All caught up'}
          </p>
        </div>
        {unread.length > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(139,92,246,0.25)', color: '#C084FC', borderRadius: '8px' }}>
            <Check className="mr-1.5 h-3.5 w-3.5" /> Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon="🔔"
          title="All caught up"
          description="You'll be notified when someone connects with your research, messages you, or matches your interests."
          ctaLabel="Complete Your Profile"
          ctaHref="/profile"
        />
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <div key={n.id} className="p-4 rounded-xl flex items-start gap-3 transition-all"
              style={{
                background: n.is_read ? 'rgba(255,255,255,0.02)' : 'rgba(124,58,237,0.06)',
                border: `1px solid ${n.is_read ? 'rgba(139,92,246,0.1)' : 'rgba(168,85,247,0.2)'}`,
              }}>
              <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: n.is_read ? 'transparent' : '#A855F7' }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{n.title}</p>
                {n.message && <p className="text-xs mt-0.5" style={{ color: '#7C6A9C' }}>{n.message}</p>}
                <p className="text-xs mt-1" style={{ color: '#7C6A9C' }}>
                  {new Date(n.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    </>
  )
}
