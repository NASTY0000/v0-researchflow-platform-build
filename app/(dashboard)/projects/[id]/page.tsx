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
  ChevronDown,
  ChevronUp,
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

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  active: "default",
  completed: "secondary",
}

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [project, setProject] = useState<ProjectWithDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("kanban")
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [descExpanded, setDescExpanded] = useState(false)

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

  const raw = project.description || ''
  const objMarker = '\n\nObjectives:\n'
  const hasObjectives = raw.includes(objMarker)
  const aim = hasObjectives ? raw.split(objMarker)[0].trim() : raw.trim()
  const objectivesList = hasObjectives
    ? raw.split(objMarker)[1].split('\n').map((l: string) => l.replace(/^\d+\.\s*/, '').trim()).filter((l: string) => l.length > 0)
    : []

  const memberCount = project.team?.team_members?.length || 0

  return (
    <div className="space-y-5">
      {/* Compact header */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild>
            <Link href="/projects">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-xl font-bold font-heading leading-tight truncate">
              {project.title}
            </h1>
            <Badge variant={STATUS_VARIANT[project.status] ?? "outline"} className="shrink-0">
              {project.status}
            </Badge>
            {project.research_area && (
              <Badge variant="outline" className="shrink-0 hidden sm:inline-flex">
                {project.research_area}
              </Badge>
            )}
          </div>
          <Button variant="outline" size="sm" className="ml-auto shrink-0" asChild>
            <Link href={`/projects/${id}/settings`}>
              <Settings className="h-3.5 w-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">Settings</span>
            </Link>
          </Button>
        </div>

        {/* Description — truncated with expand toggle */}
        {aim && (
          <div className="pl-10">
            <p
              className={`text-sm text-muted-foreground leading-relaxed transition-all ${descExpanded ? '' : 'line-clamp-2'}`}
            >
              {aim}
            </p>
            {objectivesList.length > 0 && descExpanded && (
              <ul className="mt-2 space-y-1">
                {objectivesList.map((obj: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/50" />
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            )}
            {(aim.length > 120 || objectivesList.length > 0) && (
              <button
                onClick={() => setDescExpanded(!descExpanded)}
                className="mt-1 flex items-center gap-1 text-xs text-primary/70 hover:text-primary transition-colors"
              >
                {descExpanded ? (
                  <><ChevronUp className="h-3 w-3" /> Less</>
                ) : (
                  <><ChevronDown className="h-3 w-3" /> {objectivesList.length > 0 ? `More + ${objectivesList.length} objectives` : 'More'}</>
                )}
              </button>
            )}

            {/* Metadata strip */}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {project.current_phase && (
                <span className="flex items-center gap-1">
                  <Route className="h-3 w-3" />
                  {project.current_phase.replace(/_/g, ' ')}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {memberCount} {memberCount === 1 ? 'member' : 'members'}
              </span>
              {project.research_area && (
                <span className="sm:hidden">{project.research_area}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tabs — immediately visible */}
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
