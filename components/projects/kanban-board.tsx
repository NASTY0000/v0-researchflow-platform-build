"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  DialogTrigger,
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
  Clock,
  MoreHorizontal,
  Loader2,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
}

interface Column {
  id: string
  title: string
  color: string
}

const COLUMNS: Column[] = [
  { id: "todo", title: "To Do", color: "border-t-[#A855F7]" },
  { id: "in_progress", title: "In Progress", color: "border-t-[#06B6D4]" },
  { id: "review", title: "Review", color: "border-t-[#F59E0B]" },
  { id: "done", title: "Done", color: "border-t-[#22C55E]" },
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

export function KanbanBoard({ projectId, teamId, tasks: initialTasks }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [teamMembers, setTeamMembers] = useState<{ user: Profile }[]>([])
  const [showNewTask, setShowNewTask] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)

  // New task form
  const [newTitle, setNewTitle] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [newPriority, setNewPriority] = useState("medium")
  const [newAssignee, setNewAssignee] = useState("")
  const [newDueDate, setNewDueDate] = useState("")

  useEffect(() => {
    async function loadTeamMembers() {
      const supabase = createClient()
      const { data } = await supabase
        .from("team_members")
        .select("user:profiles(id, full_name, avatar_url)")
        .eq("team_id", teamId)

      if (data) {
        setTeamMembers(data)
      }
    }

    loadTeamMembers()
  }, [teamId])

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
        status: "todo",
        priority: newPriority,
        assignee_id: newAssignee || null,
        due_date: newDueDate || null,
      })
      .select()
      .single()

    if (data && !error) {
      setTasks([...tasks, data])
      setShowNewTask(false)
      setNewTitle("")
      setNewDescription("")
      setNewPriority("medium")
      setNewAssignee("")
      setNewDueDate("")
    }

    setIsCreating(false)
  }

  async function handleStatusChange(taskId: string, newStatus: string) {
    const supabase = createClient()

    await supabase.from("tasks").update({ status: newStatus }).eq("id", taskId)
    setTasks(tasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)))

    if (newStatus === "done") {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await completeAssignedTask(user.id, taskId)
      }
    }
  }

  async function handleDeleteTask(taskId: string) {
    const supabase = createClient()
    await supabase.from("tasks").delete().eq("id", taskId)
    setTasks(tasks.filter((t) => t.id !== taskId))
  }

  function handleDragStart(task: Task) {
    setDraggedTask(task)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
  }

  function handleDrop(e: React.DragEvent, columnId: string) {
    e.preventDefault()
    if (!draggedTask) return

    if (!navigator.onLine) {
      toast.error('Moving tasks requires internet connection. Please reconnect and try again.')
      setDraggedTask(null)
      return
    }

    handleStatusChange(draggedTask.id, columnId)
    setDraggedTask(null)
  }

  function getTasksByColumn(columnId: string) {
    return tasks.filter((task) => task.status === columnId)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">Task Board</h2>
          <Badge variant="secondary">{tasks.length} tasks</Badge>
        </div>
        <Dialog open={showNewTask} onOpenChange={setShowNewTask}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
              <DialogDescription>Add a new task to the project board.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  placeholder="Task title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Task description (optional)"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                <div className="space-y-2">
                  <Label>Assignee</Label>
                  <Select value={newAssignee} onValueChange={setNewAssignee}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select assignee" />
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
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewTask(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTask} disabled={isCreating || !newTitle.trim()}>
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Task"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Kanban Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {COLUMNS.map((column) => (
          <div
            key={column.id}
            className="space-y-3"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <div className={`p-3 rounded-xl border-t-2 ${column.color}`}
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.15)', borderTopColor: COLUMN_ACCENT[column.id], borderTopWidth: '2px' }}>
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm" style={{ color: COLUMN_ACCENT[column.id] }}>{column.title}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: `${COLUMN_ACCENT[column.id]}18`, color: COLUMN_ACCENT[column.id], border: `1px solid ${COLUMN_ACCENT[column.id]}30` }}>
                  {getTasksByColumn(column.id).length}
                </span>
              </div>
            </div>

            <div className="space-y-2 min-h-[200px]">
              {getTasksByColumn(column.id).map((task) => (
                <Card
                  key={task.id}
                  draggable
                  onDragStart={() => handleDragStart(task)}
                  className="cursor-grab active:cursor-grabbing transition-all duration-200"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: '12px' }}
                  onMouseOver={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(168,85,247,0.4)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 20px rgba(124,58,237,0.15)' }}
                  onMouseOut={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(139,92,246,0.15)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none' }}
                >
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="font-medium text-sm line-clamp-2">{task.title}</span>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeleteTask(task.id)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {task.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        {task.priority && (
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              PRIORITIES.find((p) => p.value === task.priority)?.color
                            }`}
                          >
                            {task.priority}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {task.due_date && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(task.due_date), "MMM d")}
                          </span>
                        )}
                        {task.assignee_id && (
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                              {teamMembers
                                .find((m) => m.user.id === task.assignee_id)
                                ?.user.full_name?.charAt(0) || "?"}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {getTasksByColumn(column.id).length === 0 && (
                <div className="h-32 rounded-xl flex items-center justify-center text-sm"
                  style={{ border: '2px dashed rgba(139,92,246,0.2)', color: 'var(--muted-foreground)' }}>
                  Drop tasks here
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
