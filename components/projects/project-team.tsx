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
} from "lucide-react"
import type { Project, Team, Profile } from "@/lib/types/database"

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
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("contributor")
  const [isInviting, setIsInviting] = useState(false)

  const members = project.team?.team_members || []
  const isLead = members.find((m) => m.user.id === currentUserId)?.role === "lead"

  async function handleInvite() {
    if (!inviteEmail.trim()) return

    setIsInviting(true)
    // In a real app, send invite email/notification
    console.log("Inviting:", inviteEmail, "as", inviteRole)

    setTimeout(() => {
      setIsInviting(false)
      setShowInvite(false)
      setInviteEmail("")
      setInviteRole("contributor")
    }, 1000)
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
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite Team Member</DialogTitle>
                    <DialogDescription>
                      Send an invitation to join this research project.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
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
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLES.map((role) => (
                            <SelectItem key={role.value} value={role.value}>
                              {role.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowInvite(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleInvite} disabled={isInviting || !inviteEmail.trim()}>
                      {isInviting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        "Send Invite"
                      )}
                    </Button>
                  </DialogFooter>
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
