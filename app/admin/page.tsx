'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { isFeatureEnabled } from '@/lib/config/feature-flags'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Users, FolderKanban, Lightbulb, FileText, Shield,
  UserPlus, TrendingUp, Activity, Clock
} from 'lucide-react'

interface Stats {
  totalUsers: number
  roleBreakdown: Record<string, number>
  activeProjectsMonth: number
  teamsFormedMonth: number
  pendingShowcase: number
  pendingMentors: number
  monthlyActiveUsers: number
}

interface ActivityItem {
  id: string
  type: 'signup' | 'idea' | 'team'
  title: string
  subtitle: string
  created_at: string
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0, roleBreakdown: {}, activeProjectsMonth: 0,
    teamsFormedMonth: 0, pendingShowcase: 0, pendingMentors: 0, monthlyActiveUsers: 0,
  })
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setIsLoading(true)
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString()

    const [
      usersResult, projectsResult, teamsResult,
      showcaseResult, mentorsResult, mauResult,
      profilesResult, ideasResult, teamsActivityResult,
    ] = await Promise.all([
      supabase.from('profiles').select('id, roles', { count: 'exact' }).eq('onboarding_completed', true),
      supabase.from('projects').select('id', { count: 'exact', head: true }).gte('created_at', monthStart).eq('status', 'active'),
      supabase.from('teams').select('id', { count: 'exact', head: true }).gte('created_at', monthStart),
      supabase.from('showcase_submissions').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('mentor_profiles').select('id', { count: 'exact', head: true }).eq('is_verified', false).eq('verification_status', 'pending'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('updated_at', thirtyDaysAgo),
      supabase.from('profiles').select('id, full_name, email, avatar_url, created_at').order('created_at', { ascending: false }).limit(7),
      supabase.from('research_ideas').select('id, title, created_at').order('created_at', { ascending: false }).limit(7),
      supabase.from('teams').select('id, name, created_at').order('created_at', { ascending: false }).limit(6),
    ])

    // Role breakdown
    const roleBreakdown: Record<string, number> = {}
    usersResult.data?.forEach(u => {
      u.roles?.forEach((r: string) => {
        roleBreakdown[r] = (roleBreakdown[r] || 0) + 1
      })
    })

    setStats({
      totalUsers: usersResult.count || 0,
      roleBreakdown,
      activeProjectsMonth: projectsResult.count || 0,
      teamsFormedMonth: teamsResult.count || 0,
      pendingShowcase: showcaseResult.count || 0,
      pendingMentors: mentorsResult.count || 0,
      monthlyActiveUsers: mauResult.count || 0,
    })

    // Build activity feed
    const feed: ActivityItem[] = [
      ...(profilesResult.data || []).map(p => ({
        id: `signup-${p.id}`,
        type: 'signup' as const,
        title: p.full_name || p.email,
        subtitle: 'New user signed up',
        created_at: p.created_at,
      })),
      ...(ideasResult.data || []).map(i => ({
        id: `idea-${i.id}`,
        type: 'idea' as const,
        title: i.title,
        subtitle: 'Research idea posted',
        created_at: i.created_at,
      })),
      ...(teamsActivityResult.data || []).map(t => ({
        id: `team-${t.id}`,
        type: 'team' as const,
        title: t.name,
        subtitle: 'Team formed',
        created_at: t.created_at,
      })),
    ]
    feed.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    setActivity(feed.slice(0, 20))
    setIsLoading(false)
  }

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'signup': return <UserPlus className="w-4 h-4 text-green-500" />
      case 'idea': return <Lightbulb className="w-4 h-4 text-yellow-500" />
      case 'team': return <Users className="w-4 h-4 text-primary" />
    }
  }

  const roleLabels: Record<string, string> = {
    student_researcher: 'Student', collaborator: 'Collaborator',
    technical_expert: 'Technical', mentor: 'Mentor', admin: 'Admin',
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-heading">Overview</h1>
        <p className="text-muted-foreground mt-1">Platform health and recent activity</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'primary', sub: `${stats.monthlyActiveUsers} MAU`, href: '/admin/users' },
          { label: 'Active Projects', value: stats.activeProjectsMonth, icon: FolderKanban, color: 'green-500', sub: 'This month', href: '/admin/analytics' },
          { label: 'Teams Formed', value: stats.teamsFormedMonth, icon: Users, color: 'cyan-500', sub: 'This month', href: '/admin/analytics' },
          { label: 'Pending Review', value: stats.pendingShowcase, icon: FileText, color: 'orange-500', sub: 'Showcase', href: '/admin/showcase' },
          { label: 'Mentor Queue', value: stats.pendingMentors, icon: Shield, color: 'yellow-500', sub: 'Verifications', href: '/admin/mentors' },
          { label: 'Monthly Active', value: stats.monthlyActiveUsers, icon: Activity, color: 'purple-400', sub: 'Last 30 days', href: '/admin/analytics' },
        ].filter((card) =>
          (card.href !== '/admin/analytics' || isFeatureEnabled('adminAnalytics')) &&
          (card.href !== '/admin/showcase' || isFeatureEnabled('adminShowcaseReview'))
        ).map(card => (
          <Link key={card.label} href={card.href}>
            <Card className="relative overflow-hidden cursor-pointer hover:border-primary/40 transition-colors">
              <CardContent className="p-4">
                <div className={`w-9 h-9 rounded-lg bg-${card.color}/10 flex items-center justify-center mb-3`}>
                  <card.icon className={`w-4.5 h-4.5 text-${card.color}`} />
                </div>
                <p className="text-2xl font-bold">{isLoading ? '-' : card.value}</p>
                <p className="text-xs font-medium mt-0.5">{card.label}</p>
                <p className="text-xs text-muted-foreground">{card.sub}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Role Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Users by Role
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(stats.roleBreakdown).sort((a, b) => b[1] - a[1]).map(([role, count]) => {
              const pct = stats.totalUsers > 0 ? Math.round((count / stats.totalUsers) * 100) : 0
              return (
                <div key={role}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground">{roleLabels[role] || role}</span>
                    <span className="font-semibold">{count} <span className="text-muted-foreground font-normal">({pct}%)</span></span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
            {Object.keys(stats.roleBreakdown).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" /> Recent Activity
            </CardTitle>
            <CardDescription>Last 20 platform events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-7 h-7 rounded-full bg-muted flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-muted rounded w-2/3" />
                      <div className="h-2.5 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                ))
              ) : activity.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No activity yet</p>
              ) : (
                activity.map(item => (
                  <div key={item.id} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                      {getActivityIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">{item.subtitle}</span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" /> {timeAgo(item.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
