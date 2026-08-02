"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  UserPlus,
  MoreHorizontal,
  Mail,
  MessageSquare,
  Crown,
  GraduationCap,
  Loader2,
  Search,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Project, Team, Profile, ProjectJoinRequest } from "@/lib/types/database"
import { inviteByEmail } from "@/lib/actions/invitations"
import { respondToJoinRequest } from "@/lib/actions/projects"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { useEffect } from "react"
import { formatDistanceToNow } from "date-fns"

interface ProjectTeamProps {
  project: Project & {
    team: Team & {
      team_members: { user: Profile; role: string }[]
    }
  }
  currentUserId: string | null
}

const ROLES = [
  { value: "lead", label: "Team Lead", icon: Crown },
  { value: "researcher", label: "Researcher", icon: GraduationCap },
  { value: "contributor", label: "Contributor", icon: UserPlus },
]

export function ProjectTeam({ project, currentUserId }: ProjectTeamProps) {
  const [joinRequests, setJoinRequests]     = useState<ProjectJoinRequest[]>([])
  const [respondingId, setRespondingId]     = useState<string | null>(null)
  const [showInvite, setShowInvite]         = useState(false)
  const [inviteMode, setInviteMode] = useState<"search" | "email">("search")
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Profile[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("contributor")
  const [isInviting, setIsInviting] = useState(false)
  const [inviteSent, setInviteSent] = useState<string | null>(null)

  const members = project.team?.team_members || []
  const isLead = members.find((m) => m.user.id === currentUserId)?.role === "lead"

  useEffect(() => {
    if (!isLead) return
    const supabase = createClient()
    supabase
      .from('project_join_requests')
      .select('*, requester:profiles(id, full_name, avatar_url, department, level, skills)')
      .eq('project_id', project.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setJoinRequests(data as unknown as ProjectJoinRequest[]) })
  }, [isLead, project.id])

  async function handleRespond(requestId: string, action: 'accepted' | 'declined') {
    setRespondingId(requestId)
    const result = await respondToJoinRequest(requestId, action)
    setRespondingId(null)
    if ('error' in result && result.error) {
      toast.error(result.error)
      return
    }
    setJoinRequests(prev => prev.filter(r => r.id !== requestId))
    toast.success(action === 'accepted' ? 'Collaborator added to the team.' : 'Request declined.')
  }

  async function handleSearch(q: string) {
    setSearchQuery(q)
    if (q.trim().length < 2) { setSearchResults([]); return }
    setIsSearching(true)
    const supabase = createClient()
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, department, avatar_url, email")
      .ilike("full_name", `%${q.trim()}%`)
      .eq("public_profile", true)
      .limit(5)
    setSearchResults((data as Profile[]) || [])
    setIsSearching(false)
  }

  async function handleInviteUser(user: Profile) {
    if (!project.id) return
    setIsInviting(true)
    const result = await inviteByEmail(project.id, user.email!, inviteRole)
    if (result.error) { toast.error(result.error); setIsInviting(false); return }
    toast.success(`${user.full_name} added to the project!`)
    setShowInvite(false)
    setSearchQuery("")
    setSearchResults([])
    setIsInviting(false)
  }

  async function handleEmailInvite() {
    if (!inviteEmail.trim() || !project.id) return
    setIsInviting(true)
    const result = await inviteByEmail(project.id, inviteEmail.trim(), inviteRole)
    if (result.error) { toast.error(result.error); setIsInviting(false); return }

    if (result.existing) {
      toast.success(`${result.name} added to the project!`)
      setShowInvite(false)
    } else {
      setInviteSent(inviteEmail.trim())
      toast.success(`Invitation sent to ${inviteEmail.trim()}. They have 7 days to accept.`)
    }
    setInviteEmail("")
    setIsInviting(false)
  }

  function getRoleBadgeColor(role: string) {
    switch (role) {
      case "lead":
        return "bg-yellow-500/20 text-yellow-500 border-yellow-500/30"
      case "researcher":
        return "bg-primary/20 text-primary border-primary/30"
      default:
        return "bg-muted"
    }
  }

  return (
    <div className="space-y-6">
      {/* Team Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{project.team?.name || "Project Team"}</CardTitle>
              <CardDescription>{members.length} team members</CardDescription>
            </div>
            {isLead && (
              <Dialog open={showInvite} onOpenChange={setShowInvite}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite Member
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Invite Team Member</DialogTitle>
                    <DialogDescription>
                      Search for existing users or invite by email.
                    </DialogDescription>
                  </DialogHeader>

                  <Tabs value={inviteMode} onValueChange={(v) => setInviteMode(v as "search" | "email")}>
                    <TabsList className="w-full">
                      <TabsTrigger value="search" className="flex-1 gap-1"><Search className="h-3 w-3" />Find User</TabsTrigger>
                      <TabsTrigger value="email" className="flex-1 gap-1"><Mail className="h-3 w-3" />By Email</TabsTrigger>
                    </TabsList>

                    <TabsContent value="search" className="space-y-3 mt-3">
                      <Input
                        placeholder="Search by name..."
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                      />
                      {isSearching && <p className="text-xs text-center text-muted-foreground">Searching...</p>}
                      {searchResults.length > 0 && (
                        <div className="space-y-1 max-h-48 overflow-y-auto">
                          {searchResults.map(u => (
                            <div key={u.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                              <div>
                                <p className="text-sm font-medium">{u.full_name}</p>
                                <p className="text-xs text-muted-foreground">{u.department || u.email}</p>
                              </div>
                              <Button size="sm" onClick={() => handleInviteUser(u)} disabled={isInviting}>
                                Add
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                      {searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
                        <p className="text-xs text-center text-muted-foreground">No users found. Try inviting by email.</p>
                      )}
                    </TabsContent>

                    <TabsContent value="email" className="space-y-3 mt-3">
                      {inviteSent ? (
                        <div className="py-4 text-center space-y-2">
                          <Send className="h-8 w-8 mx-auto text-primary" />
                          <p className="text-sm font-medium">Invitation sent!</p>
                          <p className="text-xs text-muted-foreground">
                            Sent to <strong>{inviteSent}</strong>. They have 7 days to accept.
                          </p>
                          <Button size="sm" variant="outline" onClick={() => setInviteSent(null)}>
                            Invite another
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Email Address</label>
                            <Input
                              type="email"
                              placeholder="colleague@university.edu"
                              value={inviteEmail}
                              onChange={(e) => setInviteEmail(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Role</label>
                            <Select value={inviteRole} onValueChange={setInviteRole}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {ROLES.map((role) => (
                                  <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </>
                      )}
                    </TabsContent>
                  </Tabs>

                  {!inviteSent && (
                    <DialogFooter>
                      <Button variant="outline" onClick={() => { setShowInvite(false); setInviteSent(null) }}>
                        Cancel
                      </Button>
                      {inviteMode === "email" && (
                        <Button onClick={handleEmailInvite} disabled={isInviting || !inviteEmail.trim()}>
                          {isInviting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</> : "Send Invite"}
                        </Button>
                      )}
                    </DialogFooter>
                  )}
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {members.map((member) => {
              const RoleIcon = ROLES.find((r) => r.value === member.role)?.icon || GraduationCap

              return (
                <Card key={member.user.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={member.user.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {member.user.full_name?.charAt(0) || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{member.user.full_name}</h4>
                          {member.role === "lead" && (
                            <Crown className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {member.user.department || "Researcher"}
                        </p>
                        <Badge variant="outline" className={`mt-2 ${getRoleBadgeColor(member.role)}`}>
                          <RoleIcon className="mr-1 h-3 w-3" />
                          {ROLES.find((r) => r.value === member.role)?.label || member.role}
                        </Badge>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Message
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail className="mr-2 h-4 w-4" />
                          Send Email
                        </DropdownMenuItem>
                        {isLead && member.user.id !== currentUserId && (
                          <DropdownMenuItem className="text-destructive">
                            Remove from Team
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </Card>
              )
            })}
          </div>

          {members.length === 0 && (
            <div className="text-center py-12">
              <UserPlus className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">No team members yet</p>
              {isLead && (
                <Button className="mt-4" onClick={() => setShowInvite(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite First Member
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Join Requests, lead only */}
      {isLead && joinRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Collaboration Requests
              <Badge variant="secondary" className="ml-1">{joinRequests.length}</Badge>
            </CardTitle>
            <CardDescription>Researchers who want to join this project</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {joinRequests.map(req => {
              const requester = req.requester as (Profile & { level?: string; skills?: string[] }) | undefined
              const isResponding = respondingId === req.id
              return (
                <div key={req.id} className="rounded-lg border border-border p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={requester?.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {requester?.full_name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold">{requester?.full_name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">
                          {[requester?.department, (requester as Record<string, unknown>)?.level as string].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground shrink-0">
                      {formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}
                    </p>
                  </div>

                  {requester?.skills && requester.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {requester.skills.slice(0, 8).map(skill => (
                        <Badge key={skill} variant="outline" className="text-xs py-0">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <p className="text-sm text-muted-foreground leading-relaxed">{req.message}</p>

                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      onClick={() => handleRespond(req.id, 'accepted')}
                      disabled={isResponding}
                      className="gap-1.5"
                    >
                      {isResponding
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <CheckCircle2 className="h-3.5 w-3.5" />}
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRespond(req.id, 'declined')}
                      disabled={isResponding}
                      className="gap-1.5"
                    >
                      {isResponding
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <XCircle className="h-3.5 w-3.5" />}
                      Decline
                    </Button>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Team Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-primary">
              {members.filter((m) => m.role === "lead").length}
            </p>
            <p className="text-sm text-muted-foreground">Team Leads</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold">
              {members.filter((m) => m.role === "researcher").length}
            </p>
            <p className="text-sm text-muted-foreground">Researchers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold">
              {members.filter((m) => m.role === "contributor").length}
            </p>
            <p className="text-sm text-muted-foreground">Contributors</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
