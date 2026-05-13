'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Search, Users, FileText, Shield, AlertTriangle, CheckCircle,
  XCircle, Eye, Ban, MoreVertical, Activity, Building2,
  GraduationCap, ArrowLeft, CheckCircle2, X, MessageSquare
} from 'lucide-react'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import type { Profile, MentorProfile } from '@/lib/types/database'
import {
  showcaseApproved,
  collaboratedProjectReachesShowcase,
  menteeSubmitsToShowcase,
  awardAkiliPoints,
} from '@/lib/actions/akili'

type MentorWithProfile = MentorProfile & { user: Profile }

interface PendingSubmission {
  id: string
  project_id: string | null
  submitted_by: string
  title: string
  abstract: string
  research_area_tags: string[]
  methodology_tags: string[]
  pdf_url: string | null
  visibility: 'public' | 'university'
  status: string
  admin_notes: string | null
  submitted_at: string
  submitter?: Profile
}

export default function AdminPage() {
  const router = useRouter()
  const [stats, setStats] = useState({
    totalUsers: 0, pendingMentors: 0, activeProjects: 0,
    publishedResearch: 0, pendingSubmissions: 0,
  })
  const [pendingMentors, setPendingMentors] = useState<MentorWithProfile[]>([])
  const [users, setUsers] = useState<Profile[]>([])
  const [pendingSubmissions, setPendingSubmissions] = useState<PendingSubmission[]>([])
  const [selectedSubmission, setSelectedSubmission] = useState<PendingSubmission | null>(null)
  const [reviewAction, setReviewAction] = useState<'approve' | 'revise' | 'reject' | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [reviewing, setReviewing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const supabase = createClient()

  useEffect(() => { loadAdminData() }, [])

  async function loadAdminData() {
    setIsLoading(true)

    const [usersCount, mentorsCount, projectsCount, showcaseCount, submissionsCount] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('mentor_profiles').select('id', { count: 'exact', head: true }).eq('is_verified', false),
      supabase.from('projects').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('showcase_entries').select('id', { count: 'exact', head: true }).in('status', ['published', 'featured']),
      supabase.from('showcase_submissions').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    ])

    setStats({
      totalUsers: usersCount.count || 0,
      pendingMentors: mentorsCount.count || 0,
      activeProjects: projectsCount.count || 0,
      publishedResearch: showcaseCount.count || 0,
      pendingSubmissions: submissionsCount.count || 0,
    })

    const { data: mentors } = await supabase
      .from('mentor_profiles')
      .select('*, user:profiles(*)')
      .eq('is_verified', false)
      .order('created_at', { ascending: false })
    if (mentors) setPendingMentors(mentors as MentorWithProfile[])

    const { data: recentUsers } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    if (recentUsers) setUsers(recentUsers as Profile[])

    await loadSubmissions()
    setIsLoading(false)
  }

  async function loadSubmissions() {
    const { data } = await supabase
      .from('showcase_submissions')
      .select('*, submitter:profiles!submitted_by(*)')
      .in('status', ['pending', 'needs_revision'])
      .order('submitted_at', { ascending: false })
    if (data) setPendingSubmissions(data as PendingSubmission[])
  }

  async function approveMentor(mentorId: string) {
    const { error } = await supabase.from('mentor_profiles').update({ is_verified: true }).eq('id', mentorId)
    if (!error) loadAdminData()
  }

  async function rejectMentor(mentorId: string) {
    const { error } = await supabase.from('mentor_profiles').delete().eq('id', mentorId)
    if (!error) loadAdminData()
  }

  async function handleReviewSubmit(action?: 'approve' | 'revise' | 'reject') {
    const resolvedAction = action ?? reviewAction
    if (!selectedSubmission || !resolvedAction) return
    setReviewing(true)

    const { data: { user: adminUser } } = await supabase.auth.getUser()
    if (!adminUser) { setReviewing(false); return }

    if (resolvedAction === 'approve') {
      // Determine new research_area from first tag
      const researchArea = selectedSubmission.research_area_tags[0] || 'Other'

      // Insert into showcase_entries
      const { data: entry } = await supabase
        .from('showcase_entries')
        .insert({
          project_id: selectedSubmission.project_id,
          author_id: selectedSubmission.submitted_by,
          title: selectedSubmission.title,
          abstract: selectedSubmission.abstract,
          research_area: researchArea,
          tags: [...selectedSubmission.research_area_tags, ...selectedSubmission.methodology_tags],
          document_url: selectedSubmission.pdf_url,
          status: 'published',
          published_at: new Date().toISOString(),
          collaborators: [],
          views: 0,
          likes: 0,
        })
        .select()
        .single()

      // Mark submission approved
      await supabase
        .from('showcase_submissions')
        .update({ status: 'approved', reviewed_at: new Date().toISOString(), reviewed_by: adminUser.id })
        .eq('id', selectedSubmission.id)

      // Award Akili to owner
      await showcaseApproved(selectedSubmission.submitted_by, selectedSubmission.id)

      // Get team members for this project
      if (selectedSubmission.project_id) {
        const { data: teamData } = await supabase
          .from('projects')
          .select('team:teams(team_members(user_id))')
          .eq('id', selectedSubmission.project_id)
          .single()

        const teamMembers: string[] = []
        if (teamData?.team) {
          const team = teamData.team as { team_members: { user_id: string }[] }
          team.team_members?.forEach((m: { user_id: string }) => {
            if (m.user_id !== selectedSubmission.submitted_by) teamMembers.push(m.user_id)
          })
        }

        // Award +75 to each team member
        await Promise.all(
          teamMembers.map(uid =>
            collaboratedProjectReachesShowcase(uid, selectedSubmission.id)
          )
        )

        // Check for mentor
        const { data: mentorReq } = await supabase
          .from('mentorship_requests')
          .select('mentor_id')
          .eq('project_id', selectedSubmission.project_id)
          .eq('status', 'accepted')
          .maybeSingle()
        if (mentorReq?.mentor_id) {
          await menteeSubmitsToShowcase(mentorReq.mentor_id, selectedSubmission.id)
        }

        // Notify entire team
        const allMembers = [selectedSubmission.submitted_by, ...teamMembers]
        await supabase.from('notifications').insert(
          allMembers.map(uid => ({
            user_id: uid,
            title: 'Research Published!',
            message: `Your research "${selectedSubmission.title}" has been published to the ResearchFlow Showcase!`,
            type: 'showcase_approved',
            related_id: entry?.id || selectedSubmission.id,
          }))
        )
      } else {
        // No project — just notify owner
        await supabase.from('notifications').insert({
          user_id: selectedSubmission.submitted_by,
          title: 'Research Published!',
          message: `Your research "${selectedSubmission.title}" has been published to the ResearchFlow Showcase!`,
          type: 'showcase_approved',
          related_id: entry?.id || selectedSubmission.id,
        })
      }

      toast.success('Submission approved and published to Showcase')
    } else if (resolvedAction === 'revise') {
      if (!adminNotes.trim()) { toast.error('Please provide revision notes.'); setReviewing(false); return }

      await supabase
        .from('showcase_submissions')
        .update({ status: 'needs_revision', admin_notes: adminNotes, reviewed_at: new Date().toISOString(), reviewed_by: adminUser.id })
        .eq('id', selectedSubmission.id)

      await supabase.from('notifications').insert({
        user_id: selectedSubmission.submitted_by,
        title: 'Revisions Requested',
        message: `Your submission "${selectedSubmission.title}" needs revisions: ${adminNotes}`,
        type: 'showcase_revision',
        related_id: selectedSubmission.id,
      })

      toast.success('Revision request sent')
    } else if (resolvedAction === 'reject') {
      if (!adminNotes.trim()) { toast.error('Please provide a rejection reason.'); setReviewing(false); return }

      await supabase
        .from('showcase_submissions')
        .update({ status: 'rejected', admin_notes: adminNotes, reviewed_at: new Date().toISOString(), reviewed_by: adminUser.id })
        .eq('id', selectedSubmission.id)

      await supabase.from('notifications').insert({
        user_id: selectedSubmission.submitted_by,
        title: 'Submission Not Approved',
        message: `Your submission "${selectedSubmission.title}" was not approved: ${adminNotes}`,
        type: 'showcase_rejected',
        related_id: selectedSubmission.id,
      })

      toast.success('Submission rejected')
    }

    setSelectedSubmission(null)
    setReviewAction(null)
    setAdminNotes('')
    await loadSubmissions()
    await loadAdminData()
    setReviewing(false)
  }

  const getTierLabel = (tier: number) => {
    switch (tier) { case 1: return 'Faculty'; case 2: return 'Postgraduate'; case 3: return 'Industry'; default: return 'Unknown' }
  }

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.department?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-heading">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Manage users, verify mentors, and monitor platform activity</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
        <Card className="bg-gradient-to-br from-orange-500/10 to-transparent border-orange-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Eye className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pendingSubmissions}</p>
                <p className="text-xs text-muted-foreground">Pending Review</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="showcase" className="space-y-4">
        <TabsList>
          <TabsTrigger value="showcase" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Showcase Review
            {stats.pendingSubmissions > 0 && (
              <Badge variant="destructive" className="ml-1">{stats.pendingSubmissions}</Badge>
            )}
          </TabsTrigger>
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
            <AlertTriangle className="w-4 h-4" />
            Content
          </TabsTrigger>
        </TabsList>

        {/* ── Showcase Review Tab ─────────────────────────────────── */}
        <TabsContent value="showcase" className="space-y-4">
          {selectedSubmission ? (
            /* Detail view */
            <div className="space-y-4">
              <Button variant="ghost" className="gap-2" onClick={() => { setSelectedSubmission(null); setReviewAction(null); setAdminNotes('') }}>
                <ArrowLeft className="w-4 h-4" /> Back to submissions
              </Button>

              <div className="grid md:grid-cols-3 gap-4">
                {/* Left: details */}
                <div className="md:col-span-2 space-y-4">
                  <Card>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <CardTitle className="text-xl">{selectedSubmission.title}</CardTitle>
                          <CardDescription className="mt-1">
                            Submitted {new Date(selectedSubmission.submitted_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                          </CardDescription>
                        </div>
                        <Badge variant={selectedSubmission.status === 'pending' ? 'default' : 'secondary'}>
                          {selectedSubmission.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Submitter */}
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={selectedSubmission.submitter?.avatar_url || undefined} />
                          <AvatarFallback>{selectedSubmission.submitter?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{selectedSubmission.submitter?.full_name}</p>
                          <p className="text-xs text-muted-foreground">{selectedSubmission.submitter?.university_id} · {selectedSubmission.submitter?.department}</p>
                        </div>
                      </div>

                      {/* Abstract */}
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Abstract</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">{selectedSubmission.abstract}</p>
                      </div>

                      {/* Tags */}
                      <div className="space-y-2">
                        {selectedSubmission.research_area_tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            <span className="text-xs text-muted-foreground mr-1">Areas:</span>
                            {selectedSubmission.research_area_tags.map(t => (
                              <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                            ))}
                          </div>
                        )}
                        {selectedSubmission.methodology_tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            <span className="text-xs text-muted-foreground mr-1">Methods:</span>
                            {selectedSubmission.methodology_tags.map(t => (
                              <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Eye className="w-3.5 h-3.5" />
                          {selectedSubmission.visibility === 'public' ? 'Public visibility' : 'University only'}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* PDF Preview */}
                  {selectedSubmission.pdf_url && (
                    <Card>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">Document Preview</CardTitle>
                          <Button size="sm" variant="outline" asChild>
                            <a href={selectedSubmission.pdf_url} target="_blank" rel="noopener noreferrer">
                              Open Full Screen
                            </a>
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <iframe
                          src={`${selectedSubmission.pdf_url}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`}
                          className="w-full rounded-lg border"
                          style={{ height: '520px' }}
                          title="Research Document"
                        />
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Right: actions */}
                <div className="space-y-4">
                  {/* Admin notes section */}
                  {(reviewAction === 'revise' || reviewAction === 'reject') && (
                    <Card className={reviewAction === 'reject' ? 'border-destructive/40' : 'border-yellow-500/40'}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">
                          {reviewAction === 'reject' ? 'Rejection Reason' : 'Revision Notes'}
                          <span className="text-destructive ml-1">*</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Textarea
                          value={adminNotes}
                          onChange={e => setAdminNotes(e.target.value)}
                          placeholder={reviewAction === 'reject' ? 'Explain why this submission is rejected...' : 'Describe what changes are needed...'}
                          rows={4}
                        />
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            onClick={() => handleReviewSubmit()}
                            disabled={!adminNotes.trim() || reviewing}
                            variant={reviewAction === 'reject' ? 'destructive' : 'default'}
                            className="flex-1"
                          >
                            {reviewing ? 'Sending...' : reviewAction === 'reject' ? 'Confirm Reject' : 'Send for Revision'}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { setReviewAction(null); setAdminNotes('') }}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Action buttons */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Review Decision</CardTitle>
                      <CardDescription>Your action will notify the research team</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                        disabled={reviewing || reviewAction !== null}
                        onClick={() => handleReviewSubmit('approve')}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Approve & Publish
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full border-yellow-500/50 text-yellow-600 hover:bg-yellow-500/10"
                        disabled={reviewing}
                        onClick={() => { setReviewAction('revise'); setAdminNotes('') }}
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Request Revisions
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full border-destructive/50 text-destructive hover:bg-destructive/10"
                        disabled={reviewing}
                        onClick={() => { setReviewAction('reject'); setAdminNotes('') }}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Akili points info */}
                  <Card className="bg-muted/30">
                    <CardContent className="p-4 space-y-2 text-xs text-muted-foreground">
                      <p className="font-medium text-foreground text-sm">On Approval</p>
                      <p>+100 Akili → Project owner</p>
                      <p>+75 Akili → Each team member</p>
                      <p>+80 Akili → Assigned mentor</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          ) : (
            /* List view */
            <Card>
              <CardHeader>
                <CardTitle>Pending Showcase Submissions</CardTitle>
                <CardDescription>Review research submitted for publication</CardDescription>
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
                ) : pendingSubmissions.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <h3 className="font-medium">All caught up!</h3>
                    <p className="text-sm text-muted-foreground">No pending showcase submissions at this time.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingSubmissions.map(sub => (
                      <div key={sub.id} className="flex items-start gap-4 p-4 rounded-xl border hover:border-primary/40 transition-colors">
                        <Avatar className="w-11 h-11 flex-shrink-0">
                          <AvatarImage src={sub.submitter?.avatar_url || undefined} />
                          <AvatarFallback>{sub.submitter?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold text-sm leading-snug">{sub.title}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {sub.submitter?.full_name} · {sub.submitter?.university_id}
                              </p>
                            </div>
                            <Badge variant={sub.status === 'needs_revision' ? 'secondary' : 'outline'} className="flex-shrink-0 text-xs">
                              {sub.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {sub.research_area_tags.slice(0, 3).map(t => (
                              <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                            ))}
                          </div>
                          <div className="flex items-center justify-between mt-3">
                            <p className="text-xs text-muted-foreground">
                              {new Date(sub.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                            <Button size="sm" onClick={() => { setSelectedSubmission(sub); setReviewAction(null); setAdminNotes('') }}>
                              <Eye className="w-3.5 h-3.5 mr-1.5" />
                              View & Review
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Mentor Verification Tab ─────────────────────────────── */}
        <TabsContent value="mentors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Mentor Verifications</CardTitle>
              <CardDescription>Review and approve mentor applications</CardDescription>
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
                  <p className="text-sm text-muted-foreground">No pending mentor verifications at this time.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingMentors.map(mentor => (
                    <div key={mentor.id} className="flex items-start gap-4 p-4 rounded-lg border">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={mentor.user?.avatar_url || undefined} />
                        <AvatarFallback>{mentor.user?.full_name?.charAt(0) || 'M'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-medium">{mentor.user?.full_name}</h4>
                            <p className="text-sm text-muted-foreground">{mentor.user?.email}</p>
                          </div>
                          <Badge variant="outline">Tier {mentor.tier}: {getTierLabel(mentor.tier)}</Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                          {mentor.user?.university_id && (
                            <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />{mentor.user.university_id}</span>
                          )}
                          {mentor.user?.department && (
                            <span className="flex items-center gap-1"><GraduationCap className="w-3.5 h-3.5" />{mentor.user.department}</span>
                          )}
                        </div>
                        {mentor.specializations && mentor.specializations.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {mentor.specializations.map(spec => (
                              <Badge key={spec} variant="secondary" className="text-xs">{spec}</Badge>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-2 mt-4">
                          <Button size="sm" onClick={() => approveMentor(mentor.id)}>
                            <CheckCircle className="w-4 h-4 mr-1" />Approve
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => rejectMentor(mentor.id)}>
                            <XCircle className="w-4 h-4 mr-1" />Reject
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => toast('Document viewing coming soon')}>
                            <Eye className="w-4 h-4 mr-1" />View Documents
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

        {/* ── Users Tab ───────────────────────────────────────────── */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>View and manage platform users</CardDescription>
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
                            <AvatarFallback className="text-xs">{user.full_name?.charAt(0) || 'U'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{user.full_name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><span className="text-sm">{user.university_id || '-'}</span></TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.roles?.slice(0, 2).map(role => (
                            <Badge key={role} variant="outline" className="text-xs">{role.replace('_', ' ')}</Badge>
                          ))}
                          {user.roles && user.roles.length > 2 && (
                            <Badge variant="outline" className="text-xs">+{user.roles.length - 2}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">{new Date(user.created_at).toLocaleDateString()}</span>
                      </TableCell>
                      <TableCell>
                        {user.onboarding_completed ? (
                          <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-500">Active</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">Onboarding</Badge>
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
                              <Eye className="w-4 h-4 mr-2" />View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => toast('User suspension coming soon')}>
                              <Ban className="w-4 h-4 mr-2" />Suspend User
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

        {/* ── Content Moderation Tab ──────────────────────────────── */}
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
