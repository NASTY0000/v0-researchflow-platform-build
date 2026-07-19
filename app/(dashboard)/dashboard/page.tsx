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

const cardStyle = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(139,92,246,0.15)',
  borderRadius: '16px',
  backdropFilter: 'blur(12px)',
}

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
    ? Math.round(((akiliScore - currentTier.min) / (nextTier.min - currentTier.min)) * 100)
    : 100

  const statCards = [
    { title: "Akili Score", value: akiliScore, icon: Zap, href: "/profile", color: '#F59E0B', glow: 'rgba(245,158,11,0.25)', sub: currentTier.name },
    { title: "Connections", value: stats.connections, icon: Users, href: "/matches", color: '#06B6D4', glow: 'rgba(6,182,212,0.25)' },
    { title: "Ideas Posted", value: stats.totalIdeas, icon: Lightbulb, href: "/ideas", color: '#A855F7', glow: 'rgba(168,85,247,0.25)' },
    { title: "New Matches", value: stats.matches, icon: Sparkles, href: "/matches", color: '#EC4899', glow: 'rgba(236,72,153,0.25)' },
  ]

  const quickActions = [
    { title: "My Research Feed", description: "Personalised opportunities", icon: Sparkles, href: "/feed", color: '#8B5CF6' },
    { title: "Post Research Idea", description: "Share your research concept", icon: Lightbulb, href: "/ideas/new", color: '#7C3AED' },
    { title: "Find Collaborators", description: "Connect with researchers", icon: Users, href: "/matches", color: '#06B6D4' },
    { title: "Browse Mentors", description: "Get expert guidance", icon: BookOpen, href: "/mentors", color: '#A855F7' },
  ]

  const { pullDistance, isRefreshing, threshold } = usePullToRefresh(loadDashboard)

  if (isLoading) {
    return (
      <div className="space-y-8">
        {/* Hero banner skeleton */}
        <Skeleton className="h-44 w-full rounded-2xl" />
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
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
      <div className="relative rounded-2xl overflow-hidden p-8" style={{ background: 'linear-gradient(135deg,#1E0533 0%,#050118 100%)', border: '1px solid rgba(139,92,246,0.2)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 20% 50%,rgba(124,58,237,0.2),transparent 60%)' }} />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-1"
          >
            <p className="text-xs text-muted-foreground mb-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            <h1 className="text-3xl font-bold font-heading" style={{ letterSpacing: '-0.03em' }}>
              {getGreeting()}, {profile?.full_name?.split(' ')[0] || 'Researcher'}
            </h1>
            <p className="text-muted-foreground">Here&apos;s what&apos;s happening with your research journey</p>
          </motion.div>
          <Button asChild style={{ background: 'linear-gradient(135deg,#7C3AED,#A855F7)', boxShadow: '0 0 20px rgba(124,58,237,0.35)', border: 'none', borderRadius: '8px', flexShrink: 0 }}>
            <Link href="/ideas/new">
              <Lightbulb className="mr-2 h-4 w-4" />
              Post New Idea
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <Link key={stat.title} href={stat.href}>
            <div
              className={`stat-card p-5 rounded-2xl cursor-pointer animate-fade-up stagger-${i + 1}`}
              style={{
                ...cardStyle,
                '--card-accent-border': `${stat.color}66`,
                '--card-accent-glow': `0 0 24px ${stat.glow}`,
              } as React.CSSProperties}
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl flex-shrink-0" style={{ background: `${stat.color}18`, border: `1px solid ${stat.color}30` }}>
                  <stat.icon className="h-5 w-5" style={{ color: stat.color }} />
                </div>
                <div className="min-w-0">
                  <AnimatedCounter value={stat.value} className="text-2xl font-bold font-heading stat-number" />
                  <p className="text-xs truncate text-muted-foreground">
                    {'sub' in stat && stat.sub ? stat.sub : stat.title}
                  </p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Akili tier progress */}
      {profile && nextTier && (
        <div className="rounded-2xl p-5" style={cardStyle}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4" style={{ color: '#F59E0B' }} />
              <span className="text-sm font-semibold">{currentTier.name}</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', color: '#F59E0B' }}>{tierPct}%</span>
            </div>
            <span className="text-xs text-muted-foreground">
              <span className="font-medium" style={{ color: '#F59E0B' }}>{pointsLeft.toLocaleString()}</span> pts to {nextTier.name}
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg,#D97706,#F59E0B,#FCD34D)' }}
              initial={shouldReduceMotion ? { width: `${tierPct}%` } : { width: 0 }}
              animate={{ width: `${tierPct}%` }}
              transition={shouldReduceMotion ? { duration: 0 } : { duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
            />
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, i) => (
            <Link key={action.title} href={action.href}>
              <div
                className={`action-card p-5 rounded-2xl cursor-pointer text-center animate-fade-up stagger-${i + 1}`}
                style={cardStyle}
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: `${action.color}20`, border: `1px solid ${action.color}35` }}>
                  <action.icon className="h-5 w-5" style={{ color: action.color }} />
                </div>
                <h3 className="font-medium text-sm">{action.title}</h3>
                <p className="text-xs mt-1 text-muted-foreground">{action.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Ideas */}
        <div className="rounded-2xl p-6" style={cardStyle}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-semibold font-heading">Recent Ideas</h2>
              <p className="text-xs mt-0.5 text-muted-foreground">Latest from the community</p>
            </div>
            <Button variant="ghost" size="sm" asChild style={{ color: '#A855F7' }}>
              <Link href="/ideas">View all <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </div>
          <div className="space-y-3">
            {recentIdeas.length > 0 ? recentIdeas.map((idea) => (
              <Link key={idea.id} href={`/ideas/${idea.id}`}>
                <div className="list-row p-4 rounded-xl cursor-pointer"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(139,92,246,0.12)' }}>
                  <h4 className="font-medium text-sm truncate">{idea.title}</h4>
                  <p className="text-xs mt-1 line-clamp-2 text-muted-foreground">{idea.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.25)', color: '#C084FC' }}>{idea.research_area}</span>
                    <span className="text-xs flex items-center gap-1 text-muted-foreground">
                      <TrendingUp className="h-3 w-3" />{idea.upvotes} upvotes
                    </span>
                  </div>
                </div>
              </Link>
            )) : (
              <div className="text-center py-10">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
                  <Lightbulb className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">No ideas yet</p>
                <Button variant="link" asChild style={{ color: '#A855F7' }}><Link href="/ideas/new">Post the first idea</Link></Button>
              </div>
            )}
          </div>
        </div>

        {/* Suggested Matches */}
        <div className="rounded-2xl p-6" style={cardStyle}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-semibold font-heading">Suggested Matches</h2>
              <p className="text-xs mt-0.5 text-muted-foreground">Researchers you might connect with</p>
            </div>
            <Button variant="ghost" size="sm" asChild style={{ color: '#A855F7' }}>
              <Link href="/matches">View all <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </div>
          <div className="space-y-3">
            {matches.length > 0 ? matches.map((match) => {
              const score = Math.round(Number(match.match_score))
              const isHighMatch = score > 80
              return (
                <div key={match.id} className="list-row p-4 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(139,92,246,0.12)' }}>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={(match as any).matched_user?.avatar_url} />
                      <AvatarFallback style={{ background: 'linear-gradient(135deg,#7C3AED,#A855F7)', color: '#F3F0FF', fontSize: '14px' }}>
                        {(match as any).matched_user?.full_name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm">{(match as any).matched_user?.full_name}</h4>
                      <p className="text-xs truncate text-muted-foreground">{(match as any).matched_user?.department || "Researcher"}</p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold match-pill ${isHighMatch ? 'match-pill-high' : ''}`}
                      style={{ background: isHighMatch ? 'rgba(124,58,237,0.2)' : 'rgba(124,58,237,0.1)', color: isHighMatch ? '#C084FC' : '#A855F7' }}>
                      {score}%
                    </span>
                  </div>
                </div>
              )
            }) : (
              <div className="text-center py-10">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
                  <Users className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">Complete your profile to get matches</p>
                <Button variant="link" asChild style={{ color: '#A855F7' }}><Link href="/settings">Update profile</Link></Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Live Activity Feed */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            Live Activity
          </h2>
        </div>
        <div className="rounded-2xl p-2" style={cardStyle}>
          <ActivityFeed />
        </div>
      </div>

      {/* Mentor Dashboard Section */}
      {profile?.roles?.includes('mentor') && (
        <div className="rounded-2xl p-6" style={cardStyle}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#7C3AED,#A855F7)', boxShadow: '0 0 14px rgba(124,58,237,0.3)' }}>
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold font-heading">Mentor Dashboard</h2>
              <p className="text-xs text-muted-foreground">Manage your mentorship activities</p>
            </div>
          </div>
          <MentorDashboard userId={profile.id} />
        </div>
      )}

      {/* Research Progress */}
      {profile && (
        <div className="rounded-2xl p-6" style={cardStyle}>
          <h2 className="font-semibold font-heading mb-1">Your Research Progress</h2>
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
                  <span className="font-medium" style={{ color: '#C084FC' }}>{item.display}</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${item.value}%`, background: 'linear-gradient(90deg,#7C3AED,#06B6D4)', boxShadow: '2px 0 8px rgba(124,58,237,0.5)' }} />
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
