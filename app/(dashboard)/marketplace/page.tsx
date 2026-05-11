"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  DollarSign,
  Tag,
  Users,
  Star,
  Loader2,
  MapPin,
  Calendar,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { MarketplaceTask, Profile } from "@/lib/types/database"
import { formatDistanceToNow } from "date-fns"

interface TaskWithPoster extends MarketplaceTask {
  poster: Profile
  _count?: { applications: number }
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
  const [activeTab, setActiveTab] = useState("browse")
  const [showNewTask, setShowNewTask] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // New task form
  const [newTitle, setNewTitle] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [newCategory, setNewCategory] = useState("")
  const [newBudgetMin, setNewBudgetMin] = useState("")
  const [newBudgetMax, setNewBudgetMax] = useState("")
  const [newDeadline, setNewDeadline] = useState("")
  const [newSkills, setNewSkills] = useState<string[]>([])
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    loadTasks()
  }, [selectedCategory, searchQuery])

  async function loadTasks() {
    setIsLoading(true)
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (user) setCurrentUserId(user.id)

    let query = supabase
      .from("marketplace_tasks")
      .select(`
        *,
        poster:profiles!marketplace_tasks_posted_by_fkey(id, full_name, avatar_url)
      `)
      .eq("status", "open")
      .order("created_at", { ascending: false })

    if (selectedCategory !== "All Categories") {
      query = query.eq("category", selectedCategory)
    }

    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
    }

    const { data, error } = await query.limit(50)

    if (data && !error) {
      setTasks(data)
    }

    setIsLoading(false)
  }

  async function handleCreateTask() {
    if (!newTitle.trim() || !newDescription.trim() || !newCategory) return

    setIsCreating(true)
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setIsCreating(false)
      return
    }

    const { error } = await supabase.from("marketplace_tasks").insert({
      posted_by: user.id,
      title: newTitle.trim(),
      description: newDescription.trim(),
      category: newCategory,
      budget_min: newBudgetMin ? parseInt(newBudgetMin) : null,
      budget_max: newBudgetMax ? parseInt(newBudgetMax) : null,
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

  function resetNewTaskForm() {
    setNewTitle("")
    setNewDescription("")
    setNewCategory("")
    setNewBudgetMin("")
    setNewBudgetMax("")
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
                Describe the task you need help with
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
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Min Budget ($)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={newBudgetMin}
                    onChange={(e) => setNewBudgetMin(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Budget ($)</Label>
                  <Input
                    type="number"
                    placeholder="100"
                    value={newBudgetMax}
                    onChange={(e) => setNewBudgetMax(e.target.value)}
                  />
                </div>
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
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Posting...
                  </>
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
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tasks */}
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
                <div className="flex items-start justify-between mb-3">
                  <Badge variant="secondary">{task.category}</Badge>
                  {task.budget_min || task.budget_max ? (
                    <span className="text-sm font-semibold text-green-500 flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      {task.budget_min && task.budget_max
                        ? `${task.budget_min}-${task.budget_max}`
                        : task.budget_max || task.budget_min}
                    </span>
                  ) : (
                    <Badge variant="outline">Negotiable</Badge>
                  )}
                </div>

                <h3 className="font-semibold text-lg mb-2 line-clamp-2">{task.title}</h3>
                <p className="text-muted-foreground text-sm line-clamp-3 mb-4">{task.description}</p>

                {/* Skills */}
                {task.required_skills && task.required_skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {task.required_skills.slice(0, 3).map((skill) => (
                      <Badge key={skill} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {task.required_skills.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{task.required_skills.length - 3}
                      </Badge>
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

                {/* Poster & Actions */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={task.poster?.avatar_url || undefined} />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {task.poster?.full_name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm truncate max-w-[100px]">
                      {task.poster?.full_name || "Anonymous"}
                    </span>
                  </div>
                  <Button size="sm" variant={task.posted_by === currentUserId ? "outline" : "default"}>
                    {task.posted_by === currentUserId ? "Manage" : "Apply"}
                  </Button>
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
    </div>
  )
}
