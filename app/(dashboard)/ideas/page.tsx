"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Lightbulb,
  Search,
  Eye,
  Clock,
  Users,
  Plus,
  ChevronUp,
  MessageSquare,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { ResearchIdea, Profile } from "@/lib/types/database"
import { formatDistanceToNow } from "date-fns"
import { EmptyState } from '@/components/ui/EmptyState'
import { ReviewBadge } from '@/components/peer-review/ReviewBadge'
import { IdeaCardSkeleton } from '@/components/ui/SkeletonLayouts'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'
import { PullToRefreshIndicator } from '@/components/ui/PullToRefreshIndicator'
import { StaggerContainer, StaggerItem } from '@/components/ui/stagger-container'
import { RippleEffect } from '@/components/ui/micro-interactions'

const RESEARCH_AREAS = [
  "All Areas",
  "Computer Science",
  "Data Science",
  "Artificial Intelligence",
  "Machine Learning",
  "Biotechnology",
  "Environmental Science",
  "Public Health",
  "Economics",
  "Social Sciences",
  "Engineering",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Medicine",
  "Agriculture",
  "Education",
  "Other",
]

const COLLABORATION_TYPES = [
  { value: "all", label: "All Types" },
  { value: "open", label: "Open Collaboration" },
  { value: "invite_only", label: "Invite Only" },
  { value: "team_based", label: "Team Based" },
]

interface IdeaWithAuthor extends ResearchIdea {
  author: Profile
  has_upvoted?: boolean
  matchScore?: number
}

function calculateMatchScore(
  userSkills: string[],
  ideaSkillsNeeded: string[],
  userDept: string,
  ideaOwnerDept: string,
): number {
  if (!ideaSkillsNeeded.length) return 0
  const matching = userSkills.filter(s => ideaSkillsNeeded.includes(s)).length
  let score = Math.round((matching / ideaSkillsNeeded.length) * 100)
  if (userDept && ideaOwnerDept && userDept === ideaOwnerDept) {
    score = Math.min(100, score + 15)
  }
  return score
}

function MatchBadge({ score }: { score: number }) {
  if (score <= 0) return null
  const [bg, color, border] =
    score >= 70
      ? ['rgba(16,185,129,0.15)', '#10B981', 'rgba(16,185,129,0.3)']
      : score >= 40
      ? ['rgba(245,158,11,0.15)', '#F59E0B', 'rgba(245,158,11,0.3)']
      : ['rgba(124,58,237,0.15)', '#A855F7', 'rgba(124,58,237,0.3)']
  return (
    <Badge
      className="text-xs font-semibold"
      style={{ background: bg, color, border: `1px solid ${border}` }}
    >
      {score}% match
    </Badge>
  )
}

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<IdeaWithAuthor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedArea, setSelectedArea] = useState("All Areas")
  const [selectedType, setSelectedType] = useState("all")
  const [sortBy, setSortBy] = useState("recent")
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [userSkills, setUserSkills] = useState<string[]>([])
  const [userDept, setUserDept] = useState("")
  const [ideaReactions, setIdeaReactions] = useState<Map<string, Set<string>>>(new Map())

  const loadIdeas = useCallback(async () => {
    setIsLoading(true)
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setCurrentUserId(user.id)
      // Fetch user profile for match scoring (only if not already loaded)
      if (userSkills.length === 0) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("skills, department")
          .eq("id", user.id)
          .single()
        if (prof) {
          setUserSkills(prof.skills || [])
          setUserDept(prof.department || "")
        }
      }
    }

    let query = supabase
      .from("research_ideas")
      .select(`
        *,
        author:profiles!research_ideas_author_id_fkey(*)
      `)
      .eq("status", "open")

    if (selectedArea !== "All Areas") {
      query = query.eq("research_area", selectedArea)
    }
    if (selectedType !== "all") {
      query = query.eq("collaboration_type", selectedType)
    }
    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
    }

    // DB-level sorting (skip for best_match — we sort client-side)
    if (sortBy === "recent") {
      query = query.order("created_at", { ascending: false })
    } else if (sortBy === "popular") {
      query = query.order("upvotes", { ascending: false })
    } else if (sortBy === "views") {
      query = query.order("views", { ascending: false })
    }

    const { data, error } = await query.limit(50)

    if (data && !error) {
      let processed = data as IdeaWithAuthor[]

      // Check upvotes
      if (user) {
        const { data: upvotes } = await supabase
          .from("idea_upvotes")
          .select("idea_id")
          .eq("user_id", user.id)
        const upvotedIds = new Set(upvotes?.map(u => u.idea_id) || [])
        processed = processed.map(idea => ({ ...idea, has_upvoted: upvotedIds.has(idea.id) }))

        // Load emoji reactions for this user
        const { data: reactions } = await supabase
          .from("idea_reactions")
          .select("idea_id, emoji")
          .eq("user_id", user.id)
        if (reactions) {
          const map = new Map<string, Set<string>>()
          for (const r of reactions) {
            if (!map.has(r.idea_id)) map.set(r.idea_id, new Set())
            map.get(r.idea_id)!.add(r.emoji)
          }
          setIdeaReactions(map)
        }
      }

      // Compute match scores using the latest skills/dept from state or freshly fetched
      const skills = userSkills
      const dept = userDept
      processed = processed.map(idea => ({
        ...idea,
        matchScore: calculateMatchScore(
          skills,
          idea.skills_needed || [],
          dept,
          (idea.author as Profile)?.department || "",
        ),
      }))

      // Client-side sort for best_match
      if (sortBy === "best_match") {
        processed = [...processed].sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
      }

      setIdeas(processed)
    }

    setIsLoading(false)
  }, [selectedArea, selectedType, searchQuery, sortBy, userSkills, userDept])

  useEffect(() => {
    loadIdeas()
  }, [loadIdeas])

  async function handleUpvote(ideaId: string, currentUpvotes: number, hasUpvoted: boolean) {
    if (!currentUserId) return
    const supabase = createClient()

    if (hasUpvoted) {
      await supabase.from("idea_upvotes").delete().eq("idea_id", ideaId).eq("user_id", currentUserId)
      await supabase.from("research_ideas").update({ upvotes: currentUpvotes - 1 }).eq("id", ideaId)
    } else {
      await supabase.from("idea_upvotes").insert({ idea_id: ideaId, user_id: currentUserId })
      await supabase.from("research_ideas").update({ upvotes: currentUpvotes + 1 }).eq("id", ideaId)
    }
    loadIdeas()
  }

  const { pullDistance, isRefreshing, threshold } = usePullToRefresh(loadIdeas)

  async function handleReaction(ideaId: string, emoji: string) {
    if (!currentUserId) return
    const supabase = createClient()

    const current = ideaReactions.get(ideaId) ?? new Set<string>()
    const alreadyReacted = current.has(emoji)

    // Optimistic update
    setIdeaReactions(prev => {
      const next = new Map(prev)
      const set = new Set(next.get(ideaId) ?? [])
      if (alreadyReacted) { set.delete(emoji) } else { set.add(emoji) }
      next.set(ideaId, set)
      return next
    })

    if (alreadyReacted) {
      await supabase.from("idea_reactions")
        .delete()
        .eq("idea_id", ideaId)
        .eq("user_id", currentUserId)
        .eq("emoji", emoji)
    } else {
      await supabase.from("idea_reactions")
        .insert({ idea_id: ideaId, user_id: currentUserId, emoji })
    }
  }

  return (
    <>
    <PullToRefreshIndicator pullDistance={pullDistance} threshold={threshold} isRefreshing={isRefreshing} />
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading">Idea Board</h1>
          <p className="text-muted-foreground mt-1">Discover and share research ideas with the community</p>
        </div>
        <Button asChild>
          <Link href="/ideas/new">
            <Plus className="mr-2 h-4 w-4" />
            Post New Idea
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search ideas..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedArea} onValueChange={setSelectedArea}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Research Area" />
              </SelectTrigger>
              <SelectContent>
                {RESEARCH_AREAS.map(area => (
                  <SelectItem key={area} value={area}>{area}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Collaboration Type" />
              </SelectTrigger>
              <SelectContent>
                {COLLABORATION_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-[160px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="views">Most Viewed</SelectItem>
                {userSkills.length > 0 && (
                  <SelectItem value="best_match">Best Match</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Ideas Grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <IdeaCardSkeleton key={i} />
          ))}
        </div>
      ) : ideas.length > 0 ? (
        <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ideas.map(idea => (
            <StaggerItem key={idea.id}>
            <Card className="hover:border-primary/50 transition-all group relative h-full">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <Link href={`/ideas/${idea.id}`}>
                      <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                        {idea.title}
                      </h3>
                    </Link>
                    {idea.review_badge && (
                      <div className="mt-1.5">
                        <ReviewBadge
                          badge={idea.review_badge}
                          reviewCount={idea.review_count}
                          averageScore={idea.average_review_score}
                          size="sm"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {idea.is_featured && (
                      <Badge variant="default" className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
                        Featured
                      </Badge>
                    )}
                    {(idea.matchScore || 0) > 0 && (
                      <MatchBadge score={idea.matchScore!} />
                    )}
                  </div>
                </div>

                <p className="text-muted-foreground text-sm line-clamp-3 mb-4">{idea.description}</p>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  <Badge variant="secondary">{idea.research_area}</Badge>
                  {idea.tags?.slice(0, 2).map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                  ))}
                  {(idea.tags?.length || 0) > 2 && (
                    <Badge variant="outline" className="text-xs">+{(idea.tags?.length || 0) - 2}</Badge>
                  )}
                </div>

                {idea.roles_needed && idea.roles_needed.length > 0 && (
                  <div className="flex items-center gap-2 mb-4 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Looking for:</span>
                    <span className="truncate">{idea.roles_needed.slice(0, 2).join(", ")}</span>
                  </div>
                )}

                {/* Emoji reactions */}
                {currentUserId && idea.author_id !== currentUserId && (
                  <div className="flex items-center gap-1.5 pt-3">
                    {(['🔥', '💡', '🤝'] as const).map(emoji => {
                      const active = ideaReactions.get(idea.id)?.has(emoji) ?? false
                      return (
                        <button
                          key={emoji}
                          onClick={e => { e.preventDefault(); handleReaction(idea.id, emoji) }}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all"
                          style={active
                            ? { background: 'rgba(124,58,237,0.18)', border: '1px solid rgba(168,85,247,0.4)', color: '#C084FC' }
                            : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.35)' }
                          }
                        >
                          <span>{emoji}</span>
                        </button>
                      )
                    })}
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={idea.author?.avatar_url || undefined} />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {idea.author?.full_name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-muted-foreground truncate max-w-[100px]">
                      {idea.author?.full_name || "Anonymous"}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <RippleEffect
                      onClick={() => handleUpvote(idea.id, idea.upvotes || 0, idea.has_upvoted || false)}
                      className={`flex items-center gap-1 hover:text-primary transition-colors rounded px-1 ${idea.has_upvoted ? "text-primary" : ""}`}
                    >
                      <ChevronUp className={`h-4 w-4 ${idea.has_upvoted ? "fill-primary" : ""}`} />
                      {idea.upvotes || 0}
                    </RippleEffect>
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {idea.views || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      {(idea as ResearchIdea & { comments_count?: number }).comments_count || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatDistanceToNow(new Date(idea.created_at), { addSuffix: false })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
            </StaggerItem>
          ))}
        </StaggerContainer>
      ) : (
        <EmptyState
          icon={
            <svg viewBox="0 0 24 24" width="28" height="28">
              <path d="M12 22Q12 14 12 10Q8 6.5 4 4" stroke="#8B5CF6" strokeWidth="2" fill="none" strokeLinecap="round"/>
              <path d="M12 10Q16 6.5 20 4" stroke="#8B5CF6" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
              <circle cx="4" cy="4" r="2.5" fill="#FBBF24"/>
              <circle cx="20" cy="4" r="2" fill="#8B5CF6"/>
            </svg>
          }
          title={searchQuery || selectedArea !== "All Areas" || selectedType !== "all" ? "No results for this search" : "Your first idea could spark a collaboration"}
          description={searchQuery || selectedArea !== "All Areas" || selectedType !== "all" ? "Try different keywords or browse by research field instead." : "Post a research idea and let thousands of researchers across Africa discover it."}
          ctaLabel={searchQuery || selectedArea !== "All Areas" || selectedType !== "all" ? "Browse All Ideas" : "Post Your First Idea"}
          ctaHref={searchQuery || selectedArea !== "All Areas" || selectedType !== "all" ? "/ideas" : "/ideas/new"}
          secondaryLabel={!(searchQuery || selectedArea !== "All Areas" || selectedType !== "all") ? "Browse existing ideas first" : undefined}
          secondaryHref={!(searchQuery || selectedArea !== "All Areas" || selectedType !== "all") ? "/ideas" : undefined}
          stat={!(searchQuery || selectedArea !== "All Areas" || selectedType !== "all") ? "Active researchers browsing ideas right now" : undefined}
        />
      )}
    </div>
    </>
  )
}
