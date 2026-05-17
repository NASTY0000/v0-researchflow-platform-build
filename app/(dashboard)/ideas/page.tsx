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
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { ResearchIdea, Profile } from "@/lib/types/database"
import { formatDistanceToNow } from "date-fns"

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

  return (
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
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-muted rounded w-3/4 mb-3" />
                <div className="h-4 bg-muted rounded w-full mb-2" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : ideas.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ideas.map(idea => (
            <Card key={idea.id} className="hover:border-primary/50 transition-all group relative">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <Link href={`/ideas/${idea.id}`} className="flex-1">
                    <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                      {idea.title}
                    </h3>
                  </Link>
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
                    <button
                      onClick={e => {
                        e.preventDefault()
                        handleUpvote(idea.id, idea.upvotes || 0, idea.has_upvoted || false)
                      }}
                      className={`flex items-center gap-1 hover:text-primary transition-colors ${idea.has_upvoted ? "text-primary" : ""}`}
                    >
                      <ChevronUp className={`h-4 w-4 ${idea.has_upvoted ? "fill-primary" : ""}`} />
                      {idea.upvotes || 0}
                    </button>
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {idea.views || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatDistanceToNow(new Date(idea.created_at), { addSuffix: false })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Lightbulb className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No ideas found</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery || selectedArea !== "All Areas" || selectedType !== "all"
                ? "Try adjusting your filters to find more ideas"
                : "Be the first to share a research idea with the community!"}
            </p>
            <Button asChild>
              <Link href="/ideas/new">
                <Plus className="mr-2 h-4 w-4" />
                Post New Idea
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
