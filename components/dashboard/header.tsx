'use client'

import Link from 'next/link'
import { useTheme } from 'next-themes'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { Search, Plus, Sun, Moon } from 'lucide-react'
import type { Profile } from '@/lib/types/database'
import { NotificationsDropdown } from '@/components/dashboard/notifications-dropdown'
import { isFeatureEnabled } from '@/lib/config/feature-flags'

interface DashboardHeaderProps {
  profile: Profile
  unreadCount: number
}

export function DashboardHeader({ profile, unreadCount }: DashboardHeaderProps) {
  const { theme, setTheme } = useTheme()

  const getInitials = (name: string | null) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    // relative + z-30 keeps the header below the sidebar sheet (z-50). Without
    // an explicit stacking position, its backdrop-blur creates a stacking
    // context that paints over fixed overlays on iOS Safari.
    <header className="relative z-30 flex h-16 shrink-0 items-center justify-between px-4 gap-4 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        
        {/* Search */}
        <Button variant="outline" className="hidden sm:flex items-center gap-2 w-64 justify-start text-muted-foreground rounded-lg" onClick={() => window.dispatchEvent(new CustomEvent('open-search'))}>
          <Search className="h-4 w-4" />
          <span className="text-sm">Search...</span>
          <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      </div>

      <div className="flex items-center gap-2">
        {/* Quick actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="gap-1" style={{ background: 'var(--cta-bg)', border: 'none', boxShadow: 'var(--brand-glow-sm)', borderRadius: '8px' }}>
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Create New</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/ideas/new">Research Idea</Link>
            </DropdownMenuItem>
            {isFeatureEnabled('myProjects') && (
              <DropdownMenuItem asChild>
                <Link href="/projects/new">Project</Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem asChild>
              <Link href="/marketplace/new">Marketplace Task</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="h-8 w-8"
          aria-label="Toggle theme"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        {/* Notifications */}
        <NotificationsDropdown initialUnreadCount={unreadCount} />

        {/* Mobile user avatar */}
        <div className="md:hidden">
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name || ''} />
            <AvatarFallback>{getInitials(profile.full_name)}</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}
