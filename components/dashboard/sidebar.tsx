'use client'

import Link from 'next/link'
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
  useSidebar,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Logo } from '@/components/Logo'
import {
  LayoutDashboard,
  Sparkles,
  MessageSquare,
  GraduationCap,
  Users,
  Compass,
  Users2,
  Settings,
  LogOut,
  ChevronUp,
  ChevronRight,
  User,
  Shield,
  Bookmark,
  Building2,
} from 'lucide-react'
import type { Profile } from '@/lib/types/database'
import { isFeatureEnabled } from '@/lib/config/feature-flags'

interface NavItem {
  title: string
  href: string
  icon: React.ElementType
  badge?: string
  activeOn?: string[]
  children?: string[]
}
import { signOut } from '@/lib/actions/auth'
import { AkiliScoreBadge } from '@/components/akili/AkiliScoreBadge'

const coreNavItems: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  ...(isFeatureEnabled('myFeed') ? [{ title: 'My Feed', href: '/feed', icon: Sparkles }] : []),
  { title: 'Messages', href: '/messages', icon: MessageSquare },
]

const hubNavItems: NavItem[] = [
  {
    title: 'Collaborate',
    href: '/collaborate',
    icon: Users,
    activeOn: ['/projects', '/matches', '/mentors', '/agreements', '/network'],
    children: [
      ...(isFeatureEnabled('myProjects') ? ['My Projects'] : []),
      'Find Collaborators',
      'Mentor Directory',
      ...(isFeatureEnabled('agreements') ? ['Agreements'] : []),
      'My Network',
    ],
  },
  {
    title: 'Discover',
    href: '/discover',
    icon: Compass,
    activeOn: ['/ideas', '/grants', '/publications', '/assistant'],
    children: [
      'Idea Board',
      'Grants & Funding',
      ...(isFeatureEnabled('journalsAndConferences') ? ['Journals & Conferences'] : []),
      'AI Research Assistant',
    ],
  },
  {
    title: 'Community',
    href: '/community',
    icon: Users2,
    activeOn: ['/forums', '/peer-review', '/challenges', '/showcase', '/leaderboard', '/marketplace'],
    children: [
      ...(isFeatureEnabled('forum') ? ['Forums'] : []),
      ...(isFeatureEnabled('peerReview') ? ['Peer Review'] : []),
      ...(isFeatureEnabled('challenges') ? ['Challenges'] : []),
      'Showcase',
      'Leaderboard',
      'Marketplace',
    ],
  },
]

interface DashboardSidebarProps {
  profile: Profile
  isVerifiedMentor?: boolean
}

export function DashboardSidebar({ profile, isVerifiedMentor }: DashboardSidebarProps) {
  const pathname = usePathname()
  const { setOpenMobile } = useSidebar()

  const getInitials = (name: string | null) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  async function handleSignOut() {
    const result = await signOut()
    if (result?.redirectTo) {
      window.location.href = result.redirectTo
    }
  }

  const isItemActive = (item: NavItem) => {
    if (pathname === item.href || pathname.startsWith(item.href + '/')) return true
    return item.activeOn?.some((path) => pathname === path || pathname.startsWith(path + '/')) ?? false
  }

  function NavItems({ items }: { items: NavItem[] }) {
    return (
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              asChild
              isActive={isItemActive(item)}
              tooltip={item.title}
            >
              <Link href={item.href} onClick={() => setOpenMobile(false)}>
                <item.icon />
                <span>{item.title}</span>
                {'badge' in item && item.badge && (
                  <span className="ml-auto text-[10px] font-semibold bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    )
  }

  function HubNavItems({ items }: { items: NavItem[] }) {
    return (
      <SidebarMenu>
        {items.map((item) => {
          const active = isItemActive(item)
          return (
            <SidebarMenuItem key={item.href} className="group/hub relative">
              <SidebarMenuButton
                asChild
                isActive={active}
                tooltip={item.title}
              >
                <Link
                  href={item.href}
                  onClick={() => setOpenMobile(false)}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <item.icon />
                    <span>{item.title}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 group-hover/hub:text-muted-foreground transition-colors shrink-0" />
                </Link>
              </SidebarMenuButton>

              {/* Tooltip showing hub contents */}
              {item.children && (
                <div
                  className="absolute left-full top-0 ml-2 z-50 min-w-48 rounded-lg border border-border bg-popover p-3 shadow-lg opacity-0 invisible pointer-events-none transition-all duration-200 delay-150 group-hover/hub:opacity-100 group-hover/hub:visible"
                >
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground">
                    {item.title}
                  </p>
                  <ul className="space-y-1">
                    {item.children.map((child) => (
                      <li key={child} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <div className="w-1 h-1 rounded-full bg-primary/50" />
                        {child}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    )
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link href="/dashboard" className="block hover:opacity-80 transition-opacity" onClick={() => setOpenMobile(false)}>
          <div className="flex items-center gap-3 px-4 py-5 mb-2">
            <Logo variant="icon" width={38} />
            <div>
              <div className="text-base font-bold leading-tight">
                <span className="text-foreground">Research</span>
                <span className="text-gold-foreground">Flow</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Collaborate &amp; Discover
              </div>
            </div>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Core</SidebarGroupLabel>
          <SidebarGroupContent>
            <NavItems items={coreNavItems} />
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Explore</SidebarGroupLabel>
          <SidebarGroupContent>
            <HubNavItems items={hubNavItems} />
          </SidebarGroupContent>
        </SidebarGroup>

        {isVerifiedMentor && (
          <SidebarGroup>
            <SidebarGroupLabel>Mentoring</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === '/mentor-dashboard' || pathname.startsWith('/mentor-dashboard/')}
                    tooltip="Mentor Dashboard"
                  >
                    <Link href="/mentor-dashboard" onClick={() => setOpenMobile(false)}>
                      <GraduationCap />
                      <span>Mentor Dashboard</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name || ''} />
                    <AvatarFallback className="rounded-lg">
                      {getInitials(profile.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{profile.full_name}</span>
                    <span className="truncate text-xs text-muted-foreground">{profile.email}</span>
                    <span className="mt-0.5">
                      <AkiliScoreBadge score={profile.akili_score || 0} showTitle={false} size="sm" />
                    </span>
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Account Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/institution">
                    <Building2 className="mr-2 h-4 w-4" />
                    Institution
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/saved">
                    <Bookmark className="mr-2 h-4 w-4" />
                    Saved
                  </Link>
                </DropdownMenuItem>
                {(profile.is_admin === true || profile.roles?.includes('admin')) && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">
                      <Shield className="mr-2 h-4 w-4" />
                      Admin Dashboard
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
