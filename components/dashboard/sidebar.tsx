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
  Lightbulb,
  Users,
  FolderKanban,
  GraduationCap,
  BookOpen,
  Store,
  MessageSquare,
  Award,
  Trophy,
  Settings,
  LogOut,
  ChevronUp,
  User,
  Shield,
  UserCheck,
  Bookmark,
  Sparkles,
  DollarSign,
  Building2,
  FileText,
} from 'lucide-react'
import type { Profile } from '@/lib/types/database'

interface NavItem {
  title: string
  href: string
  icon: React.ElementType
  badge?: string
}
import { signOut } from '@/lib/actions/auth'
import { AkiliScoreBadge } from '@/components/akili/AkiliScoreBadge'

const coreNavItems: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Idea Board', href: '/ideas', icon: Lightbulb },
  { title: 'Messages', href: '/messages', icon: MessageSquare },
]

const collaborateNavItems: NavItem[] = [
  { title: 'Find Collaborators', href: '/matches', icon: Users },
  { title: 'My Network', href: '/network', icon: UserCheck },
  { title: 'My Projects', href: '/projects', icon: FolderKanban },
]

const discoverNavItems: NavItem[] = [
  { title: 'Mentor Directory', href: '/mentors', icon: BookOpen },
  { title: 'AI Assistant', href: '/assistant', icon: Sparkles },
  { title: 'Grants', href: '/grants', icon: DollarSign },
  { title: 'Journals & Conferences', href: '/publications', icon: GraduationCap },
]

const communityNavItems: NavItem[] = [
  { title: 'Forums', href: '/forums', icon: MessageSquare },
  { title: 'Challenges', href: '/challenges', icon: Trophy, badge: 'New' },
  { title: 'Showcase', href: '/showcase', icon: Award },
  { title: 'Leaderboard', href: '/leaderboard', icon: Trophy },
  { title: 'Marketplace', href: '/marketplace', icon: Store },
]

const accountNavItems: NavItem[] = [
  { title: 'Saved', href: '/saved', icon: Bookmark },
  { title: 'Institution', href: '/institution', icon: Building2 },
  { title: 'Agreements', href: '/agreements', icon: FileText },
]

interface DashboardSidebarProps {
  profile: Profile
}

export function DashboardSidebar({ profile }: DashboardSidebarProps) {
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

  function NavItems({ items }: { items: NavItem[] }) {
    return (
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              asChild
              isActive={pathname === item.href || pathname.startsWith(item.href + '/')}
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

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link href="/dashboard" className="block hover:opacity-80 transition-opacity" onClick={() => setOpenMobile(false)}>
          <div className="flex items-center gap-3 px-4 py-5 mb-2">
            <Logo variant="icon" width={38} />
            <div>
              <div className="text-base font-bold leading-tight">
                <span className="text-white">Research</span>
                <span style={{ color: '#FBBF24' }}>Flow</span>
              </div>
              <div className="text-xs" style={{ color: '#7C6A9C' }}>
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
          <SidebarGroupLabel>Collaborate</SidebarGroupLabel>
          <SidebarGroupContent>
            <NavItems items={collaborateNavItems} />
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Discover</SidebarGroupLabel>
          <SidebarGroupContent>
            <NavItems items={discoverNavItems} />
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Community</SidebarGroupLabel>
          <SidebarGroupContent>
            <NavItems items={communityNavItems} />
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <NavItems items={accountNavItems} />
          </SidebarGroupContent>
        </SidebarGroup>

        {profile.roles?.includes('mentor') && (
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

        {(profile.is_admin === true || profile.roles?.includes('admin')) && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === '/admin' || pathname.startsWith('/admin/')}
                    tooltip="Admin Dashboard"
                  >
                    <Link href="/admin" onClick={() => setOpenMobile(false)}>
                      <Shield />
                      <span>Admin Dashboard</span>
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
                    Settings
                  </Link>
                </DropdownMenuItem>
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
