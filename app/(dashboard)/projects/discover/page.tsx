"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { BackToHub } from "@/components/ui/back-to-hub"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Users, Search, UserPlus, ArrowRight } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Project, Team, Profile } from "@/lib/types/database"
import { ListPageSkeleton } from "@/components/ui/skeleton-screens"
import { EmptyState } from "@/components/ui/EmptyState"
import { formatDistanceToNow } from "date-fns"

interface OpenProject extends Project {
  team: Team & {
    team_members: { user: Profile }[]
  }
}

export default function DiscoverProjectsPage() {
  const [projects, setProjects]   = useState<OpenProject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [query, setQuery]         = useState("")
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setCurrentUserId(user.id)

      const { data } = await supabase
        .from("projects")
        .select(`
          *,
          team:teams(
            *,
            team_members(
              user:profiles(id, full_name, avatar_url, department)
            )
          )
        `)
        .eq("is_public", true)
        .eq("is_open_to_collaborators", true)
        .eq("status", "active")
        .order("updated_at", { ascending: false })
        .limit(50)

      setProjects((data ?? []) as unknown as OpenProject[])
      setIsLoading(false)
    }
    load()
  }, [])

  const filtered = query.trim().length < 2
    ? projects
    : projects.filter(p =>
        p.title.toLowerCase().includes(query.toLowerCase()) ||
        (p.research_area ?? "").toLowerCase().includes(query.toLowerCase()) ||
        (p.description ?? "").toLowerCase().includes(query.toLowerCase())
      )

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <ListPageSkeleton type="card" count={4} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <BackToHub href="/collaborate" label="Back to Collaborate" />

      <div>
        <h1 className="text-2xl font-bold font-heading tracking-tight">Open Projects</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Active research projects that are recruiting collaborators
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          className="pl-9"
          placeholder="Search by title or area…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {filtered.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map(project => {
            const memberCount = project.team?.team_members?.length ?? 0
            const isMember = project.team?.team_members?.some(m => m.user.id === currentUserId)
            return (
              <Card key={project.id} className="hover:border-primary/50 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-snug line-clamp-2">
                      {project.title}
                    </CardTitle>
                    <Badge variant="outline" className="shrink-0 gap-1 border-primary/40 text-primary bg-primary/8 text-xs">
                      <UserPlus className="h-3 w-3" />
                      Recruiting
                    </Badge>
                  </div>
                  {project.research_area && (
                    <Badge variant="secondary" className="w-fit text-xs">{project.research_area}</Badge>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  {project.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {project.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {project.team?.team_members?.slice(0, 4).map((m, i) => (
                          <Avatar key={i} className="h-6 w-6 border-2 border-card">
                            <AvatarImage src={m.user?.avatar_url || undefined} />
                            <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                              {m.user?.full_name?.charAt(0) || "?"}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {memberCount} {memberCount === 1 ? "member" : "members"}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}
                    </span>
                  </div>

                  <Button asChild size="sm" className="w-full gap-1.5" variant={isMember ? "outline" : "default"}>
                    <Link href={`/projects/${project.id}`}>
                      {isMember ? "View Project" : <><UserPlus className="h-3.5 w-3.5" />Request to Join</>}
                      <ArrowRight className="h-3.5 w-3.5 ml-auto" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <EmptyState
          icon="🔍"
          title={query.trim().length >= 2 ? "No matching projects" : "No open projects right now"}
          description={query.trim().length >= 2
            ? "Try a different search term."
            : "Check back later — teams will post here when they're recruiting collaborators."
          }
          ctaLabel="Create your own project"
          ctaHref="/projects/new"
        />
      )}
    </div>
  )
}
