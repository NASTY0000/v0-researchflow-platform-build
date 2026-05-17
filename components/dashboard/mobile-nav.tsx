'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Lightbulb, Users, Bell, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'

const NAV_ITEMS = [
  { label: 'Home', href: '/dashboard', icon: Home },
  { label: 'Ideas', href: '/ideas', icon: Lightbulb },
  { label: 'Network', href: '/network', icon: Users },
  { label: 'Alerts', href: '/notifications', icon: Bell },
  { label: 'Profile', href: '/profile', icon: User },
]

interface MobileNavProps {
  initialUnreadCount: number
}

export function MobileNav({ initialUnreadCount }: MobileNavProps) {
  const pathname = usePathname()
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount)

  useEffect(() => {
    const supabase = createClient()
    let cleanup: (() => void) | undefined

    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const channel = supabase
        .channel('mobile-nav-notifications')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        }, () => {
          setUnreadCount(prev => prev + 1)
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        }, async () => {
          const { count } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('is_read', false)
          setUnreadCount(count || 0)
        })
        .subscribe()

      cleanup = () => { supabase.removeChannel(channel) }
    }

    init()
    return () => cleanup?.()
  }, [])

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-stretch"
      style={{
        height: '64px',
        background: 'rgba(5,1,15,0.95)',
        borderTop: '1px solid rgba(139,92,246,0.2)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
        const active = isActive(href)
        const isNotifications = href === '/notifications'

        return (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 relative"
            onClick={isNotifications ? () => setUnreadCount(0) : undefined}
          >
            <div className="relative">
              <Icon
                className="h-5 w-5 transition-colors"
                style={{ color: active ? '#A855F7' : '#7C6A9C' }}
              />
              {isNotifications && unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-4 w-4 flex items-center justify-center p-0 text-[10px]"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </div>
            <span
              className="text-[10px] font-medium transition-colors leading-tight"
              style={{ color: active ? '#A855F7' : '#7C6A9C' }}
            >
              {label}
            </span>
            {active && (
              <span
                className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                style={{ background: '#A855F7' }}
              />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
