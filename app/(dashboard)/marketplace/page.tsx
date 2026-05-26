"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Briefcase,
  Search,
  Plus,
  Clock,
  Zap,
  Calendar,
  Trophy,
  Loader2,
  CheckCircle,
  Building2,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { MarketplaceTask, Profile } from "@/lib/types/database"
import { completeMarketplaceTask } from "@/lib/actions/akili"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"

interface TaskWithPoster extends MarketplaceTask {
  poster: Profile
  posted_by: string
  budget_max: number | null
  budget_min: number | null
}

interface LeaderboardEntry {
  user_id: string
  full_name: string | null
  avatar_url: string | null
  university_id: string | null
  tasks_completed: number
  points_earned: number
}

const CATEGORIES = [
  "All Categories",
  "Data Analysis",
  "Literature Review",
  "Statistical Analysis",
  "Coding/Programming",
  "Survey Design",
  "Transcription",
  "Translation",
  "Editing/Proofreading",
  "Graphic Design",
  "Other",
]

const SKILLS_REQUIRED = [
  "Python",
  "R",
  "SPSS",
  "STATA",
  "Excel",
  "Machine Learning",
  "NLP",
  "Data Visualization",
  "Technical Writing",
  "Qualitative Analysis",
]

export default function MarketplacePage() {
  const [tasks, setTasks] = useState<TaskWithPoster[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All Categories")
  const [showNewTask, setShowNewTask] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // New task form
  const [newTitle, setNewTitle] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [newCategory, setNewCategory] = useState("")
  const [newAkiliReward, setNewAkiliReward] = useState("50")
  const [newDeadline, setNewDeadline] = useState("")
  const [newSkills, setNewSkills] = useState<string[]>([])
  const [isCreating, setIsCreating] = useState(false)

  // Task completion
  const [manageTask, setManageTask] = useState<TaskWithPoster | null>(null)
  const [isCompleting, setIsCompleting] = useState(false)

  // Leaderboard
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])

  useEffect(() => {
    loadTasks()
    loadLeaderboard()
  }, [selectedCategory, searchQuery])

  async function loadTasks() {
    setIsLoading(true)
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (user) setCurrentUserId(user.id)

    let query = supabase
      .from("marketplace_tasks")
      .select(`*, poster:profiles!marketplace_tasks_posted_by_fkey(id, full_name, avatar_url, university_id)`)
      .eq("status", "open")
      .order("created_at", { ascending: false })

    if (selectedCategory !== "All Categories") {
      query = query.eq("category", selectedCategory)
    }
    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
    }

    const { data, error } = await query.limit(50)
    if (data && !error) setTasks(data as TaskWithPoster[])
    setIsLoading(false)
  }

  async function loadLeaderboard() {
    try {
      const supabase = createClient()
      const monthStart = new Date()
      monthStart.setDate(1)
      monthStart.setHours(0, 0, 0, 0)

      const { data: events } = await supabase
        .from("akili_score_events")
        .select("user_id, points_earned, event_type")
        .in("event_type", ["completeMarketplaceTask", "receive4to5StarOnMarketplaceTask"])
        .gte("created_at", monthStart.toISOString())

      if (!events || events.length === 0) return

      const userMap: Record<string, { points: number; tasks: number }> = {}
      for (const event of events) {
        if (!userMap[event.user_id]) userMap[event.user_id] = { points: 0, tasks: 0 }
        userMap[event.user_id].points += event.points_earned
        if (event.event_type === "completeMarketplaceTask") userMap[event.user_id].tasks++
      }

      const sorted = Object.entries(userMap)
        .sort(([, a], [, b]) => b.points - a.points)
        .slice(0, 5)

      if (!sorted.length) return

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, university_id")
        .in("id", sorted.map(([id]) => id))

      setLeaderboard(
        sorted.map(([userId, stats]) => {
          const profile = profiles?.find((p) => p.id === userId)
          return {
            user_id: userId,
            full_name: profile?.full_name || null,
            avatar_url: profile?.avatar_url || null,
            university_id: profile?.university_id || null,
            tasks_completed: stats.tasks,
            points_earned: stats.points,
          }
        })
      )
    } catch {
      // leaderboard is non-critical
    }
  }

  async function handleCreateTask() {
    if (!newTitle.trim() || !newDescription.trim() || !newCategory) return

    setIsCreating(true)
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setIsCreating(false); return }

    const reward = Math.min(500, Math.max(1, parseInt(newAkiliReward) || 50))

    const { error } = await supabase.from("marketplace_tasks").insert({
      posted_by: user.id,
      title: newTitle.trim(),
      description: newDescription.trim(),
      category: newCategory,
      budget_max: reward,
      deadline: newDeadline || null,
      required_skills: newSkills,
      status: "open",
    })

    if (!error) {
      setShowNewTask(false)
      resetNewTaskForm()
      loadTasks()
    }

    setIsCreating(false)
  }

  async function handleCompleteTask() {
    if (!manageTask) return
    setIsCompleting(true)

    const supabase = createClient()
    const reward = manageTask.budget_max || 50

    await supabase
      .from("marketplace_tasks")
      .update({ status: "completed" })
      .eq("id", manageTask.id)

    if (manageTask.assigned_to) {
      completeMarketplaceTask(manageTask.assigned_to, manageTask.id).catch(() => {})
      toast.success(`Task complete! Akili points awarded to the researcher.`)
    } else {
      toast.success("Task marked as complete.")
    }

    setManageTask(null)
    setIsCompleting(false)
    loadTasks()
  }

  function resetNewTaskForm() {
    setNewTitle("")
    setNewDescription("")
    setNewCategory("")
    setNewAkiliReward("50")
    setNewDeadline("")
    setNewSkills([])
  }

  function toggleSkill(skill: string) {
    if (newSkills.includes(skill)) {
      setNewSkills(newSkills.filter((s) => s !== skill))
    } else if (newSkills.length < 5) {
      setNewSkills([...newSkills, skill])
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading flex items-center gap-2">
            <Briefcase className="h-8 w-8 text-primary" />
            Task Marketplace
          </h1>
          <p className="text-muted-foreground mt-1">
            Find research tasks or post your own for collaborators
          </p>
        </div>
        <Dialog open={showNewTask} onOpenChange={setShowNewTask}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Post Task
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Post a Task</DialogTitle>
              <DialogDescription>
                Posting is always free. Set an Akili Points reward to attract applicants.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  placeholder="e.g., Need help with statistical analysis"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Describe the task in detail..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.filter((c) => c !== "All Categories").map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Akili Points reward */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" style={{ color: '#A855F7' }} />
                  Akili Points Reward (1–500)
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={500}
                  placeholder="50"
                  value={newAkiliReward}
                  onChange={(e) => setNewAkiliReward(e.target.value)}
                />
                <p className="text-xs" style={{ color: '#7C6A9C' }}>
                  Set the Akili Points reward for whoever completes this task. Higher rewards attract more applicants.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Deadline</Label>
                <Input
                  type="date"
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Required Skills (select up to 5)</Label>
                <div className="flex flex-wrap gap-2">
                  {SKILLS_REQUIRED.map((skill) => (
                    <Badge
                      key={skill}
                      variant={newSkills.includes(skill) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleSkill(skill)}
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewTask(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateTask}
                disabled={isCreating || !newTitle.trim() || !newDescription.trim() || !newCategory}
              >
                {isCreating ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Posting...</>
                ) : (
                  "Post Task"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Task grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-muted rounded w-3/4 mb-3" />
                <div className="h-4 bg-muted rounded w-full mb-2" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : tasks.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => (
            <Card key={task.id} className="hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                {/* Category + reward */}
                <div className="flex items-start justify-between mb-3">
                  <Badge variant="secondary">{task.category}</Badge>
                  {task.budget_max ? (
                    <span className="text-sm font-semibold flex items-center gap-1" style={{ color: '#C084FC' }}>
                      <Zap className="h-3.5 w-3.5" />
                      {task.budget_max} Akili Points
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(139,92,246,0.2)', color: '#9D8BB8' }}>
                      Earn Akili Points
                    </span>
                  )}
                </div>

                <h3 className="font-semibold text-lg mb-2 line-clamp-2">{task.title}</h3>
                <p className="text-muted-foreground text-sm line-clamp-3 mb-4">{task.description}</p>

                {/* Skills */}
                {task.required_skills && task.required_skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {task.required_skills.slice(0, 3).map((skill) => (
                      <Badge key={skill} variant="outline" className="text-xs">{skill}</Badge>
                    ))}
                    {task.required_skills.length > 3 && (
                      <Badge variant="outline" className="text-xs">+{task.required_skills.length - 3}</Badge>
                    )}
                  </div>
                )}

                {/* Meta */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                  {task.deadline && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Due {formatDistanceToNow(new Date(task.deadline), { addSuffix: false })}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
                  </span>
                </div>

                {/* Poster & actions */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <Link href={`/profile/${task.posted_by}`} className="flex items-center gap-2 group">
                    <Avatar className="h-6 w-6 cursor-pointer group-hover:ring-2 group-hover:ring-primary/50 transition-all duration-200">
                      <AvatarImage src={task.poster?.avatar_url || undefined} />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {task.poster?.full_name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm truncate max-w-[100px] group-hover:text-primary group-hover:underline transition-colors">
                      {task.poster?.full_name || "Anonymous"}
                    </span>
                  </Link>
                  {task.posted_by === currentUserId ? (
                    <Button size="sm" variant="outline" onClick={() => setManageTask(task)}>
                      Manage
                    </Button>
                  ) : (
                    <Button size="sm">Apply</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Briefcase className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No tasks found</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery || selectedCategory !== "All Categories"
                ? "Try adjusting your filters"
                : "Be the first to post a task!"}
            </p>
            <Button onClick={() => setShowNewTask(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Post a Task
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Monthly leaderboard */}
      <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.2)' }}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg,rgba(245,158,11,0.25),rgba(245,158,11,0.1))', border: '1px solid rgba(245,158,11,0.3)' }}>
            <Trophy className="w-5 h-5" style={{ color: '#F59E0B' }} />
          </div>
          <div>
            <h2 className="font-bold font-heading text-lg">Top Contributors This Month</h2>
            <p className="text-xs" style={{ color: '#7C6A9C' }}>Ranked by Akili Points earned from marketplace tasks</p>
          </div>
        </div>

        {leaderboard.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: '#7C6A9C' }}>
            No marketplace completions this month yet. Be the first!
          </p>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((entry, index) => {
              const isWinner = index === 0
              return (
                <div
                  key={entry.user_id}
                  className="flex items-center gap-4 p-3 rounded-xl"
                  style={{
                    background: isWinner ? 'rgba(245,158,11,0.06)' : 'rgba(255,255,255,0.02)',
                    border: isWinner ? '1px solid rgba(245,158,11,0.25)' : '1px solid rgba(139,92,246,0.1)',
                  }}
                >
                  {/* Rank */}
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
                    style={{
                      background: isWinner ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.05)',
                      color: isWinner ? '#F59E0B' : '#7C6A9C',
                    }}>
                    {index + 1}
                  </div>

                  {/* Avatar */}
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarImage src={entry.avatar_url || undefined} />
                    <AvatarFallback className="text-sm" style={{ background: 'rgba(124,58,237,0.2)', color: '#C084FC' }}>
                      {entry.full_name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm truncate">{entry.full_name || 'Researcher'}</span>
                      {isWinner && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#F59E0B' }}>
                          ResearchFlow Expert
                        </span>
                      )}
                    </div>
                    {entry.university_id && (
                      <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: '#7C6A9C' }}>
                        <Building2 className="w-3 h-3" />
                        {entry.university_id}
                      </p>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="text-right shrink-0">
                    <p className="font-bold text-sm flex items-center gap-1 justify-end" style={{ color: '#C084FC' }}>
                      <Zap className="w-3.5 h-3.5" />
                      {entry.points_earned.toLocaleString()}
                    </p>
                    <p className="text-[10px]" style={{ color: '#7C6A9C' }}>
                      {entry.tasks_completed} task{entry.tasks_completed !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Manage / Complete Task dialog */}
      <Dialog open={!!manageTask} onOpenChange={(open) => { if (!open) setManageTask(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Task</DialogTitle>
            <DialogDescription className="line-clamp-2">
              {manageTask?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Reward info */}
            <div className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)' }}>
              <Zap className="w-5 h-5 shrink-0" style={{ color: '#A855F7' }} />
              <div>
                <p className="text-sm font-semibold" style={{ color: '#C084FC' }}>
                  {manageTask?.budget_max || 50} Akili Points reward
                </p>
                <p className="text-xs" style={{ color: '#7C6A9C' }}>
                  Will be awarded to the researcher who completes this task
                </p>
              </div>
            </div>

            {/* Assignee status */}
            {manageTask?.assigned_to ? (
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Researcher assigned — points will be awarded on completion</span>
              </div>
            ) : (
              <p className="text-sm" style={{ color: '#7C6A9C' }}>
                No researcher assigned yet. Points will be awarded once an assignee is set.
              </p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setManageTask(null)}>
              Close
            </Button>
            <Button
              onClick={handleCompleteTask}
              disabled={isCompleting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isCompleting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Completing...</>
              ) : (
                <><CheckCircle className="mr-2 h-4 w-4" />Mark Complete</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
