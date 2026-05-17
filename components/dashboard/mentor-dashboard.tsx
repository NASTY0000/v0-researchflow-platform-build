'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Check,
  X,
  Calendar,
  Clock,
  Users,
  Star,
  MessageSquare,
  Plus,
  ChevronRight,
  Bell,
  FileText,
  Loader2,
  Trash2,
  AlertTriangle,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { MentorshipRequest, MentorAvailability, MentorSession, Profile } from '@/lib/types/database'
import { acceptMentorshipRequest, completeMentorSession, receive4to5StarSessionRating } from '@/lib/actions/akili'
import { toast } from 'sonner'

interface ActiveMentorship {
  id: string
  student: Profile
  project_title: string | null
  project_id: string | null
  accepted_at: string
}

interface MentorDashboardProps {
  userId: string
}

export function MentorDashboard({ userId }: MentorDashboardProps) {
  const [activeTab, setActiveTab] = useState('requests')

  // Pending requests
  const [requests, setRequests] = useState<(MentorshipRequest & { student: Profile; project: { title: string } | null })[]>([])
  const [requestsLoading, setRequestsLoading] = useState(true)

  // Active mentorships
  const [activeMentorships, setActiveMentorships] = useState<ActiveMentorship[]>([])

  // Availability
  const [slots, setSlots] = useState<MentorAvailability[]>([])
  const [showAddSlot, setShowAddSlot] = useState(false)
  const [slotDate, setSlotDate] = useState('')
  const [slotStart, setSlotStart] = useState('09:00')
  const [slotEnd, setSlotEnd] = useState('10:00')
  const [isSavingSlot, setIsSavingSlot] = useState(false)
  const [deletingSlotId, setDeletingSlotId] = useState<string | null>(null)

  // Session history
  const [sessions, setSessions] = useState<MentorSession[]>([])
  const [sessionNotes, setSessionNotes] = useState<Record<string, string>>({})
  const [savingNotesId, setSavingNotesId] = useState<string | null>(null)

  // Decline modal
  const [declineRequest, setDeclineRequest] = useState<string | null>(null)
  const [declineMessage, setDeclineMessage] = useState('')
  const [isDeclining, setIsDeclining] = useState(false)

  // Accept state
  const [acceptingId, setAcceptingId] = useState<string | null>(null)

  // Stats
  const totalSessions = sessions.length
  const avgRating = sessions.filter(s => s.student_rating).length > 0
    ? (sessions.reduce((sum, s) => sum + (s.student_rating || 0), 0) / sessions.filter(s => s.student_rating).length).toFixed(1)
    : '—'

  useEffect(() => {
    if (!userId) return
    loadRequests()
    loadActiveMentorships()
    loadSlots()
    loadSessions()
  }, [userId])

  async function loadRequests() {
    setRequestsLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('mentorship_requests')
      .select('*, student:profiles!mentorship_requests_student_id_fkey(*), project:projects(title)')
      .eq('mentor_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    setRequests((data as typeof requests) || [])
    setRequestsLoading(false)
  }

  async function loadActiveMentorships() {
    const supabase = createClient()
    const { data } = await supabase
      .from('mentorship_requests')
      .select('id, created_at, student:profiles!mentorship_requests_student_id_fkey(*), project:projects(id, title)')
      .eq('mentor_id', userId)
      .eq('status', 'accepted')
      .order('updated_at', { ascending: false })

    if (data) {
      setActiveMentorships(
        data.map((r: Record<string, unknown>) => ({
          id: r.id as string,
          student: r.student as Profile,
          project_title: (r.project as { title?: string } | null)?.title || null,
          project_id: (r.project as { id?: string } | null)?.id || null,
          accepted_at: r.created_at as string,
        }))
      )
    }
  }

  async function loadSlots() {
    const supabase = createClient()
    const today = new Date().toISOString().slice(0, 10)
    const { data } = await supabase
      .from('mentor_availability')
      .select('*')
      .eq('mentor_id', userId)
      .gte('available_date', today)
      .order('available_date', { ascending: true })
      .order('start_time', { ascending: true })
    setSlots((data as MentorAvailability[]) || [])
  }

  async function loadSessions() {
    const supabase = createClient()
    const { data } = await supabase
      .from('mentor_sessions')
      .select('*, student:profiles!mentor_sessions_student_id_fkey(*)')
      .eq('mentor_id', userId)
      .order('scheduled_at', { ascending: false })
    setSessions((data as MentorSession[]) || [])
    if (data) {
      const notes: Record<string, string> = {}
      data.forEach((s: MentorSession) => { if (s.notes) notes[s.id] = s.notes })
      setSessionNotes(notes)
    }
  }

  async function handleAccept(requestId: string) {
    setAcceptingId(requestId)
    const supabase = createClient()
    const { error } = await supabase
      .from('mentorship_requests')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', requestId)

    if (error) {
      toast.error('Failed to accept request.')
      setAcceptingId(null)
      return
    }

    const req = requests.find((r) => r.id === requestId)
    if (req) {
      await supabase.from('notifications').insert({
        user_id: req.student_id,
        type: 'mentorship_request',
        title: 'Mentorship Request Accepted',
        message: 'Your mentorship request has been accepted!',
        link: '/dashboard',
      })
      await acceptMentorshipRequest(userId, requestId)
    }

    toast.success('Request accepted! +15 Akili Points earned.')
    setAcceptingId(null)
    loadRequests()
    loadActiveMentorships()
  }

  async function handleDecline() {
    if (!declineRequest) return
    setIsDeclining(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('mentorship_requests')
      .update({
        status: 'declined',
        decline_message: declineMessage.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', declineRequest)

    if (error) {
      toast.error('Failed to decline request.')
      setIsDeclining(false)
      return
    }

    const req = requests.find((r) => r.id === declineRequest)
    if (req) {
      await supabase.from('notifications').insert({
        user_id: req.student_id,
        type: 'mentorship_request',
        title: 'Mentorship Request Declined',
        message: declineMessage.trim() || 'Your mentorship request was not accepted at this time.',
        link: '/mentors',
      })
    }

    toast.success('Request declined.')
    setDeclineRequest(null)
    setDeclineMessage('')
    setIsDeclining(false)
    loadRequests()
  }

  async function handleAddSlot() {
    if (!slotDate || !slotStart || !slotEnd) { toast.error('Please fill all slot fields.'); return }
    if (slotEnd <= slotStart) { toast.error('End time must be after start time.'); return }
    setIsSavingSlot(true)
    const supabase = createClient()
    const { error } = await supabase.from('mentor_availability').insert({
      mentor_id: userId,
      available_date: slotDate,
      start_time: slotStart,
      end_time: slotEnd,
    })
    if (error) { toast.error('Failed to save slot.'); setIsSavingSlot(false); return }
    toast.success('Availability slot added.')
    setShowAddSlot(false)
    setSlotDate('')
    setSlotStart('09:00')
    setSlotEnd('10:00')
    setIsSavingSlot(false)
    loadSlots()
  }

  async function handleDeleteSlot(slot: MentorAvailability) {
    if (slot.is_booked) {
      const slotDateTime = new Date(`${slot.available_date}T${slot.start_time}`)
      const hoursUntil = (slotDateTime.getTime() - Date.now()) / 3600000
      if (hoursUntil < 12) {
        toast.error('Cannot delete a booked slot within 12 hours of the session.')
        return
      }
      const confirmed = window.confirm(
        'A student has booked this slot. Deleting it will cancel their session. Continue?'
      )
      if (!confirmed) return
    }
    setDeletingSlotId(slot.id)
    const supabase = createClient()
    await supabase.from('mentor_availability').delete().eq('id', slot.id)
    toast.success('Slot removed.')
    setDeletingSlotId(null)
    loadSlots()
  }

  async function handleSaveNotes(sessionId: string) {
    setSavingNotesId(sessionId)
    const supabase = createClient()
    await supabase
      .from('mentor_sessions')
      .update({ notes: sessionNotes[sessionId] || '', updated_at: new Date().toISOString() })
      .eq('id', sessionId)

    // Mark session complete and award points if it was upcoming
    const session = sessions.find((s) => s.id === sessionId)
    if (session && session.status === 'upcoming') {
      const scheduledAt = new Date(session.scheduled_at)
      if (scheduledAt < new Date()) {
        await supabase
          .from('mentor_sessions')
          .update({ status: 'completed', updated_at: new Date().toISOString() })
          .eq('id', sessionId)
        await completeMentorSession(userId, sessionId)
      }
    }

    toast.success('Notes saved.')
    setSavingNotesId(null)
    loadSessions()
  }

  const pendingCount = requests.length

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Users, color: '#A855F7', bg: 'rgba(124,58,237,0.15)', value: activeMentorships.length, label: 'Active Mentees' },
          { icon: Calendar, color: '#06B6D4', bg: 'rgba(6,182,212,0.15)', value: totalSessions, label: 'Total Sessions' },
          { icon: Star, color: '#EAB308', bg: 'rgba(234,179,8,0.15)', value: avgRating, label: 'Avg Rating' },
          { icon: Clock, color: '#22C55E', bg: 'rgba(34,197,94,0.15)', value: slots.filter(s => !s.is_booked).length, label: 'Open Slots' },
        ].map(({ icon: Icon, color, bg, value, label }) => (
          <Card key={label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.2)' }}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ color: '#F3F0FF' }}>{value}</p>
                  <p className="text-xs" style={{ color: '#7C6A9C' }}>{label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start gap-1 p-1 h-auto flex-wrap" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.2)' }}>
          <TabsTrigger value="requests" className="relative data-[state=active]:bg-violet-600 data-[state=active]:text-white px-4 py-2">
            Pending Requests
            {pendingCount > 0 && (
              <span className="ml-2 w-5 h-5 rounded-full text-xs flex items-center justify-center" style={{ background: '#EF4444', color: 'white' }}>
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="active" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white px-4 py-2">
            Active Mentorships
          </TabsTrigger>
          <TabsTrigger value="calendar" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white px-4 py-2">
            Availability
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white px-4 py-2">
            Session History
          </TabsTrigger>
        </TabsList>

        {/* Pending Requests */}
        <TabsContent value="requests" className="mt-6">
          <div className="space-y-4">
            {requestsLoading ? (
              <Card style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.2)' }}>
                <CardContent className="py-12 text-center">
                  <Loader2 className="w-8 h-8 mx-auto animate-spin" style={{ color: '#A855F7' }} />
                </CardContent>
              </Card>
            ) : requests.length === 0 ? (
              <Card style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.2)' }}>
                <CardContent className="py-12 text-center">
                  <Bell className="w-12 h-12 mx-auto mb-4" style={{ color: '#7C6A9C' }} />
                  <p style={{ color: '#7C6A9C' }}>No pending mentorship requests</p>
                </CardContent>
              </Card>
            ) : (
              requests.map((req) => (
                <Card key={req.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.2)' }}>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={req.student?.avatar_url || undefined} />
                        <AvatarFallback style={{ background: 'linear-gradient(135deg,#7C3AED,#A855F7)', color: '#F3F0FF' }}>
                          {req.student?.full_name?.split(' ').map((n) => n[0]).join('') || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h4 className="font-semibold" style={{ color: '#F3F0FF' }}>{req.student?.full_name}</h4>
                            {req.project && (
                              <p className="text-sm" style={{ color: '#C084FC' }}>{req.project.title}</p>
                            )}
                          </div>
                          <span className="text-xs whitespace-nowrap" style={{ color: '#7C6A9C' }}>
                            {new Date(req.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {req.message && (
                          <p className="text-sm mt-3" style={{ color: '#7C6A9C' }}>{req.message}</p>
                        )}
                        {req.brief_url && (
                          <a
                            href={req.brief_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs mt-2 underline"
                            style={{ color: '#A855F7' }}
                          >
                            <FileText className="w-3 h-3" /> View Project Brief
                          </a>
                        )}
                        <div className="flex gap-2 mt-4">
                          <Button
                            size="sm"
                            disabled={acceptingId === req.id}
                            onClick={() => handleAccept(req.id)}
                            style={{ background: 'linear-gradient(135deg,#7C3AED,#A855F7)', border: 'none' }}
                          >
                            {acceptingId === req.id ? (
                              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4 mr-1" />
                            )}
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => { setDeclineRequest(req.id); setDeclineMessage('') }}
                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.25)', color: '#F3F0FF' }}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Decline
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Active Mentorships */}
        <TabsContent value="active" className="mt-6">
          <div className="space-y-4">
            {activeMentorships.length === 0 ? (
              <Card style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.2)' }}>
                <CardContent className="py-12 text-center">
                  <Users className="w-12 h-12 mx-auto mb-4" style={{ color: '#7C6A9C' }} />
                  <p style={{ color: '#7C6A9C' }}>No active mentorships yet</p>
                </CardContent>
              </Card>
            ) : (
              activeMentorships.map((m) => (
                <Card key={m.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.2)' }}>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={m.student?.avatar_url || undefined} />
                        <AvatarFallback style={{ background: 'linear-gradient(135deg,#7C3AED,#A855F7)', color: '#F3F0FF' }}>
                          {m.student?.full_name?.split(' ').map((n) => n[0]).join('') || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold" style={{ color: '#F3F0FF' }}>{m.student?.full_name}</h4>
                        {m.project_title && (
                          <p className="text-sm" style={{ color: '#C084FC' }}>{m.project_title}</p>
                        )}
                        <p className="text-xs mt-1" style={{ color: '#7C6A9C' }}>
                          Since {new Date(m.accepted_at).toLocaleDateString()}
                        </p>
                      </div>
                      {m.project_id && (
                        <Button size="sm" variant="ghost" style={{ color: '#A855F7' }} asChild>
                          <a href={`/projects/${m.project_id}`}>
                            View Project
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Availability */}
        <TabsContent value="calendar" className="mt-6">
          <Card style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.2)' }}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle style={{ color: '#F3F0FF' }}>Upcoming Availability</CardTitle>
                  <CardDescription style={{ color: '#7C6A9C' }}>
                    Add specific date/time slots when you&apos;re available for sessions.
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={() => setShowAddSlot(true)}
                  style={{ background: 'linear-gradient(135deg,#7C3AED,#A855F7)', border: 'none' }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Slot
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {slots.length === 0 ? (
                <div className="py-8 text-center" style={{ color: '#7C6A9C' }}>
                  No upcoming slots. Add one to let students book sessions.
                </div>
              ) : (
                <div className="space-y-2">
                  {slots.map((slot) => {
                    const slotDateTime = new Date(`${slot.available_date}T${slot.start_time}`)
                    const hoursUntil = (slotDateTime.getTime() - Date.now()) / 3600000
                    const canDelete = !slot.is_booked || hoursUntil >= 12

                    return (
                      <div
                        key={slot.id}
                        className="flex items-center justify-between p-3 rounded-lg"
                        style={{
                          background: slot.is_booked ? 'rgba(234,179,8,0.08)' : 'rgba(34,197,94,0.08)',
                          border: `1px solid ${slot.is_booked ? 'rgba(234,179,8,0.25)' : 'rgba(34,197,94,0.25)'}`,
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <Calendar className="w-4 h-4" style={{ color: slot.is_booked ? '#EAB308' : '#22C55E' }} />
                          <div>
                            <p className="text-sm font-medium" style={{ color: '#F3F0FF' }}>
                              {new Date(slot.available_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </p>
                            <p className="text-xs" style={{ color: '#7C6A9C' }}>
                              {slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)}
                            </p>
                          </div>
                          {slot.is_booked && (
                            <Badge style={{ background: 'rgba(234,179,8,0.15)', color: '#EAB308', border: 'none', fontSize: '11px' }}>
                              Booked
                            </Badge>
                          )}
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={!canDelete || deletingSlotId === slot.id}
                          onClick={() => handleDeleteSlot(slot)}
                          style={{ color: canDelete ? '#EF4444' : '#7C6A9C' }}
                        >
                          {deletingSlotId === slot.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Session History */}
        <TabsContent value="history" className="mt-6">
          <div className="space-y-4">
            {sessions.length === 0 ? (
              <Card style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.2)' }}>
                <CardContent className="py-12 text-center">
                  <Calendar className="w-12 h-12 mx-auto mb-4" style={{ color: '#7C6A9C' }} />
                  <p style={{ color: '#7C6A9C' }}>No sessions yet</p>
                </CardContent>
              </Card>
            ) : (
              sessions.map((session) => {
                const isPast = new Date(session.scheduled_at) < new Date()
                return (
                  <Card key={session.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.2)' }}>
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold" style={{ color: '#F3F0FF' }}>
                              {(session.student as Profile | undefined)?.full_name || 'Student'}
                            </h4>
                            <span className="text-xs" style={{ color: '#7C6A9C' }}>
                              {new Date(session.scheduled_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          {session.agenda && (
                            <p className="text-sm" style={{ color: '#C084FC' }}>Agenda: {session.agenda}</p>
                          )}
                        </div>
                        {session.student_rating && (
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className="w-4 h-4"
                                style={{
                                  color: i < (session.student_rating || 0) ? '#EAB308' : '#7C6A9C',
                                  fill: i < (session.student_rating || 0) ? '#EAB308' : 'transparent',
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      {isPast && (
                        <div className="space-y-2">
                          <Label style={{ color: '#7C6A9C', fontSize: '12px' }}>Session Notes</Label>
                          <Textarea
                            placeholder="Add notes visible to you and the student..."
                            value={sessionNotes[session.id] ?? (session.notes || '')}
                            onChange={(e) => setSessionNotes((prev) => ({ ...prev, [session.id]: e.target.value }))}
                            rows={3}
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.25)', color: '#F3F0FF', fontSize: '13px' }}
                          />
                          <Button
                            size="sm"
                            disabled={savingNotesId === session.id}
                            onClick={() => handleSaveNotes(session.id)}
                            style={{ background: 'linear-gradient(135deg,#7C3AED,#A855F7)', border: 'none' }}
                          >
                            {savingNotesId === session.id ? (
                              <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Saving...</>
                            ) : 'Save Notes'}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Decline Dialog */}
      <Dialog open={!!declineRequest} onOpenChange={() => { setDeclineRequest(null); setDeclineMessage('') }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Request</DialogTitle>
            <DialogDescription>
              Optionally explain why you&apos;re declining this request.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Optional message to the student..."
            value={declineMessage}
            onChange={(e) => setDeclineMessage(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeclineRequest(null); setDeclineMessage('') }}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isDeclining}
              onClick={handleDecline}
            >
              {isDeclining ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Declining...</> : 'Decline Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Slot Dialog */}
      <Dialog open={showAddSlot} onOpenChange={setShowAddSlot}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Availability Slot</DialogTitle>
            <DialogDescription>
              Set a specific date and time when you&apos;re available for a mentorship session.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={slotDate}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setSlotDate(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input type="time" value={slotStart} onChange={(e) => setSlotStart(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input type="time" value={slotEnd} onChange={(e) => setSlotEnd(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddSlot(false)}>Cancel</Button>
            <Button
              disabled={isSavingSlot}
              onClick={handleAddSlot}
              style={{ background: 'linear-gradient(135deg,#7C3AED,#A855F7)', border: 'none' }}
            >
              {isSavingSlot ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Saving...</> : 'Save Slot'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
