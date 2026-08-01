"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import {
  Lightbulb, Users, TrendingUp,
  ArrowRight, Sparkles, Target, BookOpen, GraduationCap, Zap,
} from "lucide-react"
import { getCurrentTier, getNextTier, getPointsToNextTier } from "@/lib/utils/akili-progress"
import { MentorDashboard } from "@/components/dashboard/mentor-dashboard"
import { GettingStartedChecklist } from "@/components/dashboard/GettingStartedChecklist"
import { MilestoneToast } from "@/components/ui/MilestoneToast"
import { useMilestones } from "@/hooks/useMilestones"
import { createClient } from "@/lib/supabase/client"
import type { Profile, ResearchIdea, Match } from "@/lib/types/database"
import { Skeleton } from "@/components/ui/SkeletonLayouts"
import { usePullToRefresh } from "@/hooks/usePullToRefresh"
import { AnimatedCounter } from "@/components/ui/animated-counter"
import { motion, useReducedMotion } from "framer-motion"
import { PullToRefreshIndicator } from "@/components/ui/PullToRefreshIndicator"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { useUserState } from "@/hooks/use-user-state"

interface DashboardStats {
  totalIdeas: number
  activeProjects: number
  connections: number
  matches: number
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

// Akili tier accent. --gold is fill-only; --gold-foreground is the
// contrast-safe variant for text and icons (raw gold is 1.8:1 on white).
const GOLD = 'var(--gold)'
const GOLD_INK = 'var(--gold-foreground)'

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState<DashboardStats>({ totalIdeas: 0, activeProjects: 0, connections: 0, matches: 0 })
  const [recentIdeas, setRecentIdeas] = useState<ResearchIdea[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const { activeMilestone, clearMilestone } = useMilestones(profile)

  const loadDashboard = useCallback(async () => {
    const supabase = createClient()

    // Load from cache immediately while fetching
    try {
      const cached = localStorage.getItem('rf_dashboard_cache')
      if (cached) {
        const { profile: cachedProfile, stats: cachedStats } = JSON.parse(cached)
        if (cachedProfile) setProfile(cachedProfile)
        if (cachedStats) setStats(cachedStats)
      }
    } catch {}

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single()
    if (profileData) setProfile(profileData)

    const [ideasCount, projectsCount, connectionsCount, matchesCount] = await Promise.all([
      supabase.from("research_ideas").select("id", { count: "exact", head: true }).eq("author_id", user.id),
      supabase.from("team_members").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("connections").select("id", { count: "exact", head: true }).or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`).eq("status", "accepted"),
      supabase.from("matches").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    ])

    setStats({
      totalIdeas: ideasCount.count || 0,
      activeProjects: projectsCount.count || 0,
      connections: connectionsCount.count || 0,
      matches: matchesCount.count || 0,
    })

    const { data: ideasData } = await supabase.from("research_ideas").select("*").order("created_at", { ascending: false }).limit(3)
    if (ideasData) setRecentIdeas(ideasData)

    const { data: matchesData } = await supabase.from("matches").select("*, matched_user:profiles!matches_matched_user_id_fkey(*)").eq("user_id", user.id).eq("status", "suggested").order("match_score", { ascending: false }).limit(3)
    if (matchesData) setMatches(matchesData)

    setIsLoading(false)

    // Cache dashboard data for offline use
    try {
      localStorage.setItem('rf_dashboard_cache', JSON.stringify({
        profile: profileData,
        stats: {
          totalIdeas: ideasCount.count || 0,
          activeProjects: projectsCount.count || 0,
          connections: connectionsCount.count || 0,
          matches: matchesCount.count || 0,
        },
        timestamp: Date.now(),
      }))
    } catch {}
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const { state: userState } = useUserState(profile?.id ?? null)
  const shouldReduceMotion = useReducedMotion()

  const akiliScore = profile?.akili_score ?? 0
  const currentTier = getCurrentTier(akiliScore)
  const nextTier = getNextTier(akiliScore)
  const pointsLeft = getPointsToNextTier(akiliScore)
  const tierPct = nextTier
    ? Math.min(100, Math.max(0, Math.round(((akiliScore - currentTier.min) / (nextTier.min - currentTier.min)) * 100)))
    : 100

  const statCards = [
    { title: "Akili Score", value: akiliScore, icon: Zap, href: "/profile", color: GOLD_INK, sub: currentTier.name },
    { title: "Connections", value: stats.connections, icon: Users, href: "/matches", color: 'var(--cyan)' },
    { title: "Ideas Posted", value: stats.totalIdeas, icon: Lightbulb, href: "/ideas", color: 'var(--primary)' },
    { title: "New Matches", value: stats.matches, icon: Sparkles, href: "/matches", color: 'var(--glow)' },
  ]

  const quickActions = [
    { title: "My Research Feed", description: "Personalised opportunities", icon: Sparkles, href: "/feed", color: 'var(--glow)' },
    { title: "Post Research Idea", description: "Share your research concept", icon: Lightbulb, href: "/ideas/new", color: 'var(--primary)' },
    { title: "Find Collaborators", description: "Connect with researchers", icon: Users, href: "/matches", color: 'var(--cyan)' },
    { title: "Browse Mentors", description: "Get expert guidance", icon: BookOpen, href: "/mentors", color: 'var(--chart-5)' },
  ]

  const { pullDistance, isRefreshing, threshold } = usePullToRefresh(loadDashboard)

  if (isLoading) {
    return (
      <div className="space-y-8">
        {/* Hero banner skeleton */}
        <Skeleton className="h-44 w-full rounded-2xl" />
        {/* Stat strip */}
        <Skeleton className="h-[76px] w-full rounded-2xl" />
        {/* Quick actions */}
        <div className="grid sm:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[74px] rounded-xl" />
          ))}
        </div>
        {/* Content rows */}
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    )
  }

  return (
    <>
    <PullToRefreshIndicator pullDistance={pullDistance} threshold={threshold} isRefreshing={isRefreshing} />
    <div className="space-y-8">

      {/* Getting started checklist — new users only */}
      {profile && (
        <GettingStartedChecklist
          userId={profile.id}
          akiliScore={profile.akili_score ?? 0}
          joinedAt={profile.created_at}
          hasBio={!!profile.bio?.trim()}
        />
      )}

      {/* Hero banner */}
      <div
        className="relative rounded-2xl overflow-hidden p-8 bg-card border border-border dark:border-primary/50"
        style={{ boxShadow: 'var(--brand-glow)' }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'var(--brand-wash)' }} />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-1"
          >
            <p className="text-xs text-muted-foreground mb-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            <h1 className="text-3xl md:text-4xl font-heading" style={{ letterSpacing: '-0.03em', fontWeight: 800, textWrap: 'balance' }}>
              {getGreeting()}, {profile?.full_name?.split(' ')[0] || 'Researcher'}
            </h1>
            <p className="text-muted-foreground">Here&apos;s what&apos;s happening with your research journey</p>
          </motion.div>
          <Button asChild className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold" style={{ boxShadow: 'var(--cta-shadow)' }}>
            <Link href="/ideas/new">
              <Lightbulb className="mr-2 h-4 w-4" />
              Post New Idea
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
          {statCards.map((stat) => (
            <Link
              key={stat.title}
              href={stat.href}
              className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `color-mix(in oklch, ${stat.color} 16%, transparent)`, border: `1px solid color-mix(in oklch, ${stat.color} 30%, transparent)` }}
              >
                <stat.icon className="h-[18px] w-[18px]" style={{ color: stat.color }} />
              </div>
              <div className="min-w-0">
                <AnimatedCounter value={stat.value} className="text-2xl font-bold font-heading tabular-nums leading-none" />
                <p className="text-xs truncate text-muted-foreground mt-1">
                  {'sub' in stat && stat.sub ? `${stat.title} · ${stat.sub}` : stat.title}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Akili tier progress */}
      {profile && nextTier && (
        <div className="rounded-2xl p-5 border border-border bg-card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4" style={{ color: GOLD_INK }} />
              <span className="text-sm font-semibold">{currentTier.name}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold tabular-nums" style={{ background: 'color-mix(in oklch, var(--gold) 14%, transparent)', border: '1px solid color-mix(in oklch, var(--gold) 35%, transparent)', color: GOLD_INK }}>{tierPct}%</span>
            </div>
            <span className="text-xs text-muted-foreground">
              <span className="font-medium" style={{ color: GOLD_INK }}>{pointsLeft.toLocaleString()}</span> pts to {nextTier.name}
            </span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden bg-muted">
            <motion.div
              className="h-full rounded-full"
              style={{ background: GOLD }}
              initial={shouldReduceMotion ? { width: `${tierPct}%` } : { width: 0 }}
              animate={{ width: `${tierPct}%` }}
              transition={shouldReduceMotion ? { duration: 0 } : { duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
            />
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-heading font-bold mb-4">Quick Actions</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {quickActions.map((action, i) => (
            <Link key={action.title} href={action.href}>
              <div
                className={`action-card group flex items-center gap-3.5 p-4 rounded-xl border border-border bg-card cursor-pointer hover:border-primary/50 transition-colors animate-fade-up stagger-${i + 1}`}
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: `color-mix(in oklch, ${action.color} 16%, transparent)`, border: `1px solid color-mix(in oklch, ${action.color} 30%, transparent)` }}>
                  <action.icon className="h-5 w-5" style={{ color: action.color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-sm">{action.title}</h3>
                  <p className="text-xs mt-0.5 text-muted-foreground truncate">{action.description}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-foreground motion-reduce:transition-none motion-reduce:group-hover:translate-x-0" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Ideas */}
        <div className="rounded-2xl p-6 border border-border bg-card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold font-heading">Recent Ideas</h2>
              <p className="text-xs mt-0.5 text-muted-foreground">Latest from the community</p>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-primary dark:text-[var(--glow)] font-semibold hover:bg-primary/10">
              <Link href="/ideas">View all <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </div>
          <div className="space-y-3">
            {recentIdeas.length > 0 ? recentIdeas.map((idea) => (
              <Link key={idea.id} href={`/ideas/${idea.id}`}>
                <div className="list-row p-4 rounded-xl cursor-pointer bg-muted/30 border border-border/60 hover:border-primary/40 transition-colors">
                  <h4 className="font-medium text-sm truncate">{idea.title}</h4>
                  <p className="text-xs mt-1 line-clamp-2 text-muted-foreground">{idea.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold border border-primary/40 text-primary dark:text-[var(--glow)]" style={{ background: 'color-mix(in oklch, var(--glow) 12%, transparent)' }}>{idea.research_area}</span>
                    <span className="text-xs flex items-center gap-1 text-muted-foreground">
                      <TrendingUp className="h-3 w-3" />{idea.upvotes} upvotes
                    </span>
                  </div>
                </div>
              </Link>
            )) : (
              <div className="text-center py-10">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 bg-primary/10 border border-primary/20">
                  <Lightbulb className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">No ideas yet</p>
                <Button variant="link" asChild className="text-primary dark:text-[var(--glow)]"><Link href="/ideas/new">Post the first idea</Link></Button>
              </div>
            )}
          </div>
        </div>

        {/* Suggested Matches */}
        <div className="rounded-2xl p-6 border border-border bg-card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold font-heading">Suggested Matches</h2>
              <p className="text-xs mt-0.5 text-muted-foreground">Researchers you might connect with</p>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-primary dark:text-[var(--glow)] font-semibold hover:bg-primary/10">
              <Link href="/matches">View all <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </div>
          <div className="space-y-3">
            {matches.length > 0 ? matches.map((match) => {
              const score = Math.round(Number(match.match_score))
              const isHighMatch = score > 80
              return (
                <div key={match.id} className="list-row p-4 rounded-xl bg-muted/30 border border-border/60 hover:border-primary/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={(match as any).matched_user?.avatar_url} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                        {(match as any).matched_user?.full_name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm">{(match as any).matched_user?.full_name}</h4>
                      <p className="text-xs truncate text-muted-foreground">{(match as any).matched_user?.department || "Researcher"}</p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold tabular-nums match-pill ${isHighMatch ? 'match-pill-high' : ''}`}
                      style={{
                        background: `color-mix(in oklch, var(--primary) ${isHighMatch ? 25 : 12}%, transparent)`,
                        border: isHighMatch ? '1px solid color-mix(in oklch, var(--primary) 50%, transparent)' : '1px solid transparent',
                        color: isHighMatch ? 'var(--glow)' : 'var(--accent-foreground)',
                      }}>
                      {score}%
                    </span>
                  </div>
                </div>
              )
            }) : (
              <div className="text-center py-10">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 bg-primary/10 border border-primary/20">
                  <Users className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">Complete your profile to get matches</p>
                <Button variant="link" asChild className="text-primary dark:text-[var(--glow)]"><Link href="/settings">Update profile</Link></Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Live Activity Feed */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold font-heading flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 motion-reduce:animate-none" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            Live Activity
          </h2>
        </div>
        <div className="rounded-2xl p-2 border border-border bg-card">
          <ActivityFeed />
        </div>
      </div>

      {/* Mentor Dashboard Section */}
      {profile?.roles?.includes('mentor') && (
        <div className="rounded-2xl p-6 border border-border bg-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary" style={{ boxShadow: 'var(--brand-glow-sm)' }}>
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-heading">Mentor Dashboard</h2>
              <p className="text-xs text-muted-foreground">Manage your mentorship activities</p>
            </div>
          </div>
          <MentorDashboard userId={profile.id} />
        </div>
      )}

      {/* Research Progress */}
      {profile && (
        <div className="rounded-2xl p-6 border border-border bg-card">
          <h2 className="text-lg font-bold font-heading mb-1">Your Research Progress</h2>
          <p className="text-xs mb-6 text-muted-foreground">Track your research journey milestones</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { label: 'Profile Completion', value: userState?.profile.completion_pct ?? (profile.onboarding_completed ? 100 : (profile.onboarding_step || 0) * 20), display: `${userState?.profile.completion_pct ?? (profile.onboarding_completed ? 100 : (profile.onboarding_step || 0) * 20)}%` },
              { label: 'Ideas Posted', value: Math.min((stats.totalIdeas / 5) * 100, 100), display: `${stats.totalIdeas} / 5` },
              { label: 'Connections Made', value: Math.min((stats.connections / 10) * 100, 100), display: `${stats.connections} / 10` },
            ].map(item => (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium tabular-nums text-primary dark:text-[var(--glow)]">{item.display}</span>
                </div>
                <div className="h-2.5 rounded-full overflow-hidden bg-muted">
                  <div className="h-full rounded-full transition-all duration-700 motion-reduce:transition-none" style={{ width: `${item.value}%`, background: 'linear-gradient(90deg, var(--primary), var(--cyan))' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Milestone celebration toast */}
      {activeMilestone && (
        <MilestoneToast
          title={activeMilestone.title}
          description={activeMilestone.description}
          icon={activeMilestone.icon}
          onClose={clearMilestone}
        />
      )}
    </div>
    </>
  )
}
