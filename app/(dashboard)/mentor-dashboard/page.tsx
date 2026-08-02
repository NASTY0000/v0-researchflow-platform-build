'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { TagInput } from '@/components/ui/tag-input'
import { RESEARCH_AREAS } from '@/lib/constants/tags'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  CheckCircle2, Clock, AlertTriangle, XCircle, Users, Calendar,
  FolderKanban, Plus, Trash2, Loader2, BookOpen, ExternalLink,
  GraduationCap, MessageSquare,
} from 'lucide-react'
import { toast } from 'sonner'
import { acceptMentorshipRequest } from '@/lib/actions/akili'
import type { MentorProfile, MentorshipRequest, MentorAvailability, Profile, Project } from '@/lib/types/database'
import { ListPageSkeleton } from '@/components/ui/skeleton-screens'
import { respondToProgramRequest, getMyMentorshipPrograms, toggleAcceptingMentees, type MentorProgramItem } from '@/lib/actions/mentorship'
import { ProgramCard } from '@/components/mentorship/ProgramCard'

type RequestWithStudent = MentorshipRequest & {
  student: Profile
  project: Project | null
}

type AvailabilitySlot = MentorAvailability

const TIER_LABELS: Record<number, string> = { 1: 'Registered Faculty', 2: 'Postgraduate Student', 3: 'Industry Professional' }


export default function MentorDashboardPage() {
  const router = useRouter()
  const [mentorProfile, setMentorProfile] = useState<MentorProfile | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Requests
  const [pendingRequests, setPendingRequests] = useState<RequestWithStudent[]>([])
  const [activeRequests, setActiveRequests] = useState<RequestWithStudent[]>([])
  const [respondingId, setRespondingId] = useState<string | null>(null)

  // Availability
  const [slots, setSlots] = useState<AvailabilitySlot[]>([])
  const [slotDate, setSlotDate] = useState('')
  const [slotStart, setSlotStart] = useState('')
  const [slotEnd, setSlotEnd] = useState('')
  const [isAddingSlot, setIsAddingSlot] = useState(false)
  const [deletingSlotId, setDeletingSlotId] = useState<string | null>(null)

  // Open call form
  const [callTitle, setCallTitle] = useState('')
  const [callDescription, setCallDescription] = useState('')
  const [callArea, setCallArea] = useState<string[]>([])
  const [callDeadline, setCallDeadline] = useState('')
  const [isPostingCall, setIsPostingCall] = useState(false)

  // Program management
  const [pendingPrograms, setPendingPrograms] = useState<MentorProgramItem[]>([])
  const [activePrograms, setActivePrograms] = useState<MentorProgramItem[]>([])
  const [respondingProgramId, setRespondingProgramId] = useState<string | null>(null)
  const [isTogglingCapacity, setIsTogglingCapacity] = useState(false)
  const [acceptingMentees, setAcceptingMentees] = useState(true)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }
    setCurrentUserId(user.id)

    const { data: mp } = await supabase
      .from('mentor_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // If no mentor_profile yet, show an empty state, don't redirect away
    if (mp) {
      setMentorProfile(mp)

      if (mp.is_verified) {
        const [reqResult, slotsResult, programsResult] = await Promise.all([
          supabase
            .from('mentorship_requests')
            .select('*, student:profiles!mentorship_requests_student_id_fkey(*), project:projects(*)')
            .eq('mentor_id', user.id)
            .order('created_at', { ascending: false }),
          supabase
            .from('mentor_availability')
            .select('*')
            .eq('mentor_id', user.id)
            .gte('available_date', new Date().toISOString().split('T')[0])
            .order('available_date', { ascending: true }),
          getMyMentorshipPrograms(),
        ])

        if (reqResult.data) {
          setPendingRequests(reqResult.data.filter((r) => r.status === 'pending') as RequestWithStudent[])
          setActiveRequests(reqResult.data.filter((r) => r.status === 'accepted') as RequestWithStudent[])
        }
        if (slotsResult.data) setSlots(slotsResult.data)
        if (programsResult) {
          setPendingPrograms(programsResult.asMentor.filter((p) => p.status === 'requested'))
          setActivePrograms(programsResult.asMentor.filter((p) => p.status === 'active'))
        }
        // Sync accepting mentees toggle from DB
        if (mp.is_accepting_mentees !== undefined) setAcceptingMentees(mp.is_accepting_mentees ?? true)
      }
    }

    setIsLoading(false)
  }

  async function respondToRequest(requestId: string, action: 'accepted' | 'declined') {
    setRespondingId(requestId)
    const supabase = createClient()

    await supabase
      .from('mentorship_requests')
      .update({ status: action })
      .eq('id', requestId)

    const request = pendingRequests.find((r) => r.id === requestId)
    if (request) {
      await supabase.from('notifications').insert({
        user_id: request.student_id,
        type: 'mentorship_request',
        title: action === 'accepted' ? 'Mentorship Request Accepted' : 'Mentorship Request Declined',
        message: action === 'accepted'
          ? 'Your mentorship request has been accepted!'
          : 'Your mentorship request was declined.',
        link: '/mentors',
      })
    }

    if (action === 'accepted') {
      if (request && currentUserId) {
        acceptMentorshipRequest(currentUserId, request.student_id, requestId).catch(() => {})
      }
      setPendingRequests((prev) => prev.filter((r) => r.id !== requestId))
      setActiveRequests((prev) => [...prev, request!])
    } else {
      setPendingRequests((prev) => prev.filter((r) => r.id !== requestId))
    }

    toast.success(action === 'accepted' ? 'Request accepted.' : 'Request declined.')
    setRespondingId(null)
  }

  async function addSlot() {
    if (!slotDate || !slotStart || !slotEnd || !currentUserId) return
    setIsAddingSlot(true)
    const supabase = createClient()

    const { data, error } = await supabase
      .from('mentor_availability')
      .insert({
        mentor_id: currentUserId,
        available_date: slotDate,
        start_time: slotStart,
        end_time: slotEnd,
        is_booked: false,
      })
      .select()
      .single()

    if (error) { toast.error(error.message); setIsAddingSlot(false); return }
    if (data) setSlots((prev) => [...prev, data])
    setSlotDate(''); setSlotStart(''); setSlotEnd('')
    toast.success('Slot added.')
    setIsAddingSlot(false)
  }

  async function deleteSlot(slotId: string) {
    setDeletingSlotId(slotId)
    const supabase = createClient()
    await supabase.from('mentor_availability').delete().eq('id', slotId)
    setSlots((prev) => prev.filter((s) => s.id !== slotId))
    setDeletingSlotId(null)
  }

  async function postOpenCall() {
    if (!callTitle.trim() || !callDescription.trim() || callArea.length === 0 || !currentUserId) return
    setIsPostingCall(true)
    const supabase = createClient()

    const { error } = await supabase.from('research_ideas').insert({
      author_id: currentUserId,
      title: callTitle.trim(),
      description: callDescription.trim(),
      research_area: callArea[0],
      tags: ['open-call', 'mentorship'],
      roles_needed: ['mentee'],
      skills_needed: [],
      collaboration_type: 'open',
      status: 'open',
      upvotes: 0,
      views: 0,
      is_featured: false,
    })

    if (error) { toast.error(error.message); setIsPostingCall(false); return }
    toast.success('Open call posted!')
    setCallTitle(''); setCallDescription(''); setCallArea([]); setCallDeadline('')
    setIsPostingCall(false)
  }

  if (isLoading) {
    return <div className="max-w-4xl mx-auto px-4 py-8"><ListPageSkeleton type="card" count={3} /></div>
  }

  // No mentor_profile row yet, guide user to complete the application
  if (!mentorProfile) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold font-heading flex items-center gap-3 mb-8">
          <GraduationCap className="w-8 h-8 text-primary" />
          Mentor Dashboard
        </h1>
        <div className="rounded-2xl p-10 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.2)' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(168,85,247,0.3)' }}>
            <GraduationCap className="w-8 h-8" style={{ color: '#A855F7' }} />
          </div>
          <h2 className="text-xl font-bold font-heading mb-2">Complete Your Mentor Application</h2>
          <p className="text-sm max-w-sm mx-auto mb-6 text-muted-foreground">
            You have the mentor role but haven&apos;t submitted your verification documents yet.
            Complete your application to unlock the mentor dashboard.
          </p>
          <Link
            href="/mentor-verification"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: 'var(--cta-bg)', color: '#F3F0FF' }}
          >
            Complete Application
          </Link>
        </div>
      </div>
    )
  }

  const isVerified = mentorProfile.is_verified

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page title */}
      <div>
        <h1 className="text-3xl font-bold font-heading flex items-center gap-3">
          <GraduationCap className="w-8 h-8 text-primary" />
          Mentor Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          {TIER_LABELS[mentorProfile.tier as 1 | 2 | 3] || 'Mentor'} · Tier {mentorProfile.tier}
        </p>
      </div>

      {/* SECTION 1: Verification Status */}
      {isVerified ? (
        <Alert style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)' }}>
          <CheckCircle2 className="h-4 w-4" style={{ color: '#22C55E' }} />
          <AlertDescription style={{ color: '#22C55E' }}>
            You are a verified mentor ✓. Your profile is listed in the mentor directory.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)' }}>
          <Clock className="h-4 w-4" style={{ color: '#F59E0B' }} />
          <AlertDescription className="flex items-center justify-between gap-4 flex-wrap">
            <span style={{ color: '#F59E0B' }}>
              Your mentor application is under review. You will be notified within 24–48 hours.
            </span>
            <Button
              size="sm"
              variant="outline"
              asChild
              style={{ border: '1px solid rgba(245,158,11,0.4)', color: '#F59E0B', flexShrink: 0 }}
            >
              <Link href="/mentor-verification">Update Application</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {!isVerified && (
        <div className="rounded-2xl p-8 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(139,92,246,0.15)' }}>
          <Clock className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="font-semibold">Awaiting Verification</p>
          <p className="text-sm mt-1 text-muted-foreground">
            Mentor features will unlock once your application is approved by the ResearchFlow team.
          </p>
        </div>
      )}

      {isVerified && (
        <>
          {/* SECTION 2: Pending Requests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                Pending Mentorship Requests
              </CardTitle>
              <CardDescription>Students waiting for your response</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingRequests.length === 0 ? (
                <p className="text-sm text-center py-6 text-muted-foreground">
                  No pending requests right now.
                </p>
              ) : (
                <div className="space-y-3">
                  {pendingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="flex flex-col sm:flex-row sm:items-start gap-4 p-4 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.15)' }}
                    >
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarImage src={req.student?.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {req.student?.full_name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold">{req.student?.full_name || 'Student'}</p>
                        {req.project && (
                          <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: '#A855F7' }}>
                            <FolderKanban className="w-3 h-3" />
                            {req.project.title}
                          </p>
                        )}
                        {req.message && (
                          <p className="text-sm mt-2 text-muted-foreground line-clamp-3">{req.message}</p>
                        )}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          onClick={() => respondToRequest(req.id, 'accepted')}
                          disabled={respondingId === req.id}
                          style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#22C55E' }}
                        >
                          {respondingId === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Accept'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => respondToRequest(req.id, 'declined')}
                          disabled={respondingId === req.id}
                          style={{ border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444' }}
                        >
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* SECTION 3: Active Mentorships */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Active Mentorships
              </CardTitle>
              <CardDescription>Students you are currently mentoring</CardDescription>
            </CardHeader>
            <CardContent>
              {activeRequests.length === 0 ? (
                <p className="text-sm text-center py-6 text-muted-foreground">
                  No active mentorships yet.
                </p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {activeRequests.map((req) => (
                    <div
                      key={req.id}
                      className="flex items-center gap-3 p-4 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.15)' }}
                    >
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarImage src={req.student?.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {req.student?.full_name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{req.student?.full_name || 'Student'}</p>
                        {req.project && (
                          <p className="text-xs truncate text-muted-foreground">{req.project.title}</p>
                        )}
                      </div>
                      {req.project && (
                        <Button size="sm" variant="ghost" asChild className="shrink-0" style={{ color: '#A855F7' }}>
                          <Link href={`/projects/${req.project.id}`}>
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* SECTION 3B: Capacity Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Capacity & Availability
              </CardTitle>
              <CardDescription>Control whether you appear in the mentor directory</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">Accepting Mentees</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {acceptingMentees ? 'Your profile is listed in the mentor directory' : 'You are hidden from the mentor directory'}
                  </p>
                </div>
                <button
                  onClick={async () => {
                    setIsTogglingCapacity(true)
                    const next = !acceptingMentees
                    const result = await toggleAcceptingMentees(next)
                    if (result.success) setAcceptingMentees(next)
                    else toast.error(result.error || 'Failed to update')
                    setIsTogglingCapacity(false)
                  }}
                  disabled={isTogglingCapacity}
                  style={{
                    width: '44px', height: '24px', borderRadius: '12px', border: 'none',
                    background: acceptingMentees ? 'rgba(34,197,94,0.6)' : 'rgba(139,92,246,0.2)',
                    cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                  }}
                >
                  <div style={{
                    width: '18px', height: '18px', borderRadius: '9px', background: 'white',
                    position: 'absolute', top: '3px',
                    left: acceptingMentees ? '23px' : '3px', transition: 'left 0.2s',
                  }} />
                </button>
              </div>
            </CardContent>
          </Card>

          {/* SECTION 3C: Pending Program Requests */}
          {pendingPrograms.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Pending Program Requests
                </CardTitle>
                <CardDescription>Structured mentorship programs awaiting your response</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingPrograms.map((prog) => (
                  <div key={prog.id} className="flex flex-col sm:flex-row sm:items-start gap-4 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.15)' }}>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{prog.mentee?.full_name || 'Researcher'}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#A855F7' }}>{prog.duration_months}-month program · {prog.focus_area}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        disabled={respondingProgramId === prog.id}
                        onClick={async () => {
                          setRespondingProgramId(prog.id)
                          const r = await respondToProgramRequest(prog.id, 'active')
                          if (r.success) {
                            setPendingPrograms((prev) => prev.filter((p) => p.id !== prog.id))
                            setActivePrograms((prev) => [...prev, { ...prog, status: 'active' }])
                            toast.success('Program accepted. Milestones generated.')
                          } else toast.error(r.error || 'Failed')
                          setRespondingProgramId(null)
                        }}
                        style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#22C55E' }}
                      >
                        {respondingProgramId === prog.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Accept'}
                      </Button>
                      <Button
                        size="sm" variant="outline"
                        disabled={respondingProgramId === prog.id}
                        onClick={async () => {
                          setRespondingProgramId(prog.id)
                          const r = await respondToProgramRequest(prog.id, 'declined')
                          if (r.success) setPendingPrograms((prev) => prev.filter((p) => p.id !== prog.id))
                          else toast.error(r.error || 'Failed')
                          setRespondingProgramId(null)
                        }}
                        style={{ border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444' }}
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* SECTION 3D: Active Programs */}
          {activePrograms.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-primary" />
                  Active Programs
                </CardTitle>
                <CardDescription>Structured mentorship programs in progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-3">
                  {activePrograms.map((prog) => (
                    <ProgramCard
                      key={prog.id}
                      programId={prog.id}
                      otherPerson={prog.mentee}
                      role="mentor"
                      status={prog.status}
                      focusArea={prog.focus_area}
                      durationMonths={prog.duration_months}
                      milestones={prog.mentorship_milestones}
                      startedAt={prog.started_at}
                      expectedEndAt={prog.expected_end_at}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* SECTION 4: Set Availability */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Availability
              </CardTitle>
              <CardDescription>Add time slots when you are available for mentorship sessions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Date</Label>
                  <Input
                    type="date"
                    value={slotDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setSlotDate(e.target.value)}
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.25)' }}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Start Time</Label>
                  <Input
                    type="time"
                    value={slotStart}
                    onChange={(e) => setSlotStart(e.target.value)}
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.25)' }}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">End Time</Label>
                  <Input
                    type="time"
                    value={slotEnd}
                    onChange={(e) => setSlotEnd(e.target.value)}
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.25)' }}
                  />
                </div>
              </div>
              <Button
                onClick={addSlot}
                disabled={isAddingSlot || !slotDate || !slotStart || !slotEnd}
                size="sm"
                style={{ background: 'var(--cta-bg)', border: 'none' }}
              >
                {isAddingSlot ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Adding...</> : <><Plus className="w-4 h-4 mr-1" />Add Slot</>}
              </Button>

              {slots.length > 0 && (
                <div className="space-y-2 pt-2">
                  {slots.map((slot) => (
                    <div
                      key={slot.id}
                      className="flex items-center justify-between p-3 rounded-lg"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.12)' }}
                    >
                      <div className="flex items-center gap-3 text-sm">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span>{new Date(slot.available_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                        <span className="text-muted-foreground">{slot.start_time} – {slot.end_time}</span>
                        {slot.is_booked && <Badge variant="secondary" className="text-xs">Booked</Badge>}
                      </div>
                      {!slot.is_booked && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="w-7 h-7"
                          disabled={deletingSlotId === slot.id}
                          onClick={() => deleteSlot(slot.id)}
                          style={{ color: '#EF4444' }}
                        >
                          {deletingSlotId === slot.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* SECTION 5: Post an Open Call */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Post an Open Call
              </CardTitle>
              <CardDescription>Invite students to apply for your mentorship</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={callTitle}
                  onChange={(e) => setCallTitle(e.target.value)}
                  placeholder="e.g., Looking for a mentee in ML research"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.25)' }}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={callDescription}
                  onChange={(e) => setCallDescription(e.target.value)}
                  placeholder="Describe what you're looking for in a mentee, the topics you can help with, and what you expect..."
                  rows={4}
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.25)' }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Research Area</Label>
                  <TagInput
                    options={RESEARCH_AREAS}
                    value={callArea}
                    onChange={setCallArea}
                    placeholder="Search research areas..."
                    maxItems={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Application Deadline</Label>
                  <Input
                    type="date"
                    value={callDeadline}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setCallDeadline(e.target.value)}
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.25)' }}
                  />
                </div>
              </div>
              <Button
                onClick={postOpenCall}
                disabled={isPostingCall || !callTitle.trim() || !callDescription.trim() || !callArea}
                style={{ background: 'var(--cta-bg)', border: 'none' }}
              >
                {isPostingCall ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Posting...</>
                ) : (
                  'Post Open Call'
                )}
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
