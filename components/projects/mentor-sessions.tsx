"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Calendar,
  Clock,
  Plus,
  Star,
  Loader2,
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  Video,
  ExternalLink,
  Link2,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { MentorAvailability, MentorSession, Profile } from "@/lib/types/database"
import { completeMentorSession, receive4to5StarSessionRating } from "@/lib/actions/akili"
import { toast } from "sonner"

interface MentorSessionsProps {
  projectId: string
  currentUserId: string | null
}

interface SlotWithMentor extends MentorAvailability {
  mentor: Profile
}

interface SessionWithParticipants extends MentorSession {
  mentor: Profile
  student: Profile
}

export function MentorSessions({ projectId, currentUserId }: MentorSessionsProps) {
  const [isMentor, setIsMentor] = useState(false)
  const [sessions, setSessions] = useState<SessionWithParticipants[]>([])
  const [availableSlots, setAvailableSlots] = useState<SlotWithMentor[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Mentor: add availability
  const [showAddSlot, setShowAddSlot] = useState(false)
  const [slotDate, setSlotDate] = useState("")
  const [slotStart, setSlotStart] = useState("09:00")
  const [slotEnd, setSlotEnd] = useState("10:00")
  const [isSavingSlot, setIsSavingSlot] = useState(false)

  // Meeting link
  const [meetingLinkSession, setMeetingLinkSession] = useState<SessionWithParticipants | null>(null)
  const [meetingLinkInput, setMeetingLinkInput] = useState("")
  const [isSavingLink, setIsSavingLink] = useState(false)

  // Student: book session
  const [showBooking, setShowBooking] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<SlotWithMentor | null>(null)
  const [agenda, setAgenda] = useState("")
  const [isBooking, setIsBooking] = useState(false)

  // Rating
  const [ratingSession, setRatingSession] = useState<SessionWithParticipants | null>(null)
  const [ratingValue, setRatingValue] = useState(0)
  const [ratingHover, setRatingHover] = useState(0)
  const [ratingFeedback, setRatingFeedback] = useState("")
  const [isRating, setIsRating] = useState(false)

  useEffect(() => {
    if (!currentUserId) return
    loadData()
  }, [projectId, currentUserId])

  async function loadData() {
    setIsLoading(true)
    const supabase = createClient()

    // Check if current user is a verified mentor
    const { data: mentorProfile } = await supabase
      .from("mentor_profiles")
      .select("id")
      .eq("user_id", currentUserId)
      .eq("is_verified", true)
      .maybeSingle()
    setIsMentor(!!mentorProfile)

    // Load sessions for this project
    const { data: sessionsData } = await supabase
      .from("mentor_sessions")
      .select(`
        *,
        mentor:profiles!mentor_sessions_mentor_id_fkey(*),
        student:profiles!mentor_sessions_student_id_fkey(*)
      `)
      .eq("project_id", projectId)
      .order("scheduled_at", { ascending: false })
    setSessions((sessionsData as SessionWithParticipants[]) || [])

    // Load available (unbooked) slots for this project, min 24h away
    const minBookingTime = new Date(Date.now() + 24 * 3600 * 1000).toISOString()
    const minDate = minBookingTime.slice(0, 10)
    const { data: slotsData } = await supabase
      .from("mentor_availability")
      .select(`
        *,
        mentor:profiles!mentor_availability_mentor_id_fkey(*)
      `)
      .eq("project_id", projectId)
      .eq("is_booked", false)
      .gte("available_date", minDate)
      .order("available_date", { ascending: true })
      .order("start_time", { ascending: true })
    setAvailableSlots((slotsData as SlotWithMentor[]) || [])

    setIsLoading(false)
  }

  async function handleAddSlot() {
    if (!slotDate || !slotStart || !slotEnd) { toast.error("Please fill all fields."); return }
    if (slotEnd <= slotStart) { toast.error("End time must be after start time."); return }

    setIsSavingSlot(true)
    const supabase = createClient()
    const { error } = await supabase.from("mentor_availability").insert({
      mentor_id: currentUserId,
      available_date: slotDate,
      start_time: slotStart,
      end_time: slotEnd,
      project_id: projectId,
    })

    if (error) { toast.error("Failed to save slot."); setIsSavingSlot(false); return }

    toast.success("Availability slot added.")
    setShowAddSlot(false)
    setSlotDate("")
    setSlotStart("09:00")
    setSlotEnd("10:00")
    setIsSavingSlot(false)
    loadData()
  }

  async function handleBookSession() {
    if (!selectedSlot || !currentUserId) return

    // Enforce 24-hour advance booking
    const slotDateTime = new Date(`${selectedSlot.available_date}T${selectedSlot.start_time}`)
    if (slotDateTime.getTime() - Date.now() < 24 * 3600 * 1000) {
      toast.error("Sessions must be booked at least 24 hours in advance.")
      return
    }

    setIsBooking(true)
    const supabase = createClient()

    // Create session
    const { data: newSession, error: sessionError } = await supabase
      .from("mentor_sessions")
      .insert({
        mentor_id: selectedSlot.mentor_id,
        student_id: currentUserId,
        project_id: projectId,
        availability_slot_id: selectedSlot.id,
        scheduled_at: `${selectedSlot.available_date}T${selectedSlot.start_time}`,
        agenda: agenda.trim() || null,
        status: "upcoming",
      })
      .select()
      .single()

    if (sessionError) {
      toast.error("Failed to book session.")
      setIsBooking(false)
      return
    }

    // Mark slot as booked
    await supabase
      .from("mentor_availability")
      .update({ is_booked: true, booked_by: currentUserId })
      .eq("id", selectedSlot.id)

    // Notify both parties
    await supabase.from("notifications").insert([
      {
        user_id: selectedSlot.mentor_id,
        type: "session_reminder",
        title: "Session Booked",
        message: `A student has booked your session on ${new Date(slotDateTime).toLocaleDateString()}`,
        link: `/projects/${projectId}`,
      },
      {
        user_id: currentUserId,
        type: "session_reminder",
        title: "Session Confirmed",
        message: `Your session with ${selectedSlot.mentor?.full_name} is confirmed.`,
        link: `/projects/${projectId}`,
      },
    ])

    toast.success("Session booked successfully!")
    setShowBooking(false)
    setSelectedSlot(null)
    setAgenda("")
    setIsBooking(false)
    loadData()
  }

  async function handleSubmitRating() {
    if (!ratingSession || ratingValue === 0) { toast.error("Please select a rating."); return }
    setIsRating(true)
    const supabase = createClient()

    await supabase
      .from("mentor_sessions")
      .update({
        student_rating: ratingValue,
        student_feedback: ratingFeedback.trim() || null,
        rating_completed: true,
        status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", ratingSession.id)

    // Award mentor points
    await completeMentorSession(ratingSession.mentor_id, ratingSession.id)
    if (ratingValue >= 4) {
      await receive4to5StarSessionRating(ratingSession.mentor_id, ratingSession.id)
      toast.success(`Session rated ${ratingValue}/5! Mentor earned Akili bonus points.`)
    } else {
      toast.success("Session rated. Thank you for your feedback!")
    }

    // Update mentor's average rating
    const { data: allSessions } = await supabase
      .from("mentor_sessions")
      .select("student_rating")
      .eq("mentor_id", ratingSession.mentor_id)
      .not("student_rating", "is", null)

    if (allSessions && allSessions.length > 0) {
      const avg = allSessions.reduce((sum: number, s: { student_rating: number | null }) => sum + (s.student_rating || 0), 0) / allSessions.length
      await supabase
        .from("mentor_profiles")
        .update({ rating: parseFloat(avg.toFixed(2)), total_sessions: allSessions.length })
        .eq("user_id", ratingSession.mentor_id)
    }

    setRatingSession(null)
    setRatingValue(0)
    setRatingFeedback("")
    setIsRating(false)
    loadData()
  }

  async function handleSaveMeetingLink() {
    if (!meetingLinkSession || !currentUserId) return
    const url = meetingLinkInput.trim()
    if (url && !url.startsWith('http')) { toast.error("Please enter a valid URL"); return }

    setIsSavingLink(true)
    const supabase = createClient()
    const { error } = await supabase
      .from("mentor_sessions")
      .update({ meeting_link: url || null })
      .eq("id", meetingLinkSession.id)

    if (!error && url) {
      // Notify student
      await supabase.from("notifications").insert({
        user_id: meetingLinkSession.student_id,
        type: "session_reminder",
        title: "Meeting link added",
        message: `Your mentor has added a meeting link for your session on ${new Date(meetingLinkSession.scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}. You can now join from your workspace.`,
        link: `/projects/${projectId}`,
        is_read: false,
      })
      toast.success("Meeting link saved and student notified")
    } else if (!error) {
      toast.success("Meeting link removed")
    } else {
      toast.error("Failed to save meeting link")
    }

    setIsSavingLink(false)
    setMeetingLinkSession(null)
    setMeetingLinkInput("")
    loadData()
  }

  // Sessions that need rating (student's past sessions, not yet rated)
  const needsRating = sessions.filter(
    (s) =>
      s.student_id === currentUserId &&
      !s.rating_completed &&
      new Date(s.scheduled_at) < new Date()
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Rate session prompts */}
      {needsRating.map((s) => (
        <Card key={s.id} style={{ background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.3)' }}>
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-500 shrink-0" />
              <div>
                <p className="text-sm font-medium" style={{ color: '#F3F0FF' }}>
                  Rate your session with {s.mentor?.full_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(s.scheduled_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => { setRatingSession(s); setRatingValue(0); setRatingFeedback("") }}
              style={{ background: 'rgba(234,179,8,0.15)', color: '#EAB308', border: '1px solid rgba(234,179,8,0.3)' }}
            >
              <Star className="h-4 w-4 mr-1" />
              Rate Session
            </Button>
          </CardContent>
        </Card>
      ))}

      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Mentor Sessions</h2>
          <p className="text-sm text-muted-foreground">Book and manage mentorship sessions for this project</p>
        </div>
        <div className="flex gap-2">
          {isMentor && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAddSlot(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Set Availability
            </Button>
          )}
          {!isMentor && availableSlots.length > 0 && (
            <Button
              size="sm"
              onClick={() => setShowBooking(true)}
              style={{ background: 'var(--cta-bg)', border: 'none' }}
            >
              <Calendar className="h-4 w-4 mr-1" />
              Book a Session
            </Button>
          )}
        </div>
      </div>

      {/* Available slots summary (student view) */}
      {!isMentor && availableSlots.length > 0 && (
        <Card style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.2)' }}>
          <CardContent className="p-4">
            <p className="text-sm font-medium mb-2" style={{ color: '#22C55E' }}>
              {availableSlots.length} slot{availableSlots.length !== 1 ? 's' : ''} available for booking
            </p>
            <div className="flex flex-wrap gap-2">
              {availableSlots.slice(0, 3).map((slot) => (
                <Badge
                  key={slot.id}
                  style={{ background: 'rgba(34,197,94,0.1)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.3)', cursor: 'pointer' }}
                  onClick={() => { setShowBooking(true) }}
                >
                  {new Date(slot.available_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {slot.start_time.slice(0, 5)}
                </Badge>
              ))}
              {availableSlots.length > 3 && (
                <Badge style={{ background: 'rgba(139,92,246,0.1)', color: '#A855F7', border: '1px solid rgba(139,92,246,0.3)' }}>
                  +{availableSlots.length - 3} more
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sessions list */}
      {sessions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <GraduationCap className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground">No sessions yet for this project.</p>
            {!isMentor && availableSlots.length === 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                No availability slots have been set by a mentor yet.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => {
            const isPast = new Date(session.scheduled_at) < new Date()
            const statusColor = session.status === 'completed' ? '#22C55E' : session.status === 'cancelled' ? '#EF4444' : '#06B6D4'
            return (
              <Card
                key={session.id}
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: '12px' }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={session.mentor?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {session.mentor?.full_name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{session.mentor?.full_name}</span>
                        <span className="text-xs text-muted-foreground">with</span>
                        <span className="text-sm text-muted-foreground">{session.student?.full_name}</span>
                        <Badge
                          style={{ background: `${statusColor}18`, color: statusColor, border: `1px solid ${statusColor}30`, fontSize: '11px' }}
                        >
                          {session.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(session.scheduled_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {session.agenda && (
                          <span>· {session.agenda}</span>
                        )}
                      </div>
                      {session.notes && (
                        <p className="text-xs text-muted-foreground mt-2 italic">
                          Notes: {session.notes}
                        </p>
                      )}
                      {/* Meeting link row */}
                      <div className="flex items-center gap-2 mt-2">
                        {(session as SessionWithParticipants & { meeting_link?: string }).meeting_link ? (
                          <Button
                            size="sm"
                            className="gap-1 h-7 text-xs"
                            style={{ background: 'var(--cta-bg)', border: 'none' }}
                            onClick={() => window.open((session as SessionWithParticipants & { meeting_link?: string }).meeting_link!, '_blank')}
                          >
                            <Video className="h-3 w-3" />
                            Join Session
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        ) : (
                          <>
                            {isMentor && session.mentor_id === currentUserId ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="gap-1 h-7 text-xs"
                                style={{ color: 'var(--muted-foreground)', border: '1px solid rgba(139,92,246,0.2)' }}
                                onClick={() => { setMeetingLinkSession(session); setMeetingLinkInput("") }}
                              >
                                <Link2 className="h-3 w-3" />
                                Add meeting link
                              </Button>
                            ) : (
                              <span className="text-xs" style={{ color: '#4A3F6B' }}>Awaiting meeting link</span>
                            )}
                          </>
                        )}
                      </div>
                      {session.student_rating && (
                        <div className="flex items-center gap-1 mt-2">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className="h-3 w-3"
                              style={{
                                color: i < session.student_rating! ? '#EAB308' : 'var(--muted-foreground)',
                                fill: i < session.student_rating! ? '#EAB308' : 'transparent',
                              }}
                            />
                          ))}
                          {session.student_feedback && (
                            <span className="text-xs text-muted-foreground ml-1">{session.student_feedback}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Add Slot Dialog (mentor) */}
      <Dialog open={showAddSlot} onOpenChange={setShowAddSlot}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Availability</DialogTitle>
            <DialogDescription>
              Add a time slot when you&apos;re available for a session on this project.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={slotDate}
                min={new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 10)}
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
              style={{ background: 'var(--cta-bg)', border: 'none' }}
            >
              {isSavingSlot ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Saving...</> : 'Save Slot'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Book Session Dialog (student) */}
      <Dialog open={showBooking} onOpenChange={(open) => { setShowBooking(open); if (!open) { setSelectedSlot(null); setAgenda("") } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Book a Session</DialogTitle>
            <DialogDescription>
              Select an available slot. Sessions must be booked at least 24 hours in advance.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Available Slots</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {availableSlots.map((slot) => {
                  const slotDT = new Date(`${slot.available_date}T${slot.start_time}`)
                  const hoursAway = (slotDT.getTime() - Date.now()) / 3600000
                  const tooSoon = hoursAway < 24
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      disabled={tooSoon}
                      onClick={() => setSelectedSlot(slot)}
                      className="w-full text-left p-3 rounded-lg transition-all"
                      style={{
                        background: selectedSlot?.id === slot.id
                          ? 'rgba(124,58,237,0.2)'
                          : tooSoon ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
                        border: selectedSlot?.id === slot.id
                          ? '1px solid rgba(168,85,247,0.6)'
                          : '1px solid rgba(139,92,246,0.2)',
                        opacity: tooSoon ? 0.5 : 1,
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium" style={{ color: '#F3F0FF' }}>
                            {slotDT.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)} · {slot.mentor?.full_name}
                          </p>
                        </div>
                        {tooSoon && <span className="text-xs" style={{ color: '#EF4444' }}>Too soon</span>}
                        {selectedSlot?.id === slot.id && <CheckCircle2 className="h-4 w-4 text-primary" />}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label>
                Agenda <span className="text-muted-foreground font-normal text-xs">(optional, max 100 chars)</span>
              </Label>
              <Input
                placeholder="What would you like to discuss?"
                value={agenda}
                onChange={(e) => setAgenda(e.target.value.slice(0, 100))}
              />
              <p className="text-xs text-muted-foreground text-right">{agenda.length}/100</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowBooking(false); setSelectedSlot(null); setAgenda("") }}>
              Cancel
            </Button>
            <Button
              disabled={!selectedSlot || isBooking}
              onClick={handleBookSession}
              style={{ background: 'var(--cta-bg)', border: 'none' }}
            >
              {isBooking ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Booking...</> : 'Confirm Booking'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Meeting Link Dialog */}
      <Dialog open={!!meetingLinkSession} onOpenChange={(open) => { if (!open) { setMeetingLinkSession(null); setMeetingLinkInput("") } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Meeting Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Paste a Google Meet, Zoom, or any video call link for this session.
            </p>
            <Input
              type="url"
              placeholder="https://meet.google.com/xxx-xxxx-xxx"
              value={meetingLinkInput}
              onChange={e => setMeetingLinkInput(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setMeetingLinkSession(null); setMeetingLinkInput("") }}>Cancel</Button>
            <Button
              disabled={isSavingLink}
              onClick={handleSaveMeetingLink}
              style={{ background: 'var(--cta-bg)', border: 'none' }}
            >
              {isSavingLink ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Saving...</> : 'Save Link'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rating Dialog */}
      <Dialog open={!!ratingSession} onOpenChange={() => { setRatingSession(null); setRatingValue(0); setRatingFeedback("") }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rate this Session</DialogTitle>
            <DialogDescription>
              How was your session with {ratingSession?.mentor?.full_name}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRatingValue(star)}
                  onMouseEnter={() => setRatingHover(star)}
                  onMouseLeave={() => setRatingHover(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className="h-8 w-8"
                    style={{
                      color: star <= (ratingHover || ratingValue) ? '#EAB308' : 'var(--muted-foreground)',
                      fill: star <= (ratingHover || ratingValue) ? '#EAB308' : 'transparent',
                    }}
                  />
                </button>
              ))}
            </div>
            <Textarea
              placeholder="Optional: share your feedback..."
              value={ratingFeedback}
              onChange={(e) => setRatingFeedback(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRatingSession(null); setRatingValue(0); setRatingFeedback("") }}>
              Cancel
            </Button>
            <Button
              disabled={ratingValue === 0 || isRating}
              onClick={handleSubmitRating}
              style={{ background: 'var(--cta-bg)', border: 'none' }}
            >
              {isRating ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Submitting...</> : 'Submit Rating'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
