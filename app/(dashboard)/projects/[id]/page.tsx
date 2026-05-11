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
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Project, Team, Profile, Task } from "@/lib/types/database"
import { KanbanBoard } from "@/components/projects/kanban-board"
import { ProjectChat } from "@/components/projects/project-chat"
import { ProjectRoadmap } from "@/components/projects/project-roadmap"
import { ProjectFiles } from "@/components/projects/project-files"
import { ProjectTeam } from "@/components/projects/project-team"

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
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading project...</p>
        </div>
      </div>
    )
  }

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
            <p className="text-muted-foreground">{project.description || "No description"}</p>
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
        </TabsList>

        <TabsContent value="kanban">
          <KanbanBoard projectId={project.id} teamId={project.team_id} tasks={project.tasks || []} />
        </TabsContent>

        <TabsContent value="roadmap">
          <ProjectRoadmap project={project} />
        </TabsContent>

        <TabsContent value="chat">
          <ProjectChat projectId={project.id} teamId={project.team_id} currentUserId={currentUserId} />
        </TabsContent>

        <TabsContent value="files">
          <ProjectFiles projectId={project.id} />
        </TabsContent>

        <TabsContent value="team">
          <ProjectTeam project={project} currentUserId={currentUserId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
