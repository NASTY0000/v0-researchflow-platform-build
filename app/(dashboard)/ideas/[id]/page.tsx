"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
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
  ArrowLeft,
  ChevronUp,
  Eye,
  Clock,
  Users,
  Calendar,
  Share2,
  Flag,
  MessageSquare,
  UserPlus,
  Loader2,
  GraduationCap,
  Building2,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { ResearchIdea, Profile } from "@/lib/types/database"
import { formatDistanceToNow, format } from "date-fns"

interface IdeaWithAuthor extends ResearchIdea {
  author: Profile & { university?: { name: string } }
}

export default function IdeaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [idea, setIdea] = useState<IdeaWithAuthor | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [hasUpvoted, setHasUpvoted] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionMessage, setConnectionMessage] = useState("")
  const [showConnectDialog, setShowConnectDialog] = useState(false)

  useEffect(() => {
    async function loadIdea() {
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (user) setCurrentUserId(user.id)

      // Load idea with author details
      const { data, error } = await supabase
        .from("research_ideas")
        .select(`
          *,
          author:profiles!research_ideas_author_id_fkey(
            *,
            university:universities(name)
          )
        `)
        .eq("id", id)
        .single()

      if (error || !data) {
        router.push("/ideas")
        return
      }

      setIdea(data)

      // Increment views
      await supabase
        .from("research_ideas")
        .update({ views: (data.views || 0) + 1 })
        .eq("id", id)

      // Check if user has upvoted
      if (user) {
        const { data: upvote } = await supabase
          .from("idea_upvotes")
          .select("id")
          .eq("idea_id", id)
          .eq("user_id", user.id)
          .single()

        setHasUpvoted(!!upvote)
      }

      setIsLoading(false)
    }

    loadIdea()
  }, [id, router])

  async function handleUpvote() {
    if (!currentUserId || !idea) return

    const supabase = createClient()

    if (hasUpvoted) {
      await supabase.from("idea_upvotes").delete().eq("idea_id", id).eq("user_id", currentUserId)
      setIdea({ ...idea, upvotes: (idea.upvotes || 0) - 1 })
    } else {
      await supabase.from("idea_upvotes").insert({ idea_id: id, user_id: currentUserId })
      setIdea({ ...idea, upvotes: (idea.upvotes || 0) + 1 })
    }

    setHasUpvoted(!hasUpvoted)
  }

  async function handleConnect() {
    if (!currentUserId || !idea) return

    setIsConnecting(true)
    const supabase = createClient()

    try {
      // Create connection request
      const { error } = await supabase.from("connections").insert({
        requester_id: currentUserId,
        recipient_id: idea.author_id,
        connection_type: "collaboration",
        message: connectionMessage || `I'm interested in collaborating on "${idea.title}"`,
        idea_id: idea.id,
        status: "pending",
      })

      if (!error) {
        // Create notification for author
        await supabase.from("notifications").insert({
          user_id: idea.author_id,
          type: "connection_request",
          title: "New Collaboration Request",
          message: `Someone wants to collaborate on your idea "${idea.title}"`,
          link: `/ideas/${idea.id}`,
        })

        setShowConnectDialog(false)
        setConnectionMessage("")
        // Show success message (could use toast here)
      }
    } catch (err) {
      console.error("Error connecting:", err)
    }

    setIsConnecting(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading idea...</p>
        </div>
      </div>
    )
  }

  if (!idea) {
    return null
  }

  const isAuthor = currentUserId === idea.author_id

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/ideas">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <Badge variant="secondary">{idea.research_area}</Badge>
        {idea.is_featured && (
          <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">Featured</Badge>
        )}
        <Badge
          variant="outline"
          className={
            idea.collaboration_type === "open"
              ? "border-green-500/30 text-green-500"
              : idea.collaboration_type === "invite_only"
              ? "border-yellow-500/30 text-yellow-500"
              : "border-primary/30 text-primary"
          }
        >
          {idea.collaboration_type === "open"
            ? "Open Collaboration"
            : idea.collaboration_type === "invite_only"
            ? "Invite Only"
            : "Team Based"}
        </Badge>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-heading">{idea.title}</CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(idea.created_at), "MMM d, yyyy")}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {idea.views || 0} views
                </span>
                {idea.estimated_duration && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {idea.estimated_duration}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="prose prose-invert max-w-none">
                <p className="whitespace-pre-wrap text-foreground/90">{idea.description}</p>
              </div>

              {/* Tags */}
              {idea.tags && idea.tags.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {idea.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Roles Needed */}
              {idea.roles_needed && idea.roles_needed.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Looking for
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {idea.roles_needed.map((role) => (
                      <Badge key={role} variant="outline">
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills Needed */}
              {idea.skills_needed && idea.skills_needed.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Required Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {idea.skills_needed.map((skill) => (
                      <Badge key={skill} variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4">
                <Button
                  variant={hasUpvoted ? "default" : "outline"}
                  onClick={handleUpvote}
                  disabled={!currentUserId}
                >
                  <ChevronUp className={`mr-1 h-4 w-4 ${hasUpvoted ? "fill-current" : ""}`} />
                  Upvote ({idea.upvotes || 0})
                </Button>

                <Button variant="outline">
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>

                <Button variant="ghost" size="icon">
                  <Flag className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Author Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Posted by</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={idea.author?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-lg">
                    {idea.author?.full_name?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold">{idea.author?.full_name || "Anonymous"}</h4>
                  {idea.author?.department && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <GraduationCap className="h-3 w-3" />
                      {idea.author.department}
                    </p>
                  )}
                  {idea.author?.university && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {idea.author.university.name}
                    </p>
                  )}
                </div>
              </div>

              {idea.author?.bio && (
                <p className="text-sm text-muted-foreground line-clamp-3">{idea.author.bio}</p>
              )}

              {idea.author?.skills && idea.author.skills.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {idea.author.skills.slice(0, 5).map((skill) => (
                    <Badge key={skill} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              )}

              {!isAuthor && currentUserId && (
                <div className="space-y-2 pt-2">
                  <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
                    <DialogTrigger asChild>
                      <Button className="w-full">
                        <UserPlus className="mr-2 h-4 w-4" />
                        Connect to Collaborate
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Request to Collaborate</DialogTitle>
                        <DialogDescription>
                          Send a message to {idea.author?.full_name} explaining why you&apos;d like to collaborate on this
                          idea.
                        </DialogDescription>
                      </DialogHeader>
                      <Textarea
                        placeholder="I'm interested in collaborating because..."
                        value={connectionMessage}
                        onChange={(e) => setConnectionMessage(e.target.value)}
                        rows={4}
                      />
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowConnectDialog(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleConnect} disabled={isConnecting}>
                          {isConnecting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            "Send Request"
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/messages?user=${idea.author_id}`}>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Message
                    </Link>
                  </Button>
                </div>
              )}

              {isAuthor && (
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/ideas/${idea.id}/edit`}>Edit Idea</Link>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Stats Card */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-3 text-center divide-x divide-border">
                <div className="px-2">
                  <p className="text-2xl font-bold text-primary">{idea.upvotes || 0}</p>
                  <p className="text-xs text-muted-foreground">Upvotes</p>
                </div>
                <div className="px-2">
                  <p className="text-2xl font-bold">{idea.views || 0}</p>
                  <p className="text-xs text-muted-foreground">Views</p>
                </div>
                <div className="px-2">
                  <p className="text-2xl font-bold">{idea.roles_needed?.length || 0}</p>
                  <p className="text-xs text-muted-foreground">Roles</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
