"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import {
  Lightbulb,
  Users,
  FolderKanban,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Clock,
  Target,
  BookOpen,
  MessageSquare,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Profile, ResearchIdea, Project, Match } from "@/lib/types/database"

interface DashboardStats {
  totalIdeas: number
  activeProjects: number
  connections: number
  matches: number
}

interface RecentActivity {
  id: string
  type: "idea" | "project" | "connection" | "message"
  title: string
  description: string
  timestamp: string
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState<DashboardStats>({
    totalIdeas: 0,
    activeProjects: 0,
    connections: 0,
    matches: 0,
  })
  const [recentIdeas, setRecentIdeas] = useState<ResearchIdea[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadDashboard() {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Load profile
      const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      if (profileData) {
        setProfile(profileData)
      }

      // Load stats
      const [ideasCount, projectsCount, connectionsCount, matchesCount] = await Promise.all([
        supabase.from("research_ideas").select("id", { count: "exact", head: true }).eq("author_id", user.id),
        supabase.from("team_members").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase
          .from("connections")
          .select("id", { count: "exact", head: true })
          .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
          .eq("status", "accepted"),
        supabase.from("matches").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      ])

      setStats({
        totalIdeas: ideasCount.count || 0,
        activeProjects: projectsCount.count || 0,
        connections: connectionsCount.count || 0,
        matches: matchesCount.count || 0,
      })

      // Load recent ideas
      const { data: ideasData } = await supabase
        .from("research_ideas")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(3)

      if (ideasData) {
        setRecentIdeas(ideasData)
      }

      // Load matches
      const { data: matchesData } = await supabase
        .from("matches")
        .select("*, matched_user:profiles!matches_matched_user_id_fkey(*)")
        .eq("user_id", user.id)
        .eq("status", "suggested")
        .order("match_score", { ascending: false })
        .limit(3)

      if (matchesData) {
        setMatches(matchesData)
      }

      setIsLoading(false)
    }

    loadDashboard()
  }, [])

  const statCards = [
    {
      title: "Research Ideas",
      value: stats.totalIdeas,
      icon: Lightbulb,
      href: "/ideas",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Active Projects",
      value: stats.activeProjects,
      icon: FolderKanban,
      href: "/projects",
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "Connections",
      value: stats.connections,
      icon: Users,
      href: "/network",
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Matches",
      value: stats.matches,
      icon: Sparkles,
      href: "/matches",
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
    },
  ]

  const quickActions = [
    {
      title: "Post Research Idea",
      description: "Share your research concept",
      icon: Lightbulb,
      href: "/ideas/new",
      color: "gradient-primary",
    },
    {
      title: "Find Collaborators",
      description: "Connect with researchers",
      icon: Users,
      href: "/matches",
      color: "bg-accent",
    },
    {
      title: "Browse Mentors",
      description: "Get expert guidance",
      icon: BookOpen,
      href: "/mentors",
      color: "bg-green-600",
    },
    {
      title: "Task Marketplace",
      description: "Find or post tasks",
      icon: Target,
      href: "/marketplace",
      color: "bg-yellow-600",
    },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading">Welcome back, {profile?.full_name?.split(" ")[0] || "Researcher"}!</h1>
          <p className="text-muted-foreground mt-1">Here&apos;s what&apos;s happening with your research journey</p>
        </div>
        <Button asChild>
          <Link href="/ideas/new">
            <Lightbulb className="mr-2 h-4 w-4" />
            Post New Idea
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold font-heading mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link key={action.title} href={action.href}>
              <Card className="hover:border-primary/50 transition-all hover:-translate-y-1 cursor-pointer h-full">
                <CardContent className="p-6 text-center">
                  <div className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center mx-auto mb-3`}>
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-medium">{action.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{action.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Ideas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-heading">Recent Ideas</CardTitle>
              <CardDescription>Latest research ideas from the community</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/ideas">
                View all
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentIdeas.length > 0 ? (
              recentIdeas.map((idea) => (
                <Link key={idea.id} href={`/ideas/${idea.id}`}>
                  <div className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{idea.title}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{idea.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {idea.research_area}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            {idea.upvotes} upvotes
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-8">
                <Lightbulb className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground">No ideas yet</p>
                <Button variant="link" asChild className="mt-2">
                  <Link href="/ideas/new">Post the first idea</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Suggested Matches */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-heading">Suggested Matches</CardTitle>
              <CardDescription>Researchers you might want to connect with</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/matches">
                View all
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {matches.length > 0 ? (
              matches.map((match) => (
                <div key={match.id} className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={(match as any).matched_user?.avatar_url} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {(match as any).matched_user?.full_name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium">{(match as any).matched_user?.full_name}</h4>
                      <p className="text-sm text-muted-foreground truncate">
                        {(match as any).matched_user?.department || "Researcher"}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {Math.round(Number(match.match_score))}% match
                        </Badge>
                        {match.matching_skills?.slice(0, 2).map((skill) => (
                          <Badge key={skill} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      Connect
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground">Complete your profile to get matches</p>
                <Button variant="link" asChild className="mt-2">
                  <Link href="/settings/profile">Update profile</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Research Progress */}
      {profile && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-heading">Your Research Progress</CardTitle>
            <CardDescription>Track your research journey milestones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Profile Completion</span>
                  <span className="font-medium">
                    {profile.onboarding_completed ? "100%" : `${(profile.onboarding_step || 0) * 20}%`}
                  </span>
                </div>
                <Progress value={profile.onboarding_completed ? 100 : (profile.onboarding_step || 0) * 20} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Ideas Posted</span>
                  <span className="font-medium">{stats.totalIdeas} / 5</span>
                </div>
                <Progress value={Math.min((stats.totalIdeas / 5) * 100, 100)} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Connections Made</span>
                  <span className="font-medium">{stats.connections} / 10</span>
                </div>
                <Progress value={Math.min((stats.connections / 10) * 100, 100)} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
