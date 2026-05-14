'use client'

import Link from 'next/link'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Bell, ExternalLink } from 'lucide-react'
interface AdminHeaderProps {
  unreadCount: number
}

export function AdminHeader({ unreadCount }: AdminHeaderProps) {
  return (
    <header
      className="flex h-16 shrink-0 items-center justify-between px-4 gap-4"
      style={{
        borderBottom: '1px solid rgba(139,92,246,0.12)',
        backgroundColor: 'rgba(5,1,15,0.8)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Badge
          variant="outline"
          className="font-medium border-violet-500/40 text-violet-200 bg-violet-500/10"
        >
          Admin Panel
        </Badge>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" asChild className="gap-1.5">
          <Link href="/dashboard">
            <ExternalLink className="h-4 w-4" />
            Back to platform
          </Link>
        </Button>
        <Button variant="ghost" size="icon" className="relative" asChild>
          <Link href="/notifications">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
        </Button>
      </div>
    </header>
  )
}
