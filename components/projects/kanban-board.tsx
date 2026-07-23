"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import {
  Plus,
  GripVertical,
  Calendar,
  MoreHorizontal,
  Loader2,
  ArrowRight,
} from "lucide-react"
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

interface Column {
  id: string
  title: string
}

const COLUMNS: Column[] = [
  { id: "todo", title: "To Do" },
  { id: "in_progress", title: "In Progress" },
  { id: "review", title: "Review" },
  { id: "done", title: "Done" },
]

const COLUMN_ACCENT: Record<string, string> = {
  todo: '#A855F7',
  in_progress: '#06B6D4',
  review: '#F59E0B',
  done: '#22C55E',
}

const PRIORITIES = [
  { value: "low", label: "Low", color: "text-muted-foreground" },
  { value: "medium", label: "Medium", color: "text-yellow-500" },
  { value: "high", label: "High", color: "text-orange-500" },
  { value: "urgent", label: "Urgent", color: "text-red-500" },
]

export function KanbanBoard({ projectId, teamId, tasks: initialTasks, currentUserId = null, isLead = false }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [teamMembers, setTeamMembers] = useState<{ user: Profile }[]>([])
  const [showNewTask, setShowNewTask] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)

  // New task form
  const [newTitle, setNewTitle] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [newPriority, setNewPriority] = useState("medium")
  const [newAssignee, setNewAssignee] = useState("")
  const [newDueDate, setNewDueDate] = useState("")
  const [newStatus, setNewStatus] = useState("todo")

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
        project_id: projectId,
        title: newTitle.trim(),
        description: newDescription.trim() || null,
        status: newStatus,
        priority: newPriority,
        assigned_to: newAssignee || null,
        due_date: newDueDate || null,
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
    const prevTasks = tasks
    // Optimistic update
    setTasks(tasks.map((t) => (t.id === taskId ? { ...t, status: newStatusVal } : t)))

    const supabase = createClient()
    const { error } = await supabase.from("tasks").update({ status: newStatusVal }).eq("id", taskId)

    if (error) {
      console.error("Failed to update task status:", error)
      toast.error(error.message || "Failed to move task")
      setTasks(prevTasks) // revert
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
    if (error) {
      console.error("Failed to delete task:", error)
      toast.error(error.message || "Failed to delete task")
      return
    }
    setTasks(tasks.filter((t) => t.id !== taskId))
  }

  function handleDragStart(task: Task) {
    setDraggedTask(task)
  }

  function handleDragEnd() {
    setDraggedTask(null)
    setDragOverColumn(null)
  }

  function handleDragOver(e: React.DragEvent, columnId: string) {
    e.preventDefault()
    setDragOverColumn(columnId)
  }

  function handleDrop(e: React.DragEvent, columnId: string) {
    e.preventDefault()
    setDragOverColumn(null)
    if (!draggedTask) return
    if (draggedTask.status !== columnId) {
      handleMoveTask(draggedTask.id, columnId)
    }
    setDraggedTask(null)
  }

  function getTasksByColumn(columnId: string) {
    return tasks.filter((task) => task.status === columnId)
  }

  function getAssigneeName(userId: string | null) {
    if (!userId) return null
    return teamMembers.find((m) => m.user.id === userId)?.user.full_name || null
  }

  const isDragging = !!draggedTask

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold">Task Board</h2>
          <Badge variant="secondary" className="tabular-nums">{tasks.length}</Badge>
        </div>
        <Button size="sm" onClick={() => openAddTask("todo")}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add Task
        </Button>
      </div>

      {/* Create task dialog */}
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
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleCreateTask()}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Optional description"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COLUMNS.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={newPriority} onValueChange={setNewPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
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
                  <SelectTrigger>
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.user.id} value={member.user.id}>
                        {member.user.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewTask(false)}>Cancel</Button>
            <Button onClick={handleCreateTask} disabled={isCreating || !newTitle.trim()}>
              {isCreating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating…</> : "Create Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Kanban columns — horizontal scroll on mobile */}
      <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory md:grid md:grid-cols-4 md:overflow-visible">
        {COLUMNS.map((column) => {
          const colTasks = getTasksByColumn(column.id)
          const isOver = dragOverColumn === column.id

          return (
            <div
              key={column.id}
              className="flex flex-col gap-3 min-w-[280px] snap-start md:min-w-0"
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={() => setDragOverColumn(null)}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* Column header */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ background: COLUMN_ACCENT[column.id] }}
                  />
                  <span className="text-sm font-semibold">{column.title}</span>
                  <span
                    className="text-xs px-1.5 py-0.5 rounded-full tabular-nums font-medium"
                    style={{
                      background: `${COLUMN_ACCENT[column.id]}15`,
                      color: COLUMN_ACCENT[column.id],
                    }}
                  >
                    {colTasks.length}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  onClick={() => openAddTask(column.id)}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Drop zone */}
              <div
                className={`flex flex-col gap-2 min-h-[180px] rounded-xl p-2 transition-colors ${
                  isOver ? 'bg-muted/60 ring-1 ring-border' : 'bg-muted/20'
                }`}
              >
                {colTasks.map((task) => {
                  const assigneeName = getAssigneeName(task.assigned_to)
                  const priorityColor = PRIORITIES.find(p => p.value === task.priority)?.color || ''
                  const otherColumns = COLUMNS.filter(c => c.id !== column.id)

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
                            <GripVertical className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                            <span className="font-medium text-sm leading-snug line-clamp-2">{task.title}</span>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                                <MoreHorizontal className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {/* Move to — mobile fallback for drag and drop */}
                              {otherColumns.map((col) => (
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
                          <p className="text-xs text-muted-foreground line-clamp-2 pl-5">{task.description}</p>
                        )}

                        <div className="flex items-center justify-between pt-0.5 pl-5">
                          <div className="flex items-center gap-1.5">
                            {task.priority && task.priority !== 'medium' && (
                              <span className={`text-[11px] font-medium ${priorityColor}`}>
                                {task.priority}
                              </span>
                            )}
                            {task.due_date && (
                              <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(task.due_date), "MMM d")}
                              </span>
                            )}
                          </div>
                          {assigneeName && (
                            <Avatar className="h-5 w-5">
                              <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                                {assigneeName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}

                {/* Empty state */}
                {colTasks.length === 0 && (
                  <div
                    className={`flex-1 flex items-center justify-center rounded-lg text-sm transition-colors ${
                      isDragging && isOver
                        ? 'border-2 border-dashed border-primary/40 text-primary/60'
                        : isDragging
                        ? 'border-2 border-dashed border-muted-foreground/20 text-muted-foreground/40'
                        : 'text-muted-foreground/40'
                    }`}
                    style={{ minHeight: '80px' }}
                  >
                    {isDragging ? 'Drop here' : 'No tasks'}
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
