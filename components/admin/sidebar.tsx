'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail,
} from '@/components/ui/sidebar'
import {
  LayoutDashboard, Users, Shield, FileText, AlertTriangle,
  Building2, BarChart3, Megaphone, ArrowLeft, DollarSign, FlaskConical,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Logo } from '@/components/Logo'
import { isFeatureEnabled } from '@/lib/config/feature-flags'

const adminNavItems = [
  { title: 'Overview', href: '/admin', icon: LayoutDashboard, exact: true },
  { title: 'Users', href: '/admin/users', icon: Users },
  { title: 'Mentor Verification', href: '/admin/mentors', icon: Shield },
  { title: 'Showcase Review', href: '/admin/showcase', icon: FileText },
  { title: 'Moderation', href: '/admin/moderation', icon: AlertTriangle },
  { title: 'Universities', href: '/admin/universities', icon: Building2 },
  { title: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { title: 'Research Insights', href: '/admin/research-insights', icon: FlaskConical },
  { title: 'Broadcast', href: '/admin/broadcast', icon: Megaphone },
  { title: 'Grants', href: '/admin/grants', icon: DollarSign },
  { title: 'Grant Applications', href: '/admin/grants/applications', icon: FileText },
  { title: 'Institutions', href: '/admin/institutions', icon: Building2 },
]

interface AdminSidebarProps {
  pendingMentors?: number
  pendingShowcase?: number
  pendingReports?: number
}

export function AdminSidebar({ pendingMentors = 0, pendingShowcase = 0, pendingReports = 0 }: AdminSidebarProps) {
  const pathname = usePathname()

  const getBadge = (href: string) => {
    if (href === '/admin/mentors' && pendingMentors > 0) return pendingMentors
    if (href === '/admin/showcase' && pendingShowcase > 0) return pendingShowcase
    if (href === '/admin/moderation' && pendingReports > 0) return pendingReports
    return null
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/admin">
                <Logo variant="icon" width={32} />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold font-heading text-primary dark:text-[#A855F7]">Admin Panel</span>
                  <span className="truncate text-xs text-muted-foreground">ResearchFlow</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminNavItems.filter((item) => {
                const featureByHref = {
                  '/admin/showcase': 'adminShowcaseReview',
                  '/admin/analytics': 'adminAnalytics',
                  '/admin/research-insights': 'adminResearchInsights',
                  '/admin/grants': 'adminGrants',
                  '/admin/grants/applications': 'adminGrantApplications',
                  '/admin/institutions': 'adminInstitution',
                } as const
                const feature = featureByHref[item.href as keyof typeof featureByHref]
                return !feature || isFeatureEnabled(feature)
              }).map(item => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(item.href + '/')
                const badge = getBadge(item.href)
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                      <Link href={item.href} className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <item.icon className="shrink-0" />
                          <span>{item.title}</span>
                        </span>
                        {badge !== null && (
                          <Badge variant="destructive" className="ml-auto text-xs h-5 px-1.5">
                            {badge}
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Back to Platform">
              <Link href="/dashboard">
                <ArrowLeft className="shrink-0" />
                <span>Back to Platform</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
