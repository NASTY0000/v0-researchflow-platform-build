'use client'

import Link from 'next/link'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { Bell, Search, Plus } from 'lucide-react'
import type { Profile } from '@/lib/types/database'

interface DashboardHeaderProps {
  profile: Profile
  unreadCount: number
}

export function DashboardHeader({ profile, unreadCount }: DashboardHeaderProps) {
  const getInitials = (name: string | null) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between px-4 gap-4" style={{ borderBottom: '1px solid rgba(139,92,246,0.12)', backgroundColor: 'rgba(5,1,15,0.8)', backdropFilter: 'blur(20px)' }}>
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        
        {/* Search placeholder */}
        <Button variant="outline" className="hidden sm:flex items-center gap-2 w-64 justify-start" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(139,92,246,0.2)', color: '#7C6A9C', borderRadius: '8px' }}>
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
            <Button size="sm" className="gap-1" style={{ background: 'linear-gradient(135deg,#7C3AED,#A855F7)', border: 'none', boxShadow: '0 0 14px rgba(124,58,237,0.3)', borderRadius: '8px' }}>
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
            <DropdownMenuItem asChild>
              <Link href="/projects/new">Project</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/marketplace/new">Marketplace Task</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative" asChild>
          <Link href="/notifications">
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
          </Link>
        </Button>

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
