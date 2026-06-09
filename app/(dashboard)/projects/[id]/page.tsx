"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Settings,
  LayoutGrid,
  MessageSquare,
  FileText,
  Route,
  Users,
  GraduationCap,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Project, Team, Profile, Task } from "@/lib/types/database"
import { KanbanBoard } from "@/components/projects/kanban-board"
import { ProjectChat } from "@/components/projects/project-chat"
import { ProjectRoadmap } from "@/components/projects/project-roadmap"
import { ProjectFiles } from "@/components/projects/project-files"
import { ProjectTeam } from "@/components/projects/project-team"
import { MentorSessions } from "@/components/projects/mentor-sessions"
import { ListPageSkeleton } from '@/components/ui/skeleton-screens'

interface ProjectWithDetails extends Project {
  team: Team & {
    team_members: { user: Profile; role: string }[]
  }
  tasks: Task[]
}

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [project, setProject] = useState<ProjectWithDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("kanban")
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    async function loadProject() {
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (user) setCurrentUserId(user.id)

      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          team:teams(
            *,
            team_members(
              role,
              user:profiles(id, full_name, avatar_url, department)
            )
          ),
          tasks(*)
        `)
        .eq("id", id)
        .single()

      if (error || !data) {
        router.push("/projects")
        return
      }

      setProject(data)
      setIsLoading(false)
    }

    loadProject()
  }, [id, router])

  if (isLoading || !project) {
    return <div className="max-w-4xl mx-auto px-4 py-8"><ListPageSkeleton type="card" count={3} /></div>
  }

  const isLead = currentUserId === project.team?.leader_id
  const isMember = !!project.team?.team_members?.some((m) => m.user.id === currentUserId)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/projects">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold font-heading">{project.title}</h1>
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
            </div>
            <div className="space-y-3 mt-1">
              {(() => {
                const raw = project.description || ''
                const objMarker = '\n\nObjectives:\n'
                const hasObjectives = raw.includes(objMarker)
                const aim = hasObjectives ? raw.split(objMarker)[0].trim() : raw.trim()
                const objectivesList = hasObjectives
                  ? raw
                      .split(objMarker)[1]
                      .split('\n')
                      .map((l: string) => l.replace(/^\d+\.\s*/, '').trim())
                      .filter((l: string) => l.length > 0)
                  : []

                return (
                  <>
                    {aim && (
                      <div>
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                          Research Aim
                        </h3>
                        <p className="text-sm text-foreground leading-relaxed">{aim}</p>
                      </div>
                    )}
                    {objectivesList.length > 0 && (
                      <div>
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                          Objectives
                        </h3>
                        <ol className="space-y-1.5">
                          {objectivesList.map((obj: string, i: number) => (
                            <li key={i} className="flex gap-2 text-sm text-foreground leading-relaxed">
                              <span className="shrink-0 font-semibold text-primary">{i + 1}.</span>
                              <span>{obj}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                    {!aim && !objectivesList.length && (
                      <p className="text-sm text-muted-foreground">No description</p>
                    )}
                  </>
                )
              })()}
            </div>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/projects/${id}/settings`}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-card border">
          <TabsTrigger value="kanban" className="gap-2">
            <LayoutGrid className="h-4 w-4" />
            <span className="hidden sm:inline">Kanban</span>
          </TabsTrigger>
          <TabsTrigger value="roadmap" className="gap-2">
            <Route className="h-4 w-4" />
            <span className="hidden sm:inline">Roadmap</span>
          </TabsTrigger>
          <TabsTrigger value="chat" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Chat</span>
          </TabsTrigger>
          <TabsTrigger value="files" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Files</span>
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Team</span>
          </TabsTrigger>
          <TabsTrigger value="sessions" className="gap-2">
            <GraduationCap className="h-4 w-4" />
            <span className="hidden sm:inline">Sessions</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="kanban">
          <KanbanBoard
            projectId={project.id}
            teamId={project.team_id}
            tasks={project.tasks || []}
            currentUserId={currentUserId}
            isLead={isLead}
          />
        </TabsContent>

        <TabsContent value="roadmap">
          <ProjectRoadmap
            project={project}
            currentUserId={currentUserId}
            isOwner={isLead}
            isMember={isMember}
          />
        </TabsContent>

        <TabsContent value="chat">
          <ProjectChat projectId={project.id} teamId={project.team_id} currentUserId={currentUserId} />
        </TabsContent>

        <TabsContent value="files">
          <ProjectFiles projectId={project.id} currentUserId={currentUserId} isLead={isLead} />
        </TabsContent>

        <TabsContent value="team">
          <ProjectTeam project={project} currentUserId={currentUserId} />
        </TabsContent>

        <TabsContent value="sessions">
          <MentorSessions projectId={project.id} currentUserId={currentUserId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
