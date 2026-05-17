'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell, Check, CheckCheck, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'
import type { Notification } from '@/lib/types/database'

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

interface NotificationsDropdownProps {
  initialUnreadCount: number
}

export function NotificationsDropdown({ initialUnreadCount }: NotificationsDropdownProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount)
  const [open, setOpen] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)
      if (data) {
        setNotifications(data)
        setUnreadCount(data.filter(n => !n.is_read).length)
      }

      const channel = supabase
        .channel('notifications-bell')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        }, (payload) => {
          const newNotif = payload.new as Notification
          setNotifications(prev => [newNotif, ...prev].slice(0, 5))
          setUnreadCount(prev => prev + 1)
        })
        .subscribe()

      return () => { supabase.removeChannel(channel) }
    }

    init()
  }, [])

  async function markAllRead() {
    if (!userId) return
    const supabase = createClient()
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  async function markRead(id: string) {
    const supabase = createClient()
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const typeColors: Record<string, string> = {
    connection_request: '#7C3AED',
    connection_accepted: '#10B981',
    message: '#3B82F6',
    match: '#F59E0B',
    mentor_request: '#EC4899',
    system: '#6B7280',
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80"
        style={{
          background: 'rgba(10,5,25,0.97)',
          border: '1px solid rgba(139,92,246,0.2)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className="flex items-center justify-between px-3 py-2">
          <DropdownMenuLabel className="p-0 text-sm font-semibold">Notifications</DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1"
              style={{ color: '#A78BFA' }}
              onClick={markAllRead}
            >
              <CheckCheck className="h-3 w-3" />
              Mark all read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator style={{ background: 'rgba(139,92,246,0.15)' }} />

        {notifications.length === 0 ? (
          <div className="py-8 text-center" style={{ color: '#7C6A9C' }}>
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {notifications.map(notif => (
              <div
                key={notif.id}
                className="flex items-start gap-3 px-3 py-2.5 cursor-pointer transition-colors hover:bg-white/5"
                style={{ borderBottom: '1px solid rgba(139,92,246,0.08)' }}
                onClick={() => {
                  if (!notif.is_read) markRead(notif.id)
                  if (notif.link) window.location.href = notif.link
                  setOpen(false)
                }}
              >
                <div
                  className="mt-0.5 h-2 w-2 rounded-full shrink-0"
                  style={{ background: notif.is_read ? 'transparent' : typeColors[notif.type] || '#7C3AED' }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-tight" style={{ color: notif.is_read ? '#7C6A9C' : '#E2D9F3' }}>
                    {notif.title}
                  </p>
                  {notif.message && (
                    <p className="text-xs mt-0.5 truncate" style={{ color: '#7C6A9C' }}>{notif.message}</p>
                  )}
                  <p className="text-xs mt-1" style={{ color: '#4A3F6B' }}>{timeAgo(notif.created_at)}</p>
                </div>
                {!notif.is_read && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0 opacity-60 hover:opacity-100"
                    onClick={(e) => { e.stopPropagation(); markRead(notif.id) }}
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        <DropdownMenuSeparator style={{ background: 'rgba(139,92,246,0.15)' }} />
        <div className="p-2">
          <Link href="/notifications" onClick={() => setOpen(false)}>
            <Button
              variant="ghost"
              size="sm"
              className="w-full gap-1 text-xs"
              style={{ color: '#A78BFA' }}
            >
              <ExternalLink className="h-3 w-3" />
              View all notifications
            </Button>
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
