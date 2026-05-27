"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
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
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Match, Profile } from "@/lib/types/database"
import { AkiliScoreBadge } from "@/components/akili/AkiliScoreBadge"
import { BaobabLoader } from '@/components/ui/baobab-loader'
import { ContextualHint } from "@/components/ui/ContextualHint"
import { EmptyState } from "@/components/ui/EmptyState"

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

  useEffect(() => {
    loadMatches()
  }, [])

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

      // Create notification — fetch sender name first
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
      loadMatches()
    } catch (err) {
      console.error("Error connecting:", err)
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
    if (activeTab === "all") return true
    if (activeTab === "collaborators") return match.match_type === "collaborator"
    if (activeTab === "mentors") return match.match_type === "mentor"
    return true
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <BaobabLoader size="md" />
          <p className="text-muted-foreground">Finding your matches...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
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
      <Tabs value={activeTab} onValueChange={setActiveTab}>
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
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredMatches.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMatches.map((match) => (
                <Card key={match.id} className="hover:border-primary/50 transition-colors group">
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
                            <h3 className="font-semibold">{match.matched_user?.full_name}</h3>
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
              ))}
            </div>
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
  )
}
