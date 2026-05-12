"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import {
  Lightbulb, Users, FolderKanban, TrendingUp,
  ArrowRight, Sparkles, Target, BookOpen, GraduationCap,
} from "lucide-react"
import { MentorDashboard } from "@/components/dashboard/mentor-dashboard"
import { createClient } from "@/lib/supabase/client"
import type { Profile, ResearchIdea, Match } from "@/lib/types/database"

interface DashboardStats {
  totalIdeas: number
  activeProjects: number
  connections: number
  matches: number
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

  useEffect(() => {
    async function loadDashboard() {
      const supabase = createClient()
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
    }
    loadDashboard()
  }, [])

  const statCards = [
    { title: "Research Ideas", value: stats.totalIdeas, icon: Lightbulb, href: "/ideas", color: '#A855F7', glow: 'rgba(168,85,247,0.25)' },
    { title: "Active Projects", value: stats.activeProjects, icon: FolderKanban, href: "/projects", color: '#06B6D4', glow: 'rgba(6,182,212,0.25)' },
    { title: "Connections", value: stats.connections, icon: Users, href: "/matches", color: '#22C55E', glow: 'rgba(34,197,94,0.25)' },
    { title: "Matches", value: stats.matches, icon: Sparkles, href: "/matches", color: '#C084FC', glow: 'rgba(192,132,252,0.25)' },
  ]

  const quickActions = [
    { title: "Post Research Idea", description: "Share your research concept", icon: Lightbulb, href: "/ideas/new", color: '#7C3AED' },
    { title: "Find Collaborators", description: "Connect with researchers", icon: Users, href: "/matches", color: '#06B6D4' },
    { title: "Browse Mentors", description: "Get expert guidance", icon: BookOpen, href: "/mentors", color: '#A855F7' },
    { title: "Task Marketplace", description: "Find or post tasks", icon: Target, href: "/marketplace", color: '#C084FC' },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-full animate-spin mx-auto" style={{ border: '3px solid rgba(124,58,237,0.2)', borderTopColor: '#7C3AED' }} />
          <p style={{ color: '#7C6A9C' }}>Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">

      {/* Hero banner */}
      <div className="relative rounded-2xl overflow-hidden p-8" style={{ background: 'linear-gradient(135deg,#1E0533 0%,#050118 100%)', border: '1px solid rgba(139,92,246,0.2)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 20% 50%,rgba(124,58,237,0.2),transparent 60%)' }} />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="label-section mb-2">Your workspace</p>
            <h1 className="text-3xl font-bold font-heading mb-1" style={{ letterSpacing: '-0.03em' }}>
              Welcome back,{' '}
              <span className="gradient-text">{profile?.full_name?.split(" ")[0] || "Researcher"}</span>
            </h1>
            <p style={{ color: '#7C6A9C' }}>Here&apos;s what&apos;s happening with your research journey</p>
          </div>
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
            <div className={`p-5 rounded-2xl cursor-pointer transition-all duration-300 animate-fade-up stagger-${i + 1}`}
              style={{ ...cardStyle }}
              onMouseOver={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(168,85,247,0.4)'; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 24px ${stat.glow}` }}
              onMouseOut={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(139,92,246,0.15)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none' }}>
              <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-xl" style={{ background: `${stat.color}18`, border: `1px solid ${stat.color}30` }}>
                  <stat.icon className="h-5 w-5" style={{ color: stat.color }} />
                </div>
                <div>
                  <p className="text-2xl font-bold font-heading stat-number">{stat.value}</p>
                  <p className="text-xs" style={{ color: '#7C6A9C' }}>{stat.title}</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <p className="label-section mb-4">Quick Actions</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, i) => (
            <Link key={action.title} href={action.href}>
              <div className={`p-5 rounded-2xl cursor-pointer text-center transition-all duration-300 animate-fade-up stagger-${i + 1}`}
                style={{ ...cardStyle }}
                onMouseOver={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(168,85,247,0.4)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)' }}
                onMouseOut={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(139,92,246,0.15)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)' }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: `${action.color}20`, border: `1px solid ${action.color}35` }}>
                  <action.icon className="h-5 w-5" style={{ color: action.color }} />
                </div>
                <h3 className="font-medium text-sm">{action.title}</h3>
                <p className="text-xs mt-1" style={{ color: '#7C6A9C' }}>{action.description}</p>
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
              <p className="text-xs mt-0.5" style={{ color: '#7C6A9C' }}>Latest from the community</p>
            </div>
            <Button variant="ghost" size="sm" asChild style={{ color: '#A855F7' }}>
              <Link href="/ideas">View all <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </div>
          <div className="space-y-3">
            {recentIdeas.length > 0 ? recentIdeas.map((idea) => (
              <Link key={idea.id} href={`/ideas/${idea.id}`}>
                <div className="p-4 rounded-xl transition-all duration-200 cursor-pointer"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(139,92,246,0.12)' }}
                  onMouseOver={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(168,85,247,0.3)'}
                  onMouseOut={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(139,92,246,0.12)'}>
                  <h4 className="font-medium text-sm truncate">{idea.title}</h4>
                  <p className="text-xs mt-1 line-clamp-2" style={{ color: '#7C6A9C' }}>{idea.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.25)', color: '#C084FC' }}>{idea.research_area}</span>
                    <span className="text-xs flex items-center gap-1" style={{ color: '#7C6A9C' }}>
                      <TrendingUp className="h-3 w-3" />{idea.upvotes} upvotes
                    </span>
                  </div>
                </div>
              </Link>
            )) : (
              <div className="text-center py-10">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
                  <Lightbulb className="h-6 w-6" style={{ color: '#7C6A9C' }} />
                </div>
                <p className="text-sm" style={{ color: '#7C6A9C' }}>No ideas yet</p>
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
              <p className="text-xs mt-0.5" style={{ color: '#7C6A9C' }}>Researchers you might connect with</p>
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
                <div key={match.id} className="p-4 rounded-xl transition-all duration-200"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(139,92,246,0.12)' }}
                  onMouseOver={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(168,85,247,0.3)'}
                  onMouseOut={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(139,92,246,0.12)'}>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={(match as any).matched_user?.avatar_url} />
                      <AvatarFallback style={{ background: 'linear-gradient(135deg,#7C3AED,#A855F7)', color: '#F3F0FF', fontSize: '14px' }}>
                        {(match as any).matched_user?.full_name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm">{(match as any).matched_user?.full_name}</h4>
                      <p className="text-xs truncate" style={{ color: '#7C6A9C' }}>{(match as any).matched_user?.department || "Researcher"}</p>
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
                  <Users className="h-6 w-6" style={{ color: '#7C6A9C' }} />
                </div>
                <p className="text-sm" style={{ color: '#7C6A9C' }}>Complete your profile to get matches</p>
                <Button variant="link" asChild style={{ color: '#A855F7' }}><Link href="/settings">Update profile</Link></Button>
              </div>
            )}
          </div>
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
              <p className="text-xs" style={{ color: '#7C6A9C' }}>Manage your mentorship activities</p>
            </div>
          </div>
          <MentorDashboard />
        </div>
      )}

      {/* Research Progress */}
      {profile && (
        <div className="rounded-2xl p-6" style={cardStyle}>
          <h2 className="font-semibold font-heading mb-1">Your Research Progress</h2>
          <p className="text-xs mb-6" style={{ color: '#7C6A9C' }}>Track your research journey milestones</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { label: 'Profile Completion', value: profile.onboarding_completed ? 100 : (profile.onboarding_step || 0) * 20, display: profile.onboarding_completed ? '100%' : `${(profile.onboarding_step || 0) * 20}%` },
              { label: 'Ideas Posted', value: Math.min((stats.totalIdeas / 5) * 100, 100), display: `${stats.totalIdeas} / 5` },
              { label: 'Connections Made', value: Math.min((stats.connections / 10) * 100, 100), display: `${stats.connections} / 10` },
            ].map(item => (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span style={{ color: '#7C6A9C' }}>{item.label}</span>
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
    </div>
  )
}
