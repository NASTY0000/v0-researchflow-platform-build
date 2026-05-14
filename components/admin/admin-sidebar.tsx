'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Award,
  ShieldAlert,
  Building2,
  BarChart3,
  Megaphone,
} from 'lucide-react'
import type { Profile } from '@/lib/types/database'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const adminNav = [
  { title: 'Overview', href: '/admin', icon: LayoutDashboard, exact: true },
  { title: 'Users', href: '/admin/users', icon: Users },
  { title: 'Mentor Verification', href: '/admin/mentors', icon: GraduationCap },
  { title: 'Showcase Review', href: '/admin/showcase', icon: Award },
  { title: 'Moderation', href: '/admin/moderation', icon: ShieldAlert },
  { title: 'Universities', href: '/admin/universities', icon: Building2 },
  { title: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { title: 'Broadcast', href: '/admin/broadcast', icon: Megaphone },
]

export function AdminSidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname()

  const getInitials = (name: string | null) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/admin">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden">
                  <Image src="/icon.svg" alt="ResearchFlow" width={32} height={32} className="size-8" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold font-heading gradient-text-cyan">Admin</span>
                  <span className="truncate text-xs" style={{ color: '#7C6A9C' }}>
                    ResearchFlow
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Admin</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminNav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href, item.exact)}
                    tooltip={item.title}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="pointer-events-none opacity-90">
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name || ''} />
                <AvatarFallback className="rounded-lg">{getInitials(profile.full_name)}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{profile.full_name}</span>
                <span className="truncate text-xs text-muted-foreground">{profile.email}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
