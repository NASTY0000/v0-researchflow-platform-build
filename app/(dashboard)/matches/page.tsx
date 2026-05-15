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
import {
  notifyConnectionRequestAction,
  notifyMatchFoundAction,
} from "@/lib/actions/notifications"
import type { Match, Profile } from "@/lib/types/database"

interface MatchWithProfile extends Match {
  matched_user: Profile & { university?: { name: string } }
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<MatchWithProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedMatch, setSelectedMatch] = useState<MatchWithProfile | null>(null)
  const [connectionMessage, setConnectionMessage] = useState("")
  const [isConnecting, setIsConnecting] = useState(false)
  const [activeTab, setActiveTab] = useState("all")

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
        matched_user:profiles!matches_matched_user_id_fkey(
          *,
          university:universities(name)
        )
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
      .select("*, university:universities(name)")
      .neq("id", user.id)
      .eq("public_profile", true)
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

        const { data: existingMatch } = await supabase
          .from("matches")
          .select("id")
          .eq("user_id", user.id)
          .eq("matched_user_id", candidate.id)
          .eq("match_type", matchType)
          .maybeSingle()

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

        if (!existingMatch) {
          let matcherUniversity = "their institution"
          if (profile.university_id) {
            const { data: uniRow } = await supabase
              .from("universities")
              .select("name")
              .eq("id", profile.university_id)
              .maybeSingle()
            if (uniRow?.name) matcherUniversity = uniRow.name
          }
          const matcherName = (profile.full_name || "A researcher").trim() || "A researcher"
          await notifyMatchFoundAction({
            matchedUserId: candidate.id,
            matcherName,
            matcherUniversity,
          })
        }
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

      const { data: me } = await supabase.from("profiles").select("full_name").eq("id", user.id).single()
      await notifyConnectionRequestAction({
        recipientId: selectedMatch.matched_user_id,
        senderName: (me?.full_name || "Someone").trim() || "Someone",
        title: "New Connection Request",
        message: `${(me?.full_name || "Someone").trim() || "Someone"} wants to connect with you`,
      })

      setSelectedMatch(null)
      setConnectionMessage("")
      loadMatches()
    } catch (err) {
      console.error("Error connecting:", err)
    }

    setIsConnecting(false)
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
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Finding your matches...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
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
                        <Avatar className="h-14 w-14">
                          <AvatarImage src={match.matched_user?.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary text-lg">
                            {match.matched_user?.full_name?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">{match.matched_user?.full_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {match.matched_user?.department || "Researcher"}
                          </p>
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
                      {match.matched_user?.university && (
                        <p className="flex items-center gap-2 text-muted-foreground">
                          <Building2 className="h-4 w-4" />
                          {match.matched_user.university.name}
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
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Sparkles className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No matches yet</h3>
                <p className="text-muted-foreground mb-6">
                  Complete your profile and click &quot;Refresh Matches&quot; to find collaborators and mentors
                </p>
                <div className="flex gap-4 justify-center">
                  <Button onClick={generateMatches} disabled={isGenerating}>
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Finding...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Find Matches
                      </>
                    )}
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/settings/profile">Update Profile</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

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
