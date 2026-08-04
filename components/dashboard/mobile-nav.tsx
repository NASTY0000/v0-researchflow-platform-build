'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, Compass, Bell, User, Users, Users2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'

interface NavTab {
  href: string
  label: string
  icon: React.ElementType
  exact?: boolean
}

const TABS: NavTab[] = [
  { href: '/dashboard',     label: 'Home',    icon: Home,    exact: true },
  { href: '/discover',      label: 'Explore', icon: Compass },
  { href: '/notifications', label: 'Alerts',  icon: Bell },
  { href: '/profile',       label: 'Profile', icon: User },
]

const EXPLORE_PATHS = [
  '/collaborate', '/projects', '/matches', '/mentors', '/agreements', '/network',
  '/discover', '/ideas', '/grants', '/publications', '/assistant',
  '/community', '/forums', '/peer-review', '/challenges', '/showcase', '/leaderboard', '/marketplace',
]

const HUBS = [
  {
    href: '/collaborate',
    label: 'Collaborate',
    description: 'Connect, build, and grow your research network',
    icon: Users,
  },
  {
    href: '/discover',
    label: 'Discover',
    description: 'Explore ideas, funding, and resources for your research',
    icon: Compass,
  },
  {
    href: '/community',
    label: 'Community',
    description: 'Engage with the ResearchFlow research community',
    icon: Users2,
  },
]

interface MobileNavProps {
  initialUnreadCount: number
}

export function MobileNav({ initialUnreadCount }: MobileNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount)
  const [exploreOpen, setExploreOpen] = useState(false)

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

  const isActive = (tab: NavTab) => {
    if (tab.exact) return pathname === tab.href
    if (tab.href === '/discover') {
      return EXPLORE_PATHS.some((path) => pathname === path || pathname.startsWith(path + '/'))
    }
    return pathname.startsWith(tab.href)
  }

  // Visibility is handled purely by CSS (`md:hidden` on the nav + spacer), so
  // it renders identically on the server and on every route — no JS width
  // gate that can wrongly hide the bar on one page but not another.
  return (
    <>
      {/* Spacer so page content clears the nav */}
      <div className="h-[88px] w-full md:hidden" />

      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around"
        style={{
          height: '88px',
          background: 'var(--nav-bg)',
          backdropFilter: 'blur(28px) saturate(180%)',
          WebkitBackdropFilter: 'blur(28px) saturate(180%)',
          borderTop: '1px solid var(--nav-border)',
          boxShadow: 'var(--nav-shadow)',
          padding: '0 8px 16px',
        }}
      >
        {TABS.map((tab) => {
          const active = isActive(tab)
          const Icon = tab.icon
          const isAlerts = tab.href === '/notifications'
          const isExplore = tab.href === '/discover'

          const content = (
            <>
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
                        background: 'var(--nav-ring-bg)',
                        boxShadow: 'var(--nav-ring-shadow)',
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
                        background: 'linear-gradient(90deg, transparent 0%, color-mix(in oklch, var(--gold) 75%, transparent) 50%, transparent 100%)',
                        borderRadius: '100px',
                        filter: 'blur(1.5px)',
                        boxShadow: '0 0 6px color-mix(in oklch, var(--gold) 50%, transparent)',
                      }}
                    />
                  </>
                )}

                {/* The icon */}
                <Icon
                  size={20}
                  style={{
                    color: active ? 'var(--nav-icon-active)' : 'var(--nav-icon)',
                    filter: active ? 'var(--nav-icon-glow)' : 'none',
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
                      border: '1.5px solid var(--nav-badge-ring)',
                      boxShadow: 'var(--brand-glow-sm)',
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
                  color: active ? 'var(--nav-icon-active)' : 'var(--nav-icon)',
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
                    background: 'var(--gold)',
                    boxShadow: '0 0 5px color-mix(in oklch, var(--gold) 80%, transparent)',
                  }}
                />
              )}
            </>
          )

          const itemStyle: React.CSSProperties = {
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
            background: 'none',
            border: 'none',
          }

          if (isExplore) {
            return (
              <button
                key={tab.href}
                type="button"
                onClick={() => setExploreOpen(true)}
                style={itemStyle}
              >
                {content}
              </button>
            )
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              onClick={isAlerts ? () => setUnreadCount(0) : undefined}
              style={itemStyle}
            >
              {content}
            </Link>
          )
        })}
      </nav>

      {/* Explore hub picker */}
      <Sheet open={exploreOpen} onOpenChange={setExploreOpen}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Explore</SheetTitle>
            <SheetDescription>Choose where you'd like to go</SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-2 px-4 pb-6">
            {HUBS.map((hub) => {
              const Icon = hub.icon
              return (
                <button
                  key={hub.href}
                  type="button"
                  onClick={() => {
                    setExploreOpen(false)
                    router.push(hub.href)
                  }}
                  className="flex items-center gap-4 rounded-xl border bg-card p-4 text-left hover:border-primary/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground text-sm">{hub.label}</div>
                    <div className="text-xs text-muted-foreground">{hub.description}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </SheetContent>
      </Sheet>

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
