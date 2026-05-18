"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  CheckCircle2,
  Circle,
  Clock,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Search,
  FlaskConical,
  Database,
  BarChart3,
  FileEdit,
  Send,
  Lock,
  Loader2,
  Users,
  StickyNote,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Project, Profile } from "@/lib/types/database"
import { phaseCompleted, allPhasesCompleted } from "@/lib/actions/akili"
import { ShowcaseSubmit } from "./showcase-submit"
import { toast } from "sonner"

interface ProjectRoadmapProps {
  project: Project
  currentUserId?: string | null
  isOwner?: boolean
}

interface ProjectPhase {
  id: string
  project_id: string
  phase_number: number
  phase_name: string
  status: "not_started" | "in_progress" | "completed"
  assigned_to: string[] | null
  notes: string | null
  completed_at: string | null
  completed_by: string | null
}

const PHASE_DEFS = [
  { number: 1, name: "Topic Refinement", icon: Search, description: "Define research questions, scope, and objectives" },
  { number: 2, name: "Literature Review", icon: BookOpen, description: "Review existing research and identify knowledge gaps" },
  { number: 3, name: "Methodology Design", icon: FlaskConical, description: "Design research approach, methods, and protocols" },
  { number: 4, name: "Data Collection", icon: Database, description: "Gather, organise, and clean research data" },
  { number: 5, name: "Data Analysis", icon: BarChart3, description: "Analyse data, interpret findings, and draw conclusions" },
  { number: 6, name: "Writing and Review", icon: FileEdit, description: "Write, peer-review, and refine the research paper" },
  { number: 7, name: "Showcase Submission", icon: Send, description: "Submit research to the ResearchFlow showcase" },
]

function getInitials(name: string | null) {
  if (!name) return "?"
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
}

export function ProjectRoadmap({ project, currentUserId = null, isOwner = false }: ProjectRoadmapProps) {
  const [phases, setPhases] = useState<ProjectPhase[]>([])
  const [teamMembers, setTeamMembers] = useState<Profile[]>([])
  const [expandedPhase, setExpandedPhase] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [markingComplete, setMarkingComplete] = useState<number | null>(null)
  const [editingNotes, setEditingNotes] = useState<number | null>(null)
  const [notesText, setNotesText] = useState("")
  const [savingNotes, setSavingNotes] = useState(false)

  useEffect(() => { loadData() }, [project.id])

  async function loadData() {
    setIsLoading(true)
    const supabase = createClient()

    // Load team members
    const { data: members } = await supabase
      .from("team_members")
      .select("user:profiles(id, full_name, avatar_url)")
      .eq("team_id", project.team_id)
    if (members) {
      setTeamMembers(
        (members as Array<{ user: Profile | Profile[] }>)
          .map(m => (Array.isArray(m.user) ? m.user[0] : m.user))
          .filter((u): u is Profile => !!u)
      )
    }

    // Load or auto-create phases
    const { data: existingPhases, error } = await supabase
      .from("project_phases")
      .select("*")
      .eq("project_id", project.id)
      .order("phase_number", { ascending: true })

    if (!error && existingPhases && existingPhases.length > 0) {
      setPhases(existingPhases as ProjectPhase[])
    } else if (!error) {
      // Auto-create phases
      const defaults = PHASE_DEFS.map(p => ({
        project_id: project.id,
        phase_number: p.number,
        phase_name: p.name,
        status: "not_started" as const,
      }))
      const { data: created } = await supabase
        .from("project_phases")
        .insert(defaults)
        .select()
      if (created) setPhases(created as ProjectPhase[])
      else setPhases(defaults.map((p, i) => ({ ...p, id: String(i), assigned_to: null, notes: null, completed_at: null, completed_by: null })))
    }

    setIsLoading(false)
  }

  const completedCount = phases.filter(p => p.status === "completed").length
  const progressPercent = Math.round((completedCount / 7) * 100)
  const allComplete = completedCount === 7
  const currentPhaseNumber = phases.find(p => p.status === "in_progress")?.phase_number
    ?? (completedCount < 7 ? completedCount + 1 : 7)

  async function handleMarkComplete(phase: ProjectPhase) {
    if (!currentUserId) return
    const prev = phases.find(p => p.phase_number === phase.phase_number - 1)
    if (prev && prev.status !== "completed" && !isOwner) {
      toast.error(`Complete "${prev.phase_name}" first before marking this complete`)
      return
    }
    setMarkingComplete(phase.phase_number)
    const supabase = createClient()
    const now = new Date().toISOString()

    const { error } = await supabase
      .from("project_phases")
      .update({ status: "completed", completed_at: now, completed_by: currentUserId })
      .eq("id", phase.id)

    if (error) { toast.error("Failed to update phase"); setMarkingComplete(null); return }

    // Mark next phase as in_progress
    const next = phases.find(p => p.phase_number === phase.phase_number + 1)
    if (next) {
      await supabase.from("project_phases").update({ status: "in_progress" }).eq("id", next.id)
    }

    // Award Akili points (+30 per phase, +75 bonus for all 7 complete)
    phaseCompleted(currentUserId, project.id, phase.phase_number, phase.phase_name).catch(() => {})
    if (completedCount + 1 === 7) {
      allPhasesCompleted(currentUserId, project.id).catch(() => {})
      toast.success("All phases complete! +75 bonus Akili points!")
    } else {
      toast.success(`Phase complete! +30 Akili points`)
    }

    loadData()
    setMarkingComplete(null)
  }

  async function handleSaveNotes(phase: ProjectPhase) {
    setSavingNotes(true)
    const supabase = createClient()
    const { error } = await supabase
      .from("project_phases")
      .update({ notes: notesText.trim() || null })
      .eq("id", phase.id)
    if (!error) {
      toast.success("Notes saved")
      setPhases(prev => prev.map(p => p.id === phase.id ? { ...p, notes: notesText.trim() || null } : p))
    } else {
      toast.error("Failed to save notes")
    }
    setSavingNotes(false)
    setEditingNotes(null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#7C3AED' }} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '16px' }}>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold" style={{ color: '#E2D9F3' }}>Research Progress</h3>
              <p className="text-xs mt-0.5" style={{ color: '#7C6A9C' }}>
                {completedCount} of 7 phases complete
                {currentPhaseNumber <= 7 && ` · Currently: Phase ${currentPhaseNumber}`}
              </p>
            </div>
            <span className="text-2xl font-bold" style={{ color: '#A855F7' }}>{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" style={{ background: 'rgba(139,92,246,0.15)' }} />
          <div className="flex gap-4 text-xs" style={{ color: '#7C6A9C' }}>
            <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" />{completedCount} done</span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-amber-500" />{7 - completedCount} remaining</span>
          </div>
        </CardContent>
      </Card>

      {/* Phase Timeline — vertical */}
      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-0.5" style={{ background: 'rgba(139,92,246,0.2)' }} />
        <div className="space-y-4">
          {PHASE_DEFS.map((def) => {
            const phase = phases.find(p => p.phase_number === def.number)
            const status = phase?.status ?? "not_started"
            const isCompleted = status === "completed"
            const isCurrent = status === "in_progress" || (!isCompleted && def.number === currentPhaseNumber)
            const isUpcoming = !isCompleted && !isCurrent
            const isExpanded = expandedPhase === def.number
            const Icon = def.icon
            const prevComplete = def.number === 1 || phases.find(p => p.phase_number === def.number - 1)?.status === "completed"

            return (
              <div key={def.number} className="relative pl-16">
                {/* Phase indicator */}
                <div
                  className="absolute left-0 w-12 h-12 rounded-full flex items-center justify-center z-10"
                  style={{
                    background: isCompleted ? 'rgba(34,197,94,0.15)' : isCurrent ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.04)',
                    border: `2px solid ${isCompleted ? '#22C55E' : isCurrent ? '#7C3AED' : 'rgba(139,92,246,0.2)'}`,
                  }}
                >
                  {isCompleted
                    ? <CheckCircle2 className="h-5 w-5 text-green-500" />
                    : <Icon className="h-4 w-4" style={{ color: isCurrent ? '#A855F7' : '#7C6A9C' }} />
                  }
                  {isCurrent && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full animate-pulse" style={{ background: '#A855F7' }} />
                  )}
                </div>

                <Card
                  className="cursor-pointer transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isCompleted ? 'rgba(34,197,94,0.25)' : isCurrent ? 'rgba(124,58,237,0.4)' : 'rgba(139,92,246,0.12)'}`,
                    borderRadius: '12px',
                    opacity: isUpcoming && !prevComplete ? 0.6 : 1,
                  }}
                  onClick={() => setExpandedPhase(isExpanded ? null : def.number)}
                >
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-mono shrink-0" style={{ color: '#4A3F6B' }}>#{def.number}</span>
                        <CardTitle className="text-sm truncate" style={{ color: '#E2D9F3' }}>{def.name}</CardTitle>
                        {isCompleted && <Badge className="text-xs shrink-0" style={{ background: 'rgba(34,197,94,0.15)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.3)' }}>Complete</Badge>}
                        {isCurrent && <Badge className="text-xs shrink-0" style={{ background: 'rgba(124,58,237,0.15)', color: '#A855F7', border: '1px solid rgba(124,58,237,0.3)' }}>In Progress</Badge>}
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </Button>
                    </div>
                    <p className="text-xs mt-1" style={{ color: '#7C6A9C' }}>{def.description}</p>
                  </CardHeader>

                  {isExpanded && (
                    <CardContent className="p-4 pt-0 space-y-4" onClick={e => e.stopPropagation()}>
                      <div className="h-px" style={{ background: 'rgba(139,92,246,0.1)' }} />

                      {/* Completion info */}
                      {isCompleted && phase?.completed_at && (
                        <p className="text-xs" style={{ color: '#22C55E' }}>
                          Completed {new Date(phase.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      )}

                      {/* Team avatars */}
                      {teamMembers.length > 0 && (
                        <div>
                          <p className="text-xs font-medium mb-1.5 flex items-center gap-1" style={{ color: '#7C6A9C' }}>
                            <Users className="h-3 w-3" /> Team
                          </p>
                          <div className="flex -space-x-2">
                            {teamMembers.slice(0, 5).map(m => (
                              <Avatar key={m.id} className="h-7 w-7 border-2" style={{ borderColor: '#05010F' }}>
                                <AvatarFallback className="text-[10px]" style={{ background: 'rgba(124,58,237,0.2)', color: '#A855F7' }}>
                                  {getInitials(m.full_name)}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Notes */}
                      <div>
                        <p className="text-xs font-medium mb-1.5 flex items-center gap-1" style={{ color: '#7C6A9C' }}>
                          <StickyNote className="h-3 w-3" /> Notes
                        </p>
                        {editingNotes === def.number ? (
                          <div className="space-y-2">
                            <Textarea
                              value={notesText}
                              onChange={e => setNotesText(e.target.value)}
                              placeholder="Add progress notes for this phase..."
                              rows={3}
                              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(139,92,246,0.2)', color: '#E2D9F3', fontSize: '13px' }}
                            />
                            <div className="flex gap-2">
                              <Button size="sm" disabled={savingNotes} onClick={() => phase && handleSaveNotes(phase)}
                                style={{ background: 'linear-gradient(135deg,#7C3AED,#A855F7)', border: 'none', fontSize: '12px' }}>
                                {savingNotes ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save'}
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingNotes(null)}
                                style={{ border: '1px solid rgba(139,92,246,0.2)', color: '#7C6A9C', background: 'transparent', fontSize: '12px' }}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="group flex items-start gap-2">
                            {phase?.notes
                              ? <p className="text-xs flex-1 whitespace-pre-wrap" style={{ color: '#C4B5FD' }}>{phase.notes}</p>
                              : <p className="text-xs flex-1" style={{ color: '#4A3F6B' }}>No notes yet.</p>
                            }
                            {(isOwner || currentUserId) && (
                              <Button size="sm" variant="ghost" className="h-6 text-xs opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                style={{ color: '#7C6A9C' }}
                                onClick={() => { setEditingNotes(def.number); setNotesText(phase?.notes || "") }}>
                                Edit
                              </Button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      {!isCompleted && (isOwner || currentUserId) && (
                        <div className="flex items-center gap-2 pt-1">
                          {!prevComplete && !isOwner && (
                            <p className="text-xs flex items-center gap-1" style={{ color: '#7C6A9C' }}>
                              <Lock className="h-3 w-3" /> Complete previous phase first
                            </p>
                          )}
                          {(prevComplete || isOwner) && (
                            <Button
                              size="sm"
                              disabled={markingComplete === def.number}
                              onClick={() => phase && handleMarkComplete(phase)}
                              style={{ background: 'linear-gradient(135deg,#7C3AED,#A855F7)', border: 'none', fontSize: '12px' }}
                            >
                              {markingComplete === def.number
                                ? <><Loader2 className="h-3 w-3 animate-spin mr-1" />Saving...</>
                                : <><CheckCircle2 className="h-3 w-3 mr-1" />Mark Complete</>
                              }
                            </Button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              </div>
            )
          })}
        </div>
      </div>

      {/* Showcase */}
      <ShowcaseSubmit
        project={project}
        currentUserId={currentUserId}
        isOwner={isOwner}
        allPhasesComplete={allComplete}
      />
    </div>
  )
}
