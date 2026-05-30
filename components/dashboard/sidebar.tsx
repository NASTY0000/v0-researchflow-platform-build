'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Logo } from '@/components/Logo'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  LayoutDashboard, Lightbulb, GitMerge, MessageSquare, Bell,
  FolderKanban, BookOpen, Award, Trophy, DollarSign,
  MessageCircle, GraduationCap, Users, BarChart2,
  Bookmark, FileText, Building2, ChevronLeft, LogOut, Zap,
  Shield,
} from 'lucide-react'
import { signOut } from '@/lib/actions/auth'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  badge?: 'unread_notifications' | 'unread_messages' | string
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'CORE',
    items: [
      { label: 'Dashboard',      href: '/dashboard',      icon: LayoutDashboard },
      { label: 'Ideas',          href: '/ideas',          icon: Lightbulb },
      { label: 'Matches',        href: '/matches',        icon: GitMerge },
      { label: 'Messages',       href: '/messages',       icon: MessageSquare, badge: 'unread_messages' },
      { label: 'Notifications',  href: '/notifications',  icon: Bell,          badge: 'unread_notifications' },
    ],
  },
  {
    label: 'RESEARCH',
    items: [
      { label: 'My Projects', href: '/projects',   icon: FolderKanban },
      { label: 'Mentors',     href: '/mentors',    icon: BookOpen },
      { label: 'Showcase',    href: '/showcase',   icon: Award },
      { label: 'Challenges',  href: '/challenges', icon: Trophy },
    ],
  },
  {
    label: 'DISCOVER',
    items: [
      { label: 'Grants',               href: '/grants',       icon: DollarSign },
      { label: 'Forums',               href: '/forums',       icon: MessageCircle },
      { label: 'Journals & Conferences', href: '/publications', icon: GraduationCap },
    ],
  },
  {
    label: 'COMMUNITY',
    items: [
      { label: 'Network',     href: '/network',     icon: Users },
      { label: 'Leaderboard', href: '/leaderboard', icon: BarChart2 },
    ],
  },
  {
    label: 'MY SPACE',
    items: [
      { label: 'Saved',       href: '/saved',       icon: Bookmark },
      { label: 'Agreements',  href: '/agreements',  icon: FileText },
      { label: 'Institution', href: '/institution', icon: Building2 },
    ],
  },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function DashboardSidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const [collapsed, setCollapsed] = useState(false)
  const [profile, setProfile] = useState<{
    full_name: string | null
    avatar_url: string | null
    akili_score: number
    is_admin: boolean
    roles: string[] | null
  } | null>(null)
  const [unreadNotifications, setUnreadNotifications] = useState(0)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: prof }, { count }] = await Promise.all([
        supabase
          .from('profiles')
          .select('full_name, avatar_url, akili_score, is_admin, roles')
          .eq('id', user.id)
          .single(),
        supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_read', false),
      ])

      if (prof) setProfile(prof)
      setUnreadNotifications(count || 0)
    }
    load()
  }, [])

  function handleNavClick(href: string) {
    onClose()
    router.push(href)
  }

  async function handleSignOut() {
    const result = await signOut()
    if (result?.redirectTo) window.location.href = result.redirectTo
  }

  const getInitials = (name: string | null) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  function getBadgeCount(badge?: string) {
    if (badge === 'unread_notifications') return unreadNotifications
    return 0
  }

  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname.startsWith(href + '/'))

  const sidebarWidth = collapsed ? 72 : 260

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 z-40 md:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        animate={{ width: sidebarWidth }}
        transition={{ duration: 0.22, ease: 'easeInOut' }}
        className={[
          'fixed top-0 left-0 h-full z-50 flex flex-col',
          'bg-[#0D0720] border-r border-white/8',
          // Mobile: slide in/out
          'transition-transform duration-300 md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          // Desktop: always visible, no transform
          'md:relative md:flex md:shrink-0',
        ].join(' ')}
        style={{ overflow: 'hidden' }}
      >
        {/* Logo + collapse toggle */}
        <div className="flex items-center justify-between px-4 py-5 mb-1 shrink-0">
          <button
            onClick={() => handleNavClick('/dashboard')}
            className="flex items-center gap-3 min-w-0 hover:opacity-80 transition-opacity"
          >
            <span className="shrink-0"><Logo variant="icon" width={32} /></span>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="leading-tight"
              >
                <div className="text-sm font-bold">
                  <span className="text-white">Research</span>
                  <span className="text-amber-400">Flow</span>
                </div>
                <div className="text-[10px] text-purple-400/70">Collaborate &amp; Discover</div>
              </motion.div>
            )}
          </button>

          <button
            onClick={() => setCollapsed(c => !c)}
            className="hidden md:flex items-center justify-center w-7 h-7 rounded-md text-white/40 hover:text-white hover:bg-white/8 transition-colors shrink-0"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <motion.div animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.22 }}>
              <ChevronLeft className="w-4 h-4" />
            </motion.div>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 space-y-5 pb-4">
          {NAV_GROUPS.map(group => {
            const visibleItems = group.items.filter(item => {
              if (item.href === '/admin') {
                return profile?.is_admin || profile?.roles?.includes('admin')
              }
              return true
            })
            if (!visibleItems.length) return null

            return (
              <div key={group.label}>
                {!collapsed && (
                  <p className="px-2 mb-1 text-[10px] font-semibold tracking-widest text-white/25 select-none">
                    {group.label}
                  </p>
                )}
                <ul className="space-y-0.5">
                  {visibleItems.map(item => {
                    const active = isActive(item.href)
                    const badgeCount = getBadgeCount(item.badge)
                    const Icon = item.icon

                    return (
                      <li key={item.href} className="relative group">
                        {active && (
                          <motion.div
                            layoutId="sidebar-active"
                            className="absolute inset-0 rounded-lg bg-primary/15"
                            transition={{ duration: 0.2, ease: 'easeInOut' }}
                          />
                        )}
                        <button
                          onClick={() => handleNavClick(item.href)}
                          className={[
                            'relative w-full flex items-center gap-3 rounded-lg transition-colors',
                            collapsed ? 'px-0 justify-center h-10' : 'px-3 h-9',
                            active
                              ? 'text-primary'
                              : 'text-white/55 hover:text-white hover:bg-white/5',
                          ].join(' ')}
                        >
                          <Icon className="w-[18px] h-[18px] shrink-0" />
                          {!collapsed && (
                            <span className="text-sm font-medium truncate">{item.label}</span>
                          )}
                          {!collapsed && badgeCount > 0 && (
                            <span className="ml-auto text-[10px] font-bold bg-primary/20 text-primary px-1.5 py-0.5 rounded-full shrink-0">
                              {badgeCount > 99 ? '99+' : badgeCount}
                            </span>
                          )}
                          {collapsed && badgeCount > 0 && (
                            <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
                          )}
                        </button>

                        {/* Collapsed tooltip */}
                        {collapsed && (
                          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1 bg-popover border border-border rounded-md text-xs font-medium text-popover-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg">
                            {item.label}
                            {badgeCount > 0 && (
                              <span className="ml-1.5 text-primary font-bold">{badgeCount}</span>
                            )}
                          </div>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}

          {/* Admin section (conditional) */}
          {(profile?.is_admin || profile?.roles?.includes('admin')) && (
            <div>
              {!collapsed && (
                <p className="px-2 mb-1 text-[10px] font-semibold tracking-widest text-white/25 select-none">
                  ADMIN
                </p>
              )}
              <ul className="space-y-0.5">
                {[
                  { label: 'Admin Dashboard', href: '/admin', icon: Shield },
                ].map(item => {
                  const active = isActive(item.href)
                  const Icon = item.icon
                  return (
                    <li key={item.href} className="relative group">
                      {active && (
                        <motion.div
                          layoutId="sidebar-active"
                          className="absolute inset-0 rounded-lg bg-primary/15"
                          transition={{ duration: 0.2, ease: 'easeInOut' }}
                        />
                      )}
                      <button
                        onClick={() => handleNavClick(item.href)}
                        className={[
                          'relative w-full flex items-center gap-3 rounded-lg transition-colors',
                          collapsed ? 'px-0 justify-center h-10' : 'px-3 h-9',
                          active ? 'text-primary' : 'text-white/55 hover:text-white hover:bg-white/5',
                        ].join(' ')}
                      >
                        <Icon className="w-[18px] h-[18px] shrink-0" />
                        {!collapsed && <span className="text-sm font-medium truncate">{item.label}</span>}
                      </button>
                      {collapsed && (
                        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1 bg-popover border border-border rounded-md text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg">
                          {item.label}
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </nav>

        {/* User card */}
        <div className="shrink-0 border-t border-white/8 p-3">
          {profile ? (
            <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
              <button
                onClick={() => handleNavClick('/profile')}
                className="shrink-0 group"
                title="View profile"
              >
                <Avatar className="h-8 w-8 ring-2 ring-transparent group-hover:ring-primary/50 transition-all">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                    {getInitials(profile.full_name)}
                  </AvatarFallback>
                </Avatar>
              </button>
              {!collapsed && (
                <>
                  <button
                    onClick={() => handleNavClick('/profile')}
                    className="flex-1 min-w-0 text-left hover:opacity-80 transition-opacity"
                  >
                    <p className="text-sm font-semibold text-white truncate">
                      {profile.full_name || 'Researcher'}
                    </p>
                    <p className="text-[11px] text-white/40 flex items-center gap-1 mt-0.5">
                      <Zap className="w-3 h-3 text-primary" />
                      {(profile.akili_score || 0).toLocaleString()} Akili
                    </p>
                  </button>
                  <button
                    onClick={handleSignOut}
                    title="Sign out"
                    className="shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
              <div className="w-8 h-8 rounded-full bg-white/5 animate-pulse shrink-0" />
              {!collapsed && <div className="flex-1 h-4 rounded bg-white/5 animate-pulse" />}
            </div>
          )}
        </div>
      </motion.aside>
    </>
  )
}
