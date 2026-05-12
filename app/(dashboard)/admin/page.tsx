'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  Search, Users, FileText, Shield, AlertTriangle, CheckCircle,
  XCircle, Eye, Ban, MoreVertical, TrendingUp, Activity,
  Building2, GraduationCap, Briefcase
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import type { Profile, MentorProfile, University } from '@/lib/types/database'

type MentorWithProfile = MentorProfile & {
  user: Profile & { university?: University }
}

export default function AdminPage() {
  const router = useRouter()
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingMentors: 0,
    activeProjects: 0,
    publishedResearch: 0,
  })
  const [pendingMentors, setPendingMentors] = useState<MentorWithProfile[]>([])
  const [users, setUsers] = useState<(Profile & { university?: University })[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const supabase = createClient()

  useEffect(() => {
    loadAdminData()
  }, [])

  async function loadAdminData() {
    setIsLoading(true)

    // Load stats
    const [usersCount, mentorsCount, projectsCount, showcaseCount] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('mentor_profiles').select('id', { count: 'exact', head: true }).eq('is_verified', false),
      supabase.from('projects').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('showcase_entries').select('id', { count: 'exact', head: true }).in('status', ['published', 'featured']),
    ])

    setStats({
      totalUsers: usersCount.count || 0,
      pendingMentors: mentorsCount.count || 0,
      activeProjects: projectsCount.count || 0,
      publishedResearch: showcaseCount.count || 0,
    })

    // Load pending mentor verifications
    const { data: mentors } = await supabase
      .from('mentor_profiles')
      .select(`
        *,
        user:profiles(*, university:universities(*))
      `)
      .eq('is_verified', false)
      .order('created_at', { ascending: false })

    if (mentors) {
      setPendingMentors(mentors as MentorWithProfile[])
    }

    // Load recent users
    const { data: recentUsers } = await supabase
      .from('profiles')
      .select(`*, university:universities(*)`)
      .order('created_at', { ascending: false })
      .limit(50)

    if (recentUsers) {
      setUsers(recentUsers as (Profile & { university?: University })[])
    }

    setIsLoading(false)
  }

  async function approveMentor(mentorId: string) {
    const { error } = await supabase
      .from('mentor_profiles')
      .update({ is_verified: true })
      .eq('id', mentorId)

    if (!error) {
      loadAdminData()
    }
  }

  async function rejectMentor(mentorId: string) {
    const { error } = await supabase
      .from('mentor_profiles')
      .delete()
      .eq('id', mentorId)

    if (!error) {
      loadAdminData()
    }
  }

  const getTierLabel = (tier: number) => {
    switch (tier) {
      case 1: return 'Faculty'
      case 2: return 'Postgraduate'
      case 3: return 'Industry'
      default: return 'Unknown'
    }
  }

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.department?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-heading">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Manage users, verify mentors, and monitor platform activity
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
                <p className="text-xs text-muted-foreground">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/10 to-transparent border-yellow-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pendingMentors}</p>
                <p className="text-xs text-muted-foreground">Pending Mentors</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Activity className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.activeProjects}</p>
                <p className="text-xs text-muted-foreground">Active Projects</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-accent/10 to-transparent border-accent/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.publishedResearch}</p>
                <p className="text-xs text-muted-foreground">Published Research</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="mentors" className="space-y-4">
        <TabsList>
          <TabsTrigger value="mentors" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Mentor Verification
            {stats.pendingMentors > 0 && (
              <Badge variant="destructive" className="ml-1">{stats.pendingMentors}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Content Moderation
          </TabsTrigger>
        </TabsList>

        {/* Mentor Verification Tab */}
        <TabsContent value="mentors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Mentor Verifications</CardTitle>
              <CardDescription>
                Review and approve mentor applications
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-lg border animate-pulse">
                      <div className="w-12 h-12 rounded-full bg-muted" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-1/3" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : pendingMentors.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="font-medium">All caught up!</h3>
                  <p className="text-sm text-muted-foreground">
                    No pending mentor verifications at this time.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingMentors.map(mentor => (
                    <div key={mentor.id} className="flex items-start gap-4 p-4 rounded-lg border">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={mentor.user?.avatar_url || undefined} />
                        <AvatarFallback>
                          {mentor.user?.full_name?.charAt(0) || 'M'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-medium">{mentor.user?.full_name}</h4>
                            <p className="text-sm text-muted-foreground">{mentor.user?.email}</p>
                          </div>
                          <Badge variant="outline">
                            Tier {mentor.tier}: {getTierLabel(mentor.tier)}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                          {mentor.user?.university && (
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3.5 h-3.5" />
                              {mentor.user.university.name}
                            </span>
                          )}
                          {mentor.user?.department && (
                            <span className="flex items-center gap-1">
                              <GraduationCap className="w-3.5 h-3.5" />
                              {mentor.user.department}
                            </span>
                          )}
                        </div>
                        {mentor.specializations && mentor.specializations.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {mentor.specializations.map(spec => (
                              <Badge key={spec} variant="secondary" className="text-xs">
                                {spec}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-2 mt-4">
                          <Button size="sm" onClick={() => approveMentor(mentor.id)}>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => rejectMentor(mentor.id)}>
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => toast('Document viewing coming soon')}>
                            <Eye className="w-4 h-4 mr-1" />
                            View Documents
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>
                    View and manage platform users
                  </CardDescription>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>University</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map(user => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">
                              {user.full_name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{user.full_name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{user.university?.name || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.roles?.slice(0, 2).map(role => (
                            <Badge key={role} variant="outline" className="text-xs">
                              {role.replace('_', ' ')}
                            </Badge>
                          ))}
                          {user.roles && user.roles.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{user.roles.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {new Date(user.created_at).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        {user.onboarding_completed ? (
                          <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-500">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            Onboarding
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="w-8 h-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/profile/${user.id}`)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => toast('User suspension coming soon')}>
                              <Ban className="w-4 h-4 mr-2" />
                              Suspend User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Moderation Tab */}
        <TabsContent value="content">
          <Card className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-medium mb-2">Content moderation coming soon</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Review and moderate user-generated content, research ideas, and showcase entries.
            </p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
