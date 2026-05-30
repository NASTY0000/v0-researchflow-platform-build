"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import {
  FolderKanban,
  Plus,
  Users,
  Calendar,
  Clock,
  ArrowRight,
  MoreHorizontal,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"
import type { Project, Team, Profile } from "@/lib/types/database"
import { EmptyState } from '@/components/ui/EmptyState'
import { format } from "date-fns"
import { ListPageSkeleton } from '@/components/ui/skeleton-screens'

interface ProjectWithTeam extends Project {
  team: Team & {
    team_members: { user: Profile }[]
  }
}

const PHASE_LABELS: Record<string, string> = {
  problem_identification: "Problem Identification",
  literature_review: "Literature Review",
  methodology: "Methodology",
  data_collection: "Data Collection",
  analysis: "Analysis",
  writing: "Writing",
  review: "Review",
  publication: "Publication",
}

const PHASE_ORDER = [
  "problem_identification",
  "literature_review",
  "methodology",
  "data_collection",
  "analysis",
  "writing",
  "review",
  "publication",
]

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectWithTeam[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadProjects() {
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get teams the user is a member of
      const { data: teamMemberships } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", user.id)

      if (!teamMemberships || teamMemberships.length === 0) {
        setIsLoading(false)
        return
      }

      const teamIds = teamMemberships.map((m) => m.team_id)

      // Get projects for those teams
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          team:teams(
            *,
            team_members(
              user:profiles(id, full_name, avatar_url)
            )
          )
        `)
        .in("team_id", teamIds)
        .order("updated_at", { ascending: false })

      if (data && !error) {
        setProjects(data)
      }

      setIsLoading(false)
    }

    loadProjects()
  }, [])

  function getPhaseProgress(phase: string): number {
    const index = PHASE_ORDER.indexOf(phase)
    return Math.round(((index + 1) / PHASE_ORDER.length) * 100)
  }

  if (isLoading) {
    return <div className="max-w-4xl mx-auto px-4 py-8"><ListPageSkeleton type="card" count={4} /></div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading">My Projects</h1>
          <p className="text-muted-foreground mt-1">Manage your active research projects</p>
        </div>
        <Button asChild>
          <Link href="/projects/new">
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Link>
        </Button>
      </div>

      {/* Projects Grid */}
      {projects.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="hover:border-primary/50 transition-all h-full cursor-pointer group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-1 group-hover:text-primary transition-colors">
                        {project.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-2 mt-1">
                        {project.description || "No description"}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                        <Button variant="ghost" size="icon" className="shrink-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Project</DropdownMenuItem>
                        <DropdownMenuItem>Edit Settings</DropdownMenuItem>
                        <DropdownMenuItem>Archive</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Status Badge */}
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        project.status === "active"
                          ? "default"
                          : project.status === "completed"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {project.status}
                    </Badge>
                    {project.research_area && (
                      <Badge variant="outline">{project.research_area}</Badge>
                    )}
                  </div>

                  {/* Current Phase */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Current Phase</span>
                      <span className="font-medium">
                        {PHASE_LABELS[project.current_phase || "problem_identification"]}
                      </span>
                    </div>
                    <Progress value={getPhaseProgress(project.current_phase || "problem_identification")} className="h-2" />
                  </div>

                  {/* Team Members */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {project.team?.team_members?.slice(0, 4).map((member, i) => (
                          <Avatar key={i} className="h-7 w-7 border-2 border-card">
                            <AvatarImage src={member.user?.avatar_url || undefined} />
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {member.user?.full_name?.charAt(0) || "?"}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {(project.team?.team_members?.length || 0) > 4 && (
                          <div className="h-7 w-7 rounded-full bg-muted border-2 border-card flex items-center justify-center">
                            <span className="text-xs">+{(project.team?.team_members?.length || 0) - 4}</span>
                          </div>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {project.team?.team_members?.length || 0} members
                      </span>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Started {format(new Date(project.start_date || project.created_at), "MMM d")}
                    </span>
                    {project.target_end_date && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Due {format(new Date(project.target_end_date), "MMM d")}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon="🔬"
          title="No active projects yet"
          description="Start a research project and invite collaborators to work with you."
          ctaLabel="Create a Project"
          ctaHref="/projects/new"
          secondaryLabel="Join an existing project"
          secondaryHref="/ideas"
        />
      )}
    </div>
  )
}
