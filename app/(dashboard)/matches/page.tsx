"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { BackToHub } from "@/components/ui/back-to-hub"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  Sparkles,
  UserPlus,
  X,
  MessageSquare,
  GraduationCap,
  Building2,
  Clock,
  Target,
  Loader2,
  RefreshCw,
  Users,
  BookOpen,
  FolderOpen,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Match, Profile, Team } from "@/lib/types/database"
import { AkiliScoreBadge } from "@/components/akili/AkiliScoreBadge"
import { VerifiedBadge } from "@/components/ui/VerifiedBadge"
import { ContextualHint } from "@/components/ui/ContextualHint"
import { EmptyState } from "@/components/ui/EmptyState"
import { MatchCardSkeleton } from "@/components/ui/SkeletonLayouts"
import { usePullToRefresh } from "@/hooks/usePullToRefresh"
import { PullToRefreshIndicator } from "@/components/ui/PullToRefreshIndicator"
import { StaggerContainer, StaggerItem } from "@/components/ui/stagger-container"
import { HoverCardLift } from "@/components/ui/hover-card-lift"
import { toast } from "sonner"
import { JoinRequestModal } from "@/components/projects/join-request-modal"
import { requestToJoinProject } from "@/lib/actions/projects"

// ── Project recruiting types ──────────────────────────────────────────────────
interface RecruitingProject {
  id: string
  title: string
  description: string | null
  research_area: string | null
  status: string
  updated_at: string
  team_id: string
  team: (Team & {
    leader_id: string
    leader: Profile | null
    team_members: { user_id: string }[]
  }) | null
  _score: number
}

// ── Scoring helper, same weighted approach as computeMentorMatches ────────────
// researchScore * 0.60 + skillsScore * 0.30 + recencyScore * 0.10
function scoreProject(
  project: Omit<RecruitingProject, '_score'>,
  viewerInterests: string[],
  viewerSkills: string[],
  newestMs: number,
  oldestMs: number,
): number {
  const area = (project.research_area ?? '').toLowerCase()
  const text = `${project.title} ${project.description ?? ''}`.toLowerCase()

  // Research alignment, mirrors the exact/partial logic in computeMentorMatches
  let researchScore = 0
  for (const interest of viewerInterests) {
    const i = interest.toLowerCase()
    if (area === i) { researchScore = 1.0; break }
    if (area.includes(i) || i.includes(area)) researchScore = Math.max(researchScore, 0.5)
  }

  // Skills relevance, viewer skills that appear in title/description
  let skillHits = 0
  for (const skill of viewerSkills) {
    if (text.includes(skill.toLowerCase())) skillHits++
  }
  const skillsScore = viewerSkills.length > 0 ? Math.min(skillHits / viewerSkills.length, 1.0) : 0

  // Recency, normalised within the result window
  const updatedMs = new Date(project.updated_at).getTime()
  const range = newestMs - oldestMs
  const recencyScore = range > 0 ? (updatedMs - oldestMs) / range : 1.0

  return researchScore * 0.60 + skillsScore * 0.30 + recencyScore * 0.10
}

interface MatchWithProfile extends Match {
  matched_user: Profile
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<MatchWithProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedMatch, setSelectedMatch] = useState<MatchWithProfile | null>(null)
  const [connectionMessage, setConnectionMessage] = useState("")
  const [isConnecting, setIsConnecting] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [collabInterestsSent, setCollabInterestsSent] = useState<Set<string>>(new Set())
  const [interestToast, setInterestToast] = useState<string | null>(null)
  const [verifiedOnly, setVerifiedOnly] = useState(false)

  // Projects recruiting state
  const [recruitingProjects, setRecruitingProjects] = useState<RecruitingProject[]>([])
  const [projectsLoading, setProjectsLoading] = useState(false)
  const [joinTarget, setJoinTarget] = useState<RecruitingProject | null>(null)
  const [joinRequestsSent, setJoinRequestsSent] = useState<Set<string>>(new Set())
  const [viewerProfile, setViewerProfile] = useState<{ interests: string[]; skills: string[] }>({ interests: [], skills: [] })
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    loadMatches()
    loadRecruitingProjects()
  }, [])

  async function loadRecruitingProjects() {
    setProjectsLoading(true)
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setProjectsLoading(false); return }
    setCurrentUserId(user.id)

    // Load viewer profile for scoring
    const { data: profile } = await supabase
      .from('profiles')
      .select('research_interests, skills')
      .eq('id', user.id)
      .single()

    const interests: string[] = (profile?.research_interests as string[] | null) ?? []
    const skills: string[]    = (profile?.skills           as string[] | null) ?? []
    setViewerProfile({ interests, skills })

    // Load viewer's current team memberships to exclude projects they're already in
    const { data: memberships } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', user.id)
    const myTeamIds = new Set((memberships ?? []).map((m: { team_id: string }) => m.team_id))

    // Load all public recruiting projects
    const { data: raw } = await supabase
      .from('projects')
      .select(`
        id, title, description, research_area, status, updated_at, team_id,
        team:teams(
          leader_id,
          leader:profiles!teams_leader_id_fkey(id, full_name, avatar_url, department),
          team_members(user_id)
        )
      `)
      .eq('is_public', true)
      .eq('is_open_to_collaborators', true)
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(50)

    const projects = ((raw ?? []) as unknown as Omit<RecruitingProject, '_score'>[])
      .filter(p => !myTeamIds.has(p.team_id))

    if (projects.length === 0) { setRecruitingProjects([]); setProjectsLoading(false); return }

    const timestamps = projects.map(p => new Date(p.updated_at).getTime())
    const newestMs = Math.max(...timestamps)
    const oldestMs = Math.min(...timestamps)

    const scored: RecruitingProject[] = projects.map(p => ({
      ...p,
      _score: scoreProject(p, interests, skills, newestMs, oldestMs),
    }))

    scored.sort((a, b) => b._score - a._score)
    setRecruitingProjects(scored)

    // Also load existing join requests so we can pre-populate sent state
    const { data: existingRequests } = await supabase
      .from('project_join_requests')
      .select('project_id')
      .eq('requester_id', user.id)
      .in('status', ['pending', 'accepted'])
    const sent = new Set((existingRequests ?? []).map((r: { project_id: string }) => r.project_id))
    setJoinRequestsSent(sent)

    setProjectsLoading(false)
  }

  async function handleJoinRequest(message: string, skillsOffered: string[]) {
    if (!joinTarget) return null
    const result = await requestToJoinProject(joinTarget.id, message, skillsOffered)
    if ('error' in result && result.error) return result.error
    setJoinRequestsSent(prev => new Set([...prev, joinTarget.id]))
    setJoinTarget(null)
    toast.success('Request sent! The team lead will review it.')
    return null
  }

  async function loadMatches() {
    setIsLoading(true)
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from("matches")
      .select(`
        *,
        matched_user:profiles!matches_matched_user_id_fkey(*)
      `)
      .eq("user_id", user.id)
      .neq("status", "dismissed")
      .order("match_score", { ascending: false })

    if (data && !error) {
      setMatches(data)
    }

    setIsLoading(false)
  }

  async function generateMatches() {
    setIsGenerating(true)
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get current user's profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (!profile) {
      setIsGenerating(false)
      return
    }

    // Find potential matches based on skills and interests
    const { data: potentialMatches } = await supabase
      .from("profiles")
      .select("*")
      .neq("id", user.id)
      .eq("public_profile", true)
      .eq("onboarding_completed", true)
      .limit(20)

    if (!potentialMatches) {
      setIsGenerating(false)
      return
    }

    // Calculate match scores
    for (const candidate of potentialMatches) {
      // Simple matching algorithm
      let score = 0
      const matchingSkills: string[] = []
      const matchingTags: string[] = []

      // Check for skill overlaps (they have skills we're looking for)
      for (const skill of candidate.skills || []) {
        if ((profile.looking_for || []).includes(skill) || (profile.research_interests || []).includes(skill)) {
          score += 15
          matchingSkills.push(skill)
        }
      }

      // Check for interest overlaps
      for (const interest of candidate.research_interests || []) {
        if ((profile.research_interests || []).includes(interest)) {
          score += 10
          matchingTags.push(interest)
        }
      }

      // Same university bonus
      if (candidate.university_id && candidate.university_id === profile.university_id) {
        score += 10
      }

      // Same department bonus
      if (candidate.department && candidate.department === profile.department) {
        score += 5
      }

      // Only create match if score is above threshold
      if (score >= 20) {
        const matchType = candidate.roles?.includes("mentor") ? "mentor" : "collaborator"

        // Insert or update match
        await supabase.from("matches").upsert(
          {
            user_id: user.id,
            matched_user_id: candidate.id,
            match_type: matchType,
            match_score: Math.min(score, 100),
            matching_skills: matchingSkills.slice(0, 5),
            matching_tags: matchingTags.slice(0, 5),
            reason: `${matchingSkills.length} matching skills, ${matchingTags.length} shared interests`,
            status: "suggested",
          },
          {
            onConflict: "user_id,matched_user_id,match_type",
          }
        )
      }
    }

    // Reload matches
    await loadMatches()
    setIsGenerating(false)
  }

  async function handleConnect() {
    if (!selectedMatch) return

    setIsConnecting(true)
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    try {
      // Create connection request
      await supabase.from("connections").insert({
        requester_id: user.id,
        recipient_id: selectedMatch.matched_user_id,
        connection_type: selectedMatch.match_type === "mentor" ? "mentorship" : "collaboration",
        message: connectionMessage || `I'd like to connect with you!`,
        status: "pending",
      })

      // Update match status
      await supabase
        .from("matches")
        .update({ status: "contacted" })
        .eq("id", selectedMatch.id)

      // Create notification, fetch sender name first
      const { data: senderProfile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
      const senderName = senderProfile?.full_name || 'A researcher'
      const msgPreview = connectionMessage
        ? ` "${connectionMessage.slice(0, 80)}${connectionMessage.length > 80 ? '…' : ''}"`
        : ''
      await supabase.from("notifications").insert({
        user_id: selectedMatch.matched_user_id,
        type: "connection_request",
        title: `${senderName} wants to connect`,
        message: `They sent you a connection request${msgPreview}. Accept or decline in your network.`,
        link: "/network",
      })

      setSelectedMatch(null)
      setConnectionMessage("")
      toast.success('Connection request sent!')
      loadMatches()
    } catch (err) {
      console.error("Error connecting:", err)
      toast.error('Failed to send request. Please try again.')
    }

    setIsConnecting(false)
  }

  async function handleCollabInterest(match: MatchWithProfile) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: myProfile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
    const myName = myProfile?.full_name || 'A researcher'

    await supabase.from('collaboration_interests').insert({
      from_user_id: user.id,
      to_user_id: match.matched_user_id,
    }).then(() => {})

    await supabase.from('notifications').insert({
      user_id: match.matched_user_id,
      type: 'collaboration_interest',
      title: `${myName} is interested in collaborating`,
      message: `${myName} flagged your profile as a potential collaboration match. Check their profile and say hi!`,
      link: `/profile/${user.id}`,
      is_read: false,
    }).then(() => {})

    setCollabInterestsSent(prev => new Set([...prev, match.matched_user_id]))
    setInterestToast(`Interest sent to ${match.matched_user?.full_name?.split(' ')[0] || 'researcher'}!`)
    setTimeout(() => setInterestToast(null), 3000)
  }

  async function dismissMatch(matchId: string) {
    const supabase = createClient()
    await supabase.from("matches").update({ status: "dismissed" }).eq("id", matchId)
    setMatches(matches.filter((m) => m.id !== matchId))
  }

  const filteredMatches = matches.filter((match) => {
    if (activeTab === "collaborators" && match.match_type !== "collaborator") return false
    if (activeTab === "mentors" && match.match_type !== "mentor") return false
    if (verifiedOnly && !match.matched_user?.is_verified) return false
    return true
  })

  const { pullDistance, isRefreshing, threshold } = usePullToRefresh(async () => { await loadMatches() })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <MatchCardSkeleton key={i} />)}
        </div>
      </div>
    )
  }

  return (
    <>
    <PullToRefreshIndicator pullDistance={pullDistance} threshold={threshold} isRefreshing={isRefreshing} />
    <div className="space-y-6">
      <BackToHub href="/collaborate" label="Back to Collaborate" />
      <ContextualHint
        hintKey="hint_collaborators"
        icon="🤝"
        title="Smart Matching is working for you"
        description="These researchers were matched to your profile based on shared interests, complementary skills, and research goals. The more complete your profile, the better your matches."
      />
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            Smart Matches
          </h1>
          <p className="text-muted-foreground mt-1">
            AI-powered recommendations for collaborators and mentors
          </p>
        </div>
        <Button onClick={generateMatches} disabled={isGenerating}>
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Finding matches...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Matches
            </>
          )}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); if (v === 'projects' && recruitingProjects.length === 0 && !projectsLoading) loadRecruitingProjects() }}>
        <div className="flex items-center justify-between flex-wrap gap-2">
        <TabsList>
          <TabsTrigger value="all" className="gap-2">
            <Sparkles className="h-4 w-4" />
            All ({matches.length})
          </TabsTrigger>
          <TabsTrigger value="collaborators" className="gap-2">
            <Users className="h-4 w-4" />
            Collaborators ({matches.filter((m) => m.match_type === "collaborator").length})
          </TabsTrigger>
          <TabsTrigger value="mentors" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Mentors ({matches.filter((m) => m.match_type === "mentor").length})
          </TabsTrigger>
          <TabsTrigger value="projects" className="gap-2">
            <FolderOpen className="h-4 w-4" />
            Projects recruiting
            {recruitingProjects.length > 0 && (
              <span className="ml-0.5">({recruitingProjects.length})</span>
            )}
          </TabsTrigger>
        </TabsList>
        <button
          onClick={() => setVerifiedOnly(!verifiedOnly)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
            verifiedOnly
              ? 'bg-primary/15 border-primary/40 text-primary'
              : 'bg-muted/30 border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          <svg viewBox="0 0 24 24" width={12} height={12} fill="none">
            <path d="M12 2L3 6.5V12c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V6.5L12 2Z" fill="currentColor" fillOpacity="0.9" />
            <path d="M8.5 12L10.5 14L15.5 9" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Verified only
        </button>
        </div>

        {/* ── Projects recruiting tab content ── */}
        <TabsContent value="projects" className="mt-6">
          {projectsLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <MatchCardSkeleton key={i} />)}
            </div>
          ) : recruitingProjects.length > 0 ? (
            <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recruitingProjects.map(project => {
                const team = project.team as RecruitingProject['team']
                const leader = team?.leader as Profile | null
                const memberCount = team?.team_members?.length ?? 0
                const area = project.research_area
                const alreadySent = joinRequestsSent.has(project.id)

                // Highlight viewer skills that appear in the project text
                const text = `${project.title} ${project.description ?? ''}`.toLowerCase()
                const matchingSkills = viewerProfile.skills.filter(s => text.includes(s.toLowerCase()))

                // Relevance badge: score ≥ 0.3 → "Matches your interests"
                const isRelevant = project._score >= 0.3

                return (
                  <StaggerItem key={project.id}>
                  <HoverCardLift>
                  <Card className="hover:border-primary/50 transition-colors group h-full flex flex-col">
                    <CardContent className="p-5 flex flex-col flex-1 gap-4">
                      {/* Header: title + relevance badge */}
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <Link href={`/projects/${project.id}`} className="hover:text-primary transition-colors">
                            <h3 className="font-semibold text-sm leading-snug line-clamp-2">{project.title}</h3>
                          </Link>
                          {isRelevant && (
                            <Badge variant="outline" className="shrink-0 text-[10px] px-1.5 py-0 border-primary/40 text-primary bg-primary/5">
                              <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                              Match
                            </Badge>
                          )}
                        </div>
                        {area && (
                          <Badge variant="secondary" className="text-xs w-fit">{area}</Badge>
                        )}
                      </div>

                      {/* Research aim, 2-line truncation */}
                      {project.description && (
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                          {project.description}
                        </p>
                      )}

                      {/* Skills from viewer profile that match the project text */}
                      {viewerProfile.skills.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            Your relevant skills
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {viewerProfile.skills.slice(0, 6).map(skill => {
                              const highlighted = matchingSkills.includes(skill)
                              return (
                                <span
                                  key={skill}
                                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors
                                    ${highlighted
                                      ? 'bg-primary/12 border-primary/40 text-primary'
                                      : 'border-border text-muted-foreground'
                                    }`}
                                >
                                  {skill}
                                </span>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Team info */}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-auto">
                        {leader && (
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Avatar className="h-5 w-5 shrink-0">
                              <AvatarImage src={leader.avatar_url || undefined} />
                              <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                                {leader.full_name?.charAt(0) ?? '?'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate">{leader.full_name}</span>
                          </div>
                        )}
                        <span className="flex items-center gap-1 shrink-0 ml-auto">
                          <Users className="h-3 w-3" />
                          {memberCount} {memberCount === 1 ? 'member' : 'members'}
                        </span>
                      </div>

                      {/* CTA */}
                      {alreadySent ? (
                        <Button size="sm" variant="outline" disabled className="w-full gap-1.5 text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          Request pending
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className="w-full gap-1.5"
                          onClick={() => setJoinTarget(project)}
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                          Request to Join
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                  </HoverCardLift>
                  </StaggerItem>
                )
              })}
            </StaggerContainer>
          ) : (
            <EmptyState
              icon="🔬"
              title="No projects are recruiting right now"
              description="Check back soon, or start your own project and invite collaborators."
              ctaLabel="Create a project"
              ctaHref="/projects/new"
            />
          )}
        </TabsContent>

        <TabsContent value={activeTab === 'projects' ? '__never__' : activeTab} className="mt-6">
          {filteredMatches.length > 0 ? (
            <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMatches.map((match) => (
                <StaggerItem key={match.id}>
                <HoverCardLift>
                <Card className="hover:border-primary/50 transition-colors group h-full">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Link href={`/profile/${match.matched_user_id}`}>
                          <Avatar className="h-14 w-14 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all">
                            <AvatarImage src={match.matched_user?.avatar_url || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary text-lg">
                              {match.matched_user?.full_name?.charAt(0) || "?"}
                            </AvatarFallback>
                          </Avatar>
                        </Link>
                        <div>
                          <Link href={`/profile/${match.matched_user_id}`} className="hover:text-primary transition-colors">
                            <h3 className="font-semibold flex items-center gap-1.5">
                              {match.matched_user?.full_name}
                              {match.matched_user?.is_verified && (
                                <VerifiedBadge universityName={match.matched_user?.university_name} size="sm" />
                              )}
                            </h3>
                          </Link>
                          <p className="text-sm text-muted-foreground">
                            {match.matched_user?.department || "Researcher"}
                          </p>
                          <div className="mt-1">
                            <AkiliScoreBadge score={match.matched_user?.akili_score || 0} />
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => dismissMatch(match.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Match Score */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Match Score</span>
                        <span className="font-semibold text-primary">{Math.round(Number(match.match_score))}%</span>
                      </div>
                      <Progress value={Number(match.match_score)} className="h-2" />
                    </div>

                    {/* Info */}
                    <div className="space-y-2 mb-4 text-sm">
                      {match.matched_user?.university_id && (
                        <p className="flex items-center gap-2 text-muted-foreground">
                          <Building2 className="h-4 w-4" />
                          {match.matched_user.university_id}
                        </p>
                      )}
                      {match.matched_user?.academic_level && (
                        <p className="flex items-center gap-2 text-muted-foreground">
                          <GraduationCap className="h-4 w-4" />
                          {match.matched_user.academic_level.charAt(0).toUpperCase() +
                            match.matched_user.academic_level.slice(1)}
                        </p>
                      )}
                    </div>

                    {/* Matching Skills */}
                    {match.matching_skills && match.matching_skills.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          Matching Skills
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {match.matching_skills.slice(0, 3).map((skill) => (
                            <Badge key={skill} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {match.matching_skills.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{match.matching_skills.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Match Type Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <Badge
                        variant="outline"
                        className={
                          match.match_type === "mentor"
                            ? "border-yellow-500/30 text-yellow-500"
                            : "border-primary/30 text-primary"
                        }
                      >
                        {match.match_type === "mentor" ? "Potential Mentor" : "Potential Collaborator"}
                      </Badge>
                      {match.status === "contacted" && (
                        <Badge variant="secondary">Contacted</Badge>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        className="flex-1"
                        onClick={() => setSelectedMatch(match)}
                        disabled={match.status === "contacted"}
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        Connect
                      </Button>
                      <Button variant="outline" asChild>
                        <Link href={`/profile/${match.matched_user_id}`}>
                          View
                        </Link>
                      </Button>
                    </div>
                    {match.match_type !== "mentor" && (
                      <button
                        onClick={() => handleCollabInterest(match)}
                        disabled={collabInterestsSent.has(match.matched_user_id)}
                        className="mt-2 w-full h-9 rounded-xl text-xs font-semibold transition-all"
                        style={
                          collabInterestsSent.has(match.matched_user_id)
                            ? { background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#34D399', cursor: 'default' }
                            : { background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(139,92,246,0.2)', color: '#A855F7' }
                        }
                      >
                        {collabInterestsSent.has(match.matched_user_id) ? '✓ Interest sent' : '🤝 Interested in collaborating'}
                      </button>
                    )}
                  </CardContent>
                </Card>
                </HoverCardLift>
                </StaggerItem>
              ))}
            </StaggerContainer>
          ) : (
            <EmptyState
              icon={
                <svg viewBox="0 0 24 24" width="28" height="28">
                  <circle cx="5" cy="12" r="3" fill="#8B5CF6"/>
                  <circle cx="19" cy="12" r="3" fill="#A855F7"/>
                  <path d="M8 12Q12 5 16 12" stroke="#FBBF24" strokeWidth="2" fill="none" strokeLinecap="round"/>
                  <circle cx="12" cy="6" r="2" fill="#FBBF24"/>
                </svg>
              }
              title="Your research network starts with one connection"
              description="Complete your profile and click Refresh Matches to find collaborators and mentors."
              ctaLabel="Complete Your Profile"
              ctaHref="/profile"
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Interest sent toast */}
      {interestToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] px-5 py-3 rounded-2xl text-sm font-semibold shadow-xl animate-in slide-in-from-bottom-2 duration-300"
          style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#34D399', backdropFilter: 'blur(16px)' }}>
          🤝 {interestToast}
        </div>
      )}

      {/* Join Request Modal */}
      <JoinRequestModal
        open={!!joinTarget}
        projectTitle={joinTarget?.title ?? ''}
        userSkills={viewerProfile.skills}
        onConfirm={handleJoinRequest}
        onCancel={() => setJoinTarget(null)}
      />

      {/* Connect Dialog */}
      <Dialog open={!!selectedMatch} onOpenChange={() => setSelectedMatch(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect with {selectedMatch?.matched_user?.full_name}</DialogTitle>
            <DialogDescription>
              Send a personalized message to introduce yourself and explain why you&apos;d like to connect.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Hi! I noticed we share similar research interests..."
            value={connectionMessage}
            onChange={(e) => setConnectionMessage(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedMatch(null)}>
              Cancel
            </Button>
            <Button onClick={handleConnect} disabled={isConnecting}>
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Send Connection Request
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </>
  )
}
