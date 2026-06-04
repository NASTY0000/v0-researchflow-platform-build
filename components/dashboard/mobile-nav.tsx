'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Lightbulb, Users, Bell, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface NavTab {
  href: string
  label: string
  icon: React.ElementType
  exact?: boolean
}

const TABS: NavTab[] = [
  { href: '/dashboard',     label: 'Home',    icon: Home,       exact: true },
  { href: '/ideas',         label: 'Ideas',   icon: Lightbulb },
  { href: '/network',       label: 'Network', icon: Users },
  { href: '/notifications', label: 'Alerts',  icon: Bell },
  { href: '/profile',       label: 'Profile', icon: User },
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

  const isActive = (tab: NavTab) =>
    tab.exact ? pathname === tab.href : pathname.startsWith(tab.href)

  return (
    <>
      {/* Spacer so page content clears the nav */}
      <div className="h-[88px] w-full md:hidden" />

      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50"
        style={{
          height: '88px',
          background: 'rgba(10, 5, 20, 0.80)',
          backdropFilter: 'blur(28px) saturate(180%)',
          WebkitBackdropFilter: 'blur(28px) saturate(180%)',
          borderTop: '1px solid rgba(139,92,246,0.18)',
          boxShadow: '0 -1px 0 rgba(139,92,246,0.10), inset 0 1px 0 rgba(255,255,255,0.035)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          padding: '0 8px 16px',
        }}
      >
        {TABS.map((tab) => {
          const active = isActive(tab)
          const Icon = tab.icon
          const isAlerts = tab.href === '/notifications'

          return (
            <Link
              key={tab.href}
              href={tab.href}
              onClick={isAlerts ? () => setUnreadCount(0) : undefined}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                position: 'relative',
                padding: '10px 14px 4px',
                borderRadius: '16px',
                textDecoration: 'none',
                WebkitTapHighlightColor: 'transparent',
                minWidth: '56px',
              }}
            >
              {/* Icon container */}
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  transform: active ? 'translateY(-2px) scale(1.1)' : 'none',
                  transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
              >
                {/* Active ring + glass disc */}
                {active && (
                  <>
                    <div
                      style={{
                        position: 'absolute',
                        inset: '-9px',
                        borderRadius: '50%',
                        background: 'radial-gradient(ellipse at 50% 60%, rgba(124,58,237,0.22) 0%, rgba(124,58,237,0.07) 55%, transparent 75%)',
                        boxShadow: '0 0 0 1px rgba(139,92,246,0.50), 0 0 18px rgba(124,58,237,0.38), 0 0 36px rgba(124,58,237,0.14), inset 0 1px 0 rgba(255,255,255,0.07)',
                        animation: 'rfNavRing 2.8s ease-in-out infinite',
                      }}
                    />
                    {/* Gold halo arc at top of ring */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '-9px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '18px',
                        height: '3px',
                        background: 'linear-gradient(90deg, transparent 0%, rgba(251,191,36,0.75) 50%, transparent 100%)',
                        borderRadius: '100px',
                        filter: 'blur(1.5px)',
                        boxShadow: '0 0 6px rgba(251,191,36,0.5)',
                      }}
                    />
                  </>
                )}

                {/* The icon */}
                <Icon
                  size={20}
                  style={{
                    color: active ? '#C4B5FD' : 'rgba(139,92,246,0.38)',
                    filter: active ? 'drop-shadow(0 0 5px rgba(167,139,250,0.65))' : 'none',
                    transition: 'all 0.25s ease',
                    position: 'relative',
                    zIndex: 1,
                  }}
                  strokeWidth={active ? 2 : 1.8}
                />

                {/* Unread badge on Alerts */}
                {isAlerts && unreadCount > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '-3px',
                      right: '-4px',
                      minWidth: '8px',
                      height: '8px',
                      borderRadius: '4px',
                      background: '#A855F7',
                      border: '1.5px solid #07030F',
                      boxShadow: '0 0 6px rgba(168,85,247,0.7)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 2px',
                    }}
                  >
                    {unreadCount > 9 && (
                      <span style={{ fontSize: '6px', color: 'white', fontWeight: 700 }}>9+</span>
                    )}
                  </div>
                )}
              </div>

              {/* Label */}
              <span
                style={{
                  fontSize: '9.5px',
                  fontWeight: active ? 600 : 500,
                  color: active ? '#C4B5FD' : 'rgba(139,92,246,0.35)',
                  letterSpacing: '0.01em',
                  transition: 'all 0.25s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
              </span>

              {/* Active gold dot below label */}
              {active && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '2px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '3px',
                    height: '3px',
                    borderRadius: '50%',
                    background: '#FBBF24',
                    boxShadow: '0 0 5px rgba(251,191,36,0.8)',
                  }}
                />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Keyframe animation */}
      <style>{`
        @keyframes rfNavRing {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.78; transform: scale(1.04); }
        }
      `}</style>
    </>
  )
}
