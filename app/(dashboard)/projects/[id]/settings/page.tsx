"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Loader2, Save, Plus, X, AlertTriangle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { DeleteButton } from "@/components/ui/delete-button"
import { ListPageSkeleton } from "@/components/ui/skeleton-screens"
import { toast } from "sonner"

const OBJECTIVES_MARKER = "\n\nObjectives:\n"

export default function ProjectSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isLead, setIsLead] = useState(false)

  const [title, setTitle] = useState("")
  const [aim, setAim] = useState("")
  const [objectives, setObjectives] = useState<string[]>([""])
  const [isPublic, setIsPublic]                           = useState(true)
  const [isOpenToCollaborators, setIsOpenToCollaborators] = useState(false)

  useEffect(() => {
    async function loadProject() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/projects")
        return
      }

      const { data, error } = await supabase
        .from("projects")
        .select(`
          id, title, description, is_public, is_open_to_collaborators,
          team:teams(leader_id, team_members(user_id))
        `)
        .eq("id", id)
        .single()

      if (error || !data) {
        router.push("/projects")
        return
      }

      const team = data.team as unknown as { leader_id: string; team_members: { user_id: string }[] } | null
      const isMember = team?.team_members?.some((m) => m.user_id === user.id) ?? false

      if (!isMember) {
        router.push(`/projects/${id}`)
        return
      }

      setIsLead(team?.leader_id === user.id)
      setTitle(data.title || "")
      setIsPublic(data.is_public ?? true)
      setIsOpenToCollaborators((data as Record<string, unknown>).is_open_to_collaborators === true)

      const raw = data.description || ""
      const hasObjectives = raw.includes(OBJECTIVES_MARKER)
      setAim(hasObjectives ? raw.split(OBJECTIVES_MARKER)[0].trim() : raw.trim())
      setObjectives(
        hasObjectives
          ? raw
              .split(OBJECTIVES_MARKER)[1]
              .split("\n")
              .map((l: string) => l.replace(/^\d+\.\s*/, "").trim())
              .filter((l: string) => l.length > 0)
          : [""]
      )

      setIsLoading(false)
    }

    loadProject()
  }, [id, router])

  function addObjective() {
    setObjectives([...objectives, ""])
  }

  function removeObjective(index: number) {
    setObjectives(objectives.filter((_, i) => i !== index))
  }

  function updateObjective(index: number, value: string) {
    const updated = [...objectives]
    updated[index] = value
    setObjectives(updated)
  }

  async function handleSave() {
    if (!title.trim() || !aim.trim()) {
      toast.error("Title and research aim are required")
      return
    }

    setIsSaving(true)
    const supabase = createClient()

    const filledObjectives = objectives.filter((o) => o.trim())
    const description = filledObjectives.length > 0
      ? `${aim.trim()}${OBJECTIVES_MARKER}${filledObjectives.map((o, i) => `${i + 1}. ${o}`).join("\n")}`
      : aim.trim()

    const { error } = await supabase
      .from("projects")
      .update({
        title: title.trim(),
        description,
        is_public: isPublic,
        is_open_to_collaborators: isPublic ? isOpenToCollaborators : false,
      })
      .eq("id", id)

    if (error) {
      toast.error(error.message || "Failed to save settings")
    } else {
      toast.success("Project settings saved")
    }

    setIsSaving(false)
  }

  async function handleDeleteProject() {
    const supabase = createClient()
    const { error } = await supabase.from("projects").delete().eq("id", id)
    if (error) throw new Error(error.message)
    router.push("/projects")
  }

  if (isLoading) {
    return <div className="max-w-2xl mx-auto px-4 py-8"><ListPageSkeleton type="card" count={2} /></div>
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/projects/${id}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold font-heading">Project Settings</h1>
      </div>

      {/* General */}
      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>Update your project's title, aim, and objectives.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Project Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150} />
          </div>

          <div className="space-y-2">
            <Label>Research Aim</Label>
            <Textarea value={aim} onChange={(e) => setAim(e.target.value)} rows={3} />
          </div>

          <div className="space-y-2">
            <Label>Objectives</Label>
            <div className="space-y-2">
              {objectives.map((obj, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <span className="text-sm font-medium w-5 shrink-0 text-muted-foreground">{i + 1}.</span>
                  <Input
                    value={obj}
                    onChange={(e) => updateObjective(i, e.target.value)}
                    placeholder={`Objective ${i + 1}`}
                  />
                  {objectives.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" className="shrink-0 w-8 h-8" onClick={() => removeObjective(i)}>
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addObjective}>
              <Plus className="w-4 h-4 mr-1" /> Add Objective
            </Button>
          </div>

          <div className="pt-2">
            <Button onClick={handleSave} disabled={isSaving || !title.trim() || !aim.trim()}>
              {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : <><Save className="mr-2 h-4 w-4" />Save Changes</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Visibility */}
      <Card>
        <CardHeader>
          <CardTitle>Visibility</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Public Project</p>
              <p className="text-xs text-muted-foreground mt-1">
                Public projects appear in the research feed and are visible to all users.
                Only team members can edit regardless of visibility.
              </p>
            </div>
            <Switch
              checked={isPublic}
              onCheckedChange={(val) => {
                setIsPublic(val)
                if (!val) setIsOpenToCollaborators(false)
              }}
            />
          </div>

          <div className={`flex items-start justify-between gap-4 pt-4 border-t border-border transition-opacity ${!isPublic ? 'opacity-40 pointer-events-none' : ''}`}>
            <div>
              <p className="text-sm font-medium">Open to Collaborators</p>
              <p className="text-xs text-muted-foreground mt-1">
                Allow other researchers to request to join this project. Requests go to the team lead for approval.
                {!isPublic && <span className="block mt-0.5 text-amber-400/80">Requires a public project.</span>}
              </p>
            </div>
            <Switch
              checked={isOpenToCollaborators}
              onCheckedChange={setIsOpenToCollaborators}
              disabled={!isPublic}
            />
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      {isLead && (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Deleting this project is permanent and cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DeleteButton
              variant="button"
              label="Delete Project"
              onDelete={handleDeleteProject}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
