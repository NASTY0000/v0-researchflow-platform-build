"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Plus, GripVertical, Calendar, MoreHorizontal, Loader2, ArrowRight } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"
import type { Task, Profile } from "@/lib/types/database"
import { completeAssignedTask } from "@/lib/actions/akili"
import { format } from "date-fns"
import { toast } from "sonner"

interface KanbanBoardProps {
  projectId: string
  teamId: string
  tasks: Task[]
  currentUserId?: string | null
  isLead?: boolean
}

const COLUMNS = [
  { id: "todo",        title: "To Do"       },
  { id: "in_progress", title: "In Progress" },
  { id: "review",      title: "Review"      },
  { id: "done",        title: "Done"        },
]

const COLUMN_ACCENT: Record<string, string> = {
  todo:        "#A855F7",
  in_progress: "#06B6D4",
  review:      "#F59E0B",
  done:        "#22C55E",
}

const PRIORITIES = [
  { value: "low",    label: "Low",    color: "text-muted-foreground" },
  { value: "medium", label: "Medium", color: "text-yellow-500"       },
  { value: "high",   label: "High",   color: "text-orange-500"       },
  { value: "urgent", label: "Urgent", color: "text-red-500"          },
]

export function KanbanBoard({
  projectId,
  teamId,
  tasks: initialTasks,
  currentUserId = null,
  isLead = false,
}: KanbanBoardProps) {
  const [tasks, setTasks]             = useState<Task[]>(initialTasks)
  const [teamMembers, setTeamMembers] = useState<{ user: Profile }[]>([])
  const [showNewTask, setShowNewTask] = useState(false)
  const [isCreating, setIsCreating]   = useState(false)
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const [dragOverCol, setDragOverCol] = useState<string | null>(null)

  const [newTitle,       setNewTitle]       = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [newPriority,    setNewPriority]    = useState("medium")
  const [newAssignee,    setNewAssignee]    = useState("")
  const [newDueDate,     setNewDueDate]     = useState("")
  const [newStatus,      setNewStatus]      = useState("todo")

  useEffect(() => {
    async function loadTeamMembers() {
      const supabase = createClient()
      const { data } = await supabase
        .from("team_members")
        .select("user:profiles(id, full_name, avatar_url)")
        .eq("team_id", teamId)
      if (data) setTeamMembers(data)
    }
    loadTeamMembers()
  }, [teamId])

  function openAddTask(columnId: string) {
    setNewStatus(columnId)
    setNewTitle("")
    setNewDescription("")
    setNewPriority("medium")
    setNewAssignee("")
    setNewDueDate("")
    setShowNewTask(true)
  }

  async function handleCreateTask() {
    if (!newTitle.trim()) return
    setIsCreating(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from("tasks")
      .insert({
        project_id:  projectId,
        title:       newTitle.trim(),
        description: newDescription.trim() || null,
        status:      newStatus,
        priority:    newPriority,
        assigned_to: newAssignee || null,
        due_date:    newDueDate  || null,
      })
      .select()
      .single()

    if (data && !error) {
      setTasks([...tasks, data])
      setShowNewTask(false)
    } else {
      console.error("Failed to create task:", error)
      toast.error(error?.message || "Failed to create task")
    }
    setIsCreating(false)
  }

  async function handleMoveTask(taskId: string, newStatusVal: string) {
    const prev = tasks
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatusVal } : t))
    const supabase = createClient()
    const { error } = await supabase.from("tasks").update({ status: newStatusVal }).eq("id", taskId)
    if (error) {
      toast.error(error.message || "Failed to move task")
      setTasks(prev)
      return
    }
    if (newStatusVal === "done") {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) await completeAssignedTask(user.id, taskId)
    }
  }

  async function handleDeleteTask(taskId: string) {
    const supabase = createClient()
    const { error } = await supabase.from("tasks").delete().eq("id", taskId)
    if (error) { toast.error(error.message || "Failed to delete task"); return }
    setTasks(tasks.filter(t => t.id !== taskId))
  }

  function handleDragStart(task: Task) { setDraggedTask(task) }
  function handleDragEnd()             { setDraggedTask(null); setDragOverCol(null) }

  function handleDragOver(e: React.DragEvent, colId: string) {
    e.preventDefault()
    setDragOverCol(colId)
  }

  function handleDrop(e: React.DragEvent, colId: string) {
    e.preventDefault()
    setDragOverCol(null)
    if (!draggedTask) return
    if (draggedTask.status !== colId) handleMoveTask(draggedTask.id, colId)
    setDraggedTask(null)
  }

  function getTasksByColumn(colId: string) {
    return tasks.filter(t => t.status === colId)
  }

  return (
    <div className="space-y-4">
      {/* Board header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Task Board</h2>
          <Badge variant="secondary">{tasks.length} tasks</Badge>
        </div>
        <Button
          size="sm"
          className="rounded-full gap-1.5"
          onClick={() => openAddTask("todo")}
        >
          <Plus className="h-4 w-4" />
          Add Task
        </Button>
      </div>

      {/* Add task dialog */}
      <Dialog open={showNewTask} onOpenChange={setShowNewTask}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Task</DialogTitle>
            <DialogDescription>Add a task to the project board.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title <span className="text-destructive">*</span></Label>
              <Input
                placeholder="Task title"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleCreateTask()}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Optional description"
                value={newDescription}
                onChange={e => setNewDescription(e.target.value)}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COLUMNS.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={newPriority} onValueChange={setNewPriority}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map(p => (
                      <SelectItem key={p.value} value={p.value}>
                        <span className={p.color}>{p.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Assignee</Label>
                <Select value={newAssignee} onValueChange={setNewAssignee}>
                  <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                  <SelectContent>
                    {teamMembers.map(m => (
                      <SelectItem key={m.user.id} value={m.user.id}>
                        {m.user.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewTask(false)}>Cancel</Button>
            <Button onClick={handleCreateTask} disabled={isCreating || !newTitle.trim()}>
              {isCreating
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating…</>
                : "Create Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Columns, stacked vertically */}
      <div className="space-y-4">
        {COLUMNS.map(column => {
          const colTasks  = getTasksByColumn(column.id)
          const accent    = COLUMN_ACCENT[column.id]
          const isOver    = dragOverCol === column.id
          const otherCols = COLUMNS.filter(c => c.id !== column.id)

          return (
            <div
              key={column.id}
              className="space-y-3"
              onDragOver={e => handleDragOver(e, column.id)}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={e => handleDrop(e, column.id)}
            >
              {/* Column header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: accent }} />
                  <span className="font-semibold">{column.title}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold tabular-nums"
                    style={{ background: `${accent}20`, color: accent }}
                  >
                    {colTasks.length}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground"
                    onClick={() => openAddTask(column.id)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Drop zone with dashed border */}
              <div
                className={`rounded-xl border-2 border-dashed min-h-[160px] p-3 space-y-2 transition-colors ${
                  isOver
                    ? "border-primary/50 bg-primary/5"
                    : "border-border"
                }`}
              >
                {colTasks.map(task => {
                  const assignee     = teamMembers.find(m => m.user.id === task.assigned_to)
                  const priorityMeta = PRIORITIES.find(p => p.value === task.priority)

                  return (
                    <Card
                      key={task.id}
                      draggable
                      onDragStart={() => handleDragStart(task)}
                      onDragEnd={handleDragEnd}
                      className="cursor-grab active:cursor-grabbing border-border bg-card shadow-sm hover:shadow-md transition-shadow"
                    >
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                            <span className="font-medium text-sm leading-snug line-clamp-2">
                              {task.title}
                            </span>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                                <MoreHorizontal className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {otherCols.map(col => (
                                <DropdownMenuItem
                                  key={col.id}
                                  onClick={() => handleMoveTask(task.id, col.id)}
                                  className="gap-2"
                                >
                                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                                  Move to {col.title}
                                </DropdownMenuItem>
                              ))}
                              {(isLead || task.assigned_to === currentUserId) && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => handleDeleteTask(task.id)}
                                  >
                                    Delete
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {task.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 pl-5">
                            {task.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between pl-5">
                          <div className="flex items-center gap-2">
                            {priorityMeta && task.priority !== "medium" && (
                              <span className={`text-[11px] font-medium ${priorityMeta.color}`}>
                                {priorityMeta.label}
                              </span>
                            )}
                            {task.due_date && (
                              <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(task.due_date), "MMM d")}
                              </span>
                            )}
                          </div>
                          {assignee && (
                            <Avatar className="h-5 w-5">
                              <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                                {assignee.user.full_name?.charAt(0) || "?"}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}

                {colTasks.length === 0 && (
                  <div className="flex items-center justify-center min-h-[100px] text-sm text-muted-foreground/50">
                    Drop tasks here
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
