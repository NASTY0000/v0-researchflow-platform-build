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
  Send,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { ResearchIdea, Profile } from "@/lib/types/database"
import { formatDistanceToNow, format } from "date-fns"
import { Input } from "@/components/ui/input"
import { BookmarkButton } from "@/components/ui/bookmark-button"
import { shareContent } from "@/lib/utils/share"
import { BaobabLoader } from '@/components/ui/baobab-loader'

type IdeaComment = {
  id: string
  idea_id: string
  author_id: string
  content: string
  parent_id: string | null
  upvotes: number
  created_at: string
  author?: Profile
  user_has_upvoted?: boolean
}

interface IdeaWithAuthor extends ResearchIdea {
  author: Profile
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
  const [universityName, setUniversityName] = useState<string>("")
  const [showFlagDialog, setShowFlagDialog] = useState(false)
  const [flagReason, setFlagReason] = useState("")
  const [isFlagging, setIsFlagging] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)
  const [comments, setComments] = useState<IdeaComment[]>([])
  const [newComment, setNewComment] = useState("")
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [replyTo, setReplyTo] = useState<{ id: string; authorName: string } | null>(null)

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
          author:profiles!research_ideas_author_id_fkey(*)
        `)
        .eq("id", id)
        .single()

      if (error || !data) {
        router.push("/ideas")
        return
      }

      setIdea(data)

      // Resolve university UUID to name
      if (data.author?.university_id) {
        const uid = data.author.university_id
        if (uid.includes('-')) {
          const { data: uni } = await supabase
            .from('universities')
            .select('name')
            .eq('id', uid)
            .single()
          setUniversityName(uni?.name || '')
        } else {
          setUniversityName(uid)
        }
      }

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

      // Load comments
      const { data: commentData } = await supabase
        .from('idea_comments')
        .select('*, author:profiles!idea_comments_author_id_fkey(*)')
        .eq('idea_id', id)
        .order('created_at', { ascending: true })

      if (commentData) {
        const enriched = user
          ? await Promise.all(
              commentData.map(async (c) => {
                const { data: upvote } = await supabase
                  .from('idea_comment_upvotes')
                  .select('id')
                  .eq('comment_id', c.id)
                  .eq('user_id', user.id)
                  .maybeSingle()
                return { ...c, user_has_upvoted: !!upvote }
              })
            )
          : commentData
        setComments(enriched as IdeaComment[])
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

  async function handleShare() {
    if (!idea) return
    const result = await shareContent({
      title: `${idea.title} — ResearchFlow`,
      text: `Check out this research idea on ResearchFlow: ${idea.title}`,
      url: `https://researchflowafrica.com/ideas/${idea.id}`,
    })
    if (result.method === 'clipboard' && result.success) {
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 2000)
    }
  }

  async function handleFlag() {
    if (!flagReason.trim() || !idea || !currentUserId) return
    setIsFlagging(true)
    const supabase = createClient()
    await supabase.from('content_reports').insert({
      reporter_id: currentUserId,
      content_type: 'idea',
      content_id: idea.id,
      reason: flagReason.trim(),
      status: 'open',
    })
    setIsFlagging(false)
    setShowFlagDialog(false)
    setFlagReason("")
  }

  async function handleSubmitComment() {
    if (!newComment.trim() || !currentUserId || !idea) return
    setIsSubmittingComment(true)
    const supabase = createClient()

    const { data: inserted } = await supabase
      .from('idea_comments')
      .insert({
        idea_id: id,
        author_id: currentUserId,
        content: newComment.trim(),
        parent_id: replyTo?.id || null,
      })
      .select('*, author:profiles!idea_comments_author_id_fkey(*)')
      .single()

    if (inserted) {
      setComments(prev => [...prev, { ...inserted, user_has_upvoted: false } as IdeaComment])
      setIdea({ ...idea, comments_count: (idea.comments_count || 0) + 1 })
    }

    setNewComment("")
    setReplyTo(null)
    setIsSubmittingComment(false)
  }

  async function handleCommentUpvote(commentId: string, currentUpvotes: number, hasUpvoted: boolean) {
    if (!currentUserId) return
    const supabase = createClient()

    if (hasUpvoted) {
      await supabase.from('idea_comment_upvotes').delete().eq('comment_id', commentId).eq('user_id', currentUserId)
      await supabase.from('idea_comments').update({ upvotes: currentUpvotes - 1 }).eq('id', commentId)
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, upvotes: c.upvotes - 1, user_has_upvoted: false } : c))
    } else {
      await supabase.from('idea_comment_upvotes').insert({ comment_id: commentId, user_id: currentUserId })
      await supabase.from('idea_comments').update({ upvotes: currentUpvotes + 1 }).eq('id', commentId)
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, upvotes: c.upvotes + 1, user_has_upvoted: true } : c))
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <BaobabLoader size="md" />
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
      {/* Flag dialog */}
      {showFlagDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-background border rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="font-semibold text-lg">Report Content</h3>
            <p className="text-sm text-muted-foreground">Describe the issue with this post.</p>
            <Input
              placeholder="Reason for reporting..."
              value={flagReason}
              onChange={(e) => setFlagReason(e.target.value)}
            />
            <div className="flex gap-3">
              <Button
                variant="destructive"
                disabled={!flagReason.trim() || isFlagging}
                onClick={handleFlag}
                className="flex-1"
              >
                {isFlagging ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Reporting...</> : 'Submit Report'}
              </Button>
              <Button variant="outline" onClick={() => setShowFlagDialog(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

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

                <Button variant="outline" onClick={handleShare}>
                  <Share2 className="mr-2 h-4 w-4" />
                  {shareCopied ? 'Copied!' : 'Share'}
                </Button>

                {currentUserId && idea && (
                  <BookmarkButton contentType="idea" contentId={idea.id} />
                )}

                {currentUserId && !isAuthor && (
                  <Button variant="ghost" size="icon" onClick={() => setShowFlagDialog(true)}>
                    <Flag className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Discussion ({comments.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Comment input */}
              {currentUserId ? (
                <div className="space-y-2">
                  {replyTo && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg">
                      <span>Replying to <strong>{replyTo.authorName}</strong></span>
                      <button onClick={() => setReplyTo(null)} className="ml-auto hover:text-foreground">✕</button>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Share your thoughts or ask a question..."
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      rows={2}
                      className="flex-1 resize-none"
                      onKeyDown={e => {
                        if (e.key === 'Enter' && e.ctrlKey) {
                          e.preventDefault()
                          handleSubmitComment()
                        }
                      }}
                    />
                    <Button
                      size="icon"
                      onClick={handleSubmitComment}
                      disabled={!newComment.trim() || isSubmittingComment}
                      className="self-end"
                    >
                      {isSubmittingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Ctrl+Enter to submit</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Sign in to join the discussion
                </p>
              )}

              {/* Comment threads */}
              {comments.length === 0 ? (
                <div className="text-center py-6">
                  <MessageSquare className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No comments yet. Be the first to share your thoughts!</p>
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  {comments.filter(c => !c.parent_id).map(comment => (
                    <div key={comment.id} className="space-y-2">
                      <div className="flex gap-3">
                        <Link href={`/profile/${comment.author_id}`} className="flex-shrink-0">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={comment.author?.avatar_url || undefined} />
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {comment.author?.full_name?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                        </Link>
                        <div className="flex-1 min-w-0">
                          <div className="bg-muted/40 rounded-xl px-3 py-2">
                            <div className="flex items-baseline gap-2 mb-1">
                              <Link href={`/profile/${comment.author_id}`} className="text-sm font-medium hover:text-primary transition-colors">
                                {comment.author?.full_name || 'Researcher'}
                              </Link>
                              <span className="text-[11px] text-muted-foreground">
                                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                              </span>
                            </div>
                            <p className="text-sm text-foreground/90 whitespace-pre-wrap">{comment.content}</p>
                          </div>
                          <div className="flex items-center gap-3 mt-1 px-1">
                            <button
                              onClick={() => handleCommentUpvote(comment.id, comment.upvotes, comment.user_has_upvoted || false)}
                              disabled={!currentUserId}
                              className={`flex items-center gap-1 text-xs transition-colors ${comment.user_has_upvoted ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
                            >
                              <ChevronUp className={`h-3.5 w-3.5 ${comment.user_has_upvoted ? 'fill-primary' : ''}`} />
                              {comment.upvotes || 0}
                            </button>
                            {currentUserId && (
                              <button
                                onClick={() => setReplyTo({ id: comment.id, authorName: comment.author?.full_name || 'Researcher' })}
                                className="text-xs text-muted-foreground hover:text-primary transition-colors"
                              >
                                Reply
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Replies */}
                      {comments.filter(r => r.parent_id === comment.id).map(reply => (
                        <div key={reply.id} className="flex gap-3 pl-10">
                          <Link href={`/profile/${reply.author_id}`} className="flex-shrink-0">
                            <Avatar className="h-7 w-7">
                              <AvatarImage src={reply.author?.avatar_url || undefined} />
                              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                {reply.author?.full_name?.charAt(0) || '?'}
                              </AvatarFallback>
                            </Avatar>
                          </Link>
                          <div className="flex-1 min-w-0">
                            <div className="bg-muted/30 rounded-xl px-3 py-2">
                              <div className="flex items-baseline gap-2 mb-1">
                                <Link href={`/profile/${reply.author_id}`} className="text-sm font-medium hover:text-primary transition-colors">
                                  {reply.author?.full_name || 'Researcher'}
                                </Link>
                                <span className="text-[11px] text-muted-foreground">
                                  {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                                </span>
                              </div>
                              <p className="text-sm text-foreground/90 whitespace-pre-wrap">{reply.content}</p>
                            </div>
                            <div className="flex items-center gap-3 mt-1 px-1">
                              <button
                                onClick={() => handleCommentUpvote(reply.id, reply.upvotes, reply.user_has_upvoted || false)}
                                disabled={!currentUserId}
                                className={`flex items-center gap-1 text-xs transition-colors ${reply.user_has_upvoted ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
                              >
                                <ChevronUp className={`h-3.5 w-3.5 ${reply.user_has_upvoted ? 'fill-primary' : ''}`} />
                                {reply.upvotes || 0}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
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
                <Link href={`/profile/${idea.author_id}`} className="flex-shrink-0">
                  <Avatar className="h-14 w-14 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all duration-200">
                    <AvatarImage src={idea.author?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-lg">
                      {idea.author?.full_name?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div>
                  <Link href={`/profile/${idea.author_id}`} className="hover:text-primary hover:underline transition-colors">
                    <h4 className="font-semibold">{idea.author?.full_name || "Anonymous"}</h4>
                  </Link>
                  {idea.author?.department && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <GraduationCap className="h-3 w-3" />
                      {idea.author.department}
                    </p>
                  )}
                  {universityName && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {universityName}
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
              <div className="grid grid-cols-4 text-center divide-x divide-border">
                <div className="px-2">
                  <p className="text-2xl font-bold text-primary">{idea.upvotes || 0}</p>
                  <p className="text-xs text-muted-foreground">Upvotes</p>
                </div>
                <div className="px-2">
                  <p className="text-2xl font-bold">{idea.views || 0}</p>
                  <p className="text-xs text-muted-foreground">Views</p>
                </div>
                <div className="px-2">
                  <p className="text-2xl font-bold">{comments.length}</p>
                  <p className="text-xs text-muted-foreground">Comments</p>
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
