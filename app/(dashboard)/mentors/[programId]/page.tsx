'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, Target, CheckCircle2, Loader2, Star } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { MilestoneList } from '@/components/mentorship/MilestoneList'
import { getProgramDetail, completeMentorshipProgram, type ProgramDetail } from '@/lib/actions/mentorship'
import { format, parseISO, formatDistanceToNow } from 'date-fns'

const STATUS_STYLES: Record<string, { label: string; bg: string; color: string }> = {
  requested: { label: 'Pending Acceptance', bg: 'rgba(245,158,11,0.15)',  color: '#F59E0B' },
  active:    { label: 'Active',             bg: 'rgba(34,197,94,0.12)',   color: '#22C55E' },
  completed: { label: 'Completed',          bg: 'rgba(168,85,247,0.15)', color: '#A855F7' },
  declined:  { label: 'Declined',           bg: 'rgba(239,68,68,0.12)',  color: '#EF4444' },
  cancelled: { label: 'Cancelled',          bg: 'rgba(107,114,128,0.15)', color: '#9CA3AF' },
}

const cardStyle = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(139,92,246,0.18)',
  borderRadius: '16px',
  padding: '20px',
} as React.CSSProperties

const inputStyle = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(139,92,246,0.25)',
  color: '#F3F0FF',
} as React.CSSProperties

export default function ProgramDetailPage() {
  const params = useParams()
  const router = useRouter()
  const programId = params.programId as string

  const [program, setProgram] = useState<ProgramDetail | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [milestones, setMilestones] = useState<ProgramDetail['mentorship_milestones']>([])

  // Complete form state
  const [showCompleteForm, setShowCompleteForm] = useState(false)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [review, setReview] = useState('')
  const [mentorNotes, setMentorNotes] = useState('')
  const [completing, setCompleting] = useState(false)
  const [completeError, setCompleteError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const result = await getProgramDetail(programId)
      if (!result) { router.push('/mentors'); return }
      setProgram(result.data)
      setMilestones(result.data.mentorship_milestones)
      setCurrentUserId(result.currentUserId)
      setLoading(false)
    }
    load()
  }, [programId, router])

  async function handleComplete() {
    if (!program) return
    setCompleting(true)
    setCompleteError(null)

    const isMentee = currentUserId === program.mentee_id
    const result = await completeMentorshipProgram(programId, {
      menteeRating:  isMentee ? (rating || undefined) : undefined,
      menteeReview:  isMentee ? review || undefined : undefined,
      mentorNotes:   !isMentee ? mentorNotes || undefined : undefined,
    })

    setCompleting(false)
    if (!result.success) {
      setCompleteError(result.error || 'Failed to complete program')
    } else {
      setProgram((p) => p ? { ...p, status: 'completed', completed_at: new Date().toISOString() } : p)
      setShowCompleteForm(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        {[1,2,3].map((i) => (
          <div key={i} style={{ ...cardStyle, height: '120px', background: 'rgba(139,92,246,0.05)', animation: 'pulse 1.5s ease-in-out infinite' }} />
        ))}
      </div>
    )
  }
  if (!program) return null

  const isMentor = currentUserId === program.mentor_id
  const isMentee = currentUserId === program.mentee_id
  const statusStyle = STATUS_STYLES[program.status] ?? STATUS_STYLES.active
  const allDone = milestones.length > 0 && milestones.every((m) => m.is_completed)
  const doneCount = milestones.filter((m) => m.is_completed).length

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }`}</style>

      {/* Back */}
      <Link href="/mentors" className="inline-flex items-center gap-2 text-sm" style={{ color: '#A855F7' }}>
        <ArrowLeft size={15} />Back to Mentors
      </Link>

      {/* Header card */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <div>
            <h1 className="text-xl font-bold font-heading" style={{ letterSpacing: '-0.02em' }}>
              Mentorship Program
            </h1>
            <p style={{ fontSize: '14px', color: '#7C6A9C', marginTop: '2px' }}>{program.focus_area}</p>
          </div>
          <span style={{ fontSize: '12px', fontWeight: 600, padding: '4px 12px', borderRadius: '100px', background: statusStyle.bg, color: statusStyle.color, flexShrink: 0 }}>
            {statusStyle.label}
          </span>
        </div>

        {/* Mentor + Mentee */}
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          {[
            { label: 'Mentor', person: program.mentor },
            { label: 'Mentee', person: program.mentee },
          ].map(({ label, person }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Avatar className="h-9 w-9">
                <AvatarImage src={person.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                  {person.full_name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p style={{ fontSize: '11px', color: '#7C6A9C' }}>{label}</p>
                <p style={{ fontSize: '14px', fontWeight: 500, color: '#F3F0FF' }}>{person.full_name}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Meta row */}
        <div style={{ display: 'flex', gap: '16px', marginTop: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#7C6A9C' }}>
            <Clock size={13} />
            {program.duration_months}-month program
          </div>
          {program.started_at && (
            <div style={{ fontSize: '12px', color: '#7C6A9C' }}>
              Started {format(parseISO(program.started_at), 'MMM d, yyyy')}
            </div>
          )}
          {program.expected_end_at && program.status === 'active' && (
            <div style={{ fontSize: '12px', color: '#7C6A9C' }}>
              Ends {format(parseISO(program.expected_end_at), 'MMM d, yyyy')}
            </div>
          )}
          {program.completed_at && (
            <div style={{ fontSize: '12px', color: '#22C55E' }}>
              Completed {format(parseISO(program.completed_at), 'MMM d, yyyy')}
            </div>
          )}
        </div>
      </div>

      {/* Goals */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <Target size={15} style={{ color: '#A855F7' }} />
          <p style={{ fontWeight: 600, fontSize: '14px', color: '#C4B5FD' }}>Program Goals</p>
        </div>
        <p style={{ fontSize: '14px', color: '#D4C8F0', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{program.goals}</p>
      </div>

      {/* Milestones */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={15} style={{ color: '#A855F7' }} />
            <p style={{ fontWeight: 600, fontSize: '14px', color: '#C4B5FD' }}>Milestones</p>
          </div>
          <span style={{ fontSize: '12px', color: '#A855F7' }}>{doneCount}/{milestones.length} complete</span>
        </div>

        {milestones.length > 0 ? (
          <>
            {/* Progress bar */}
            <div style={{ height: '6px', borderRadius: '100px', background: 'rgba(139,92,246,0.12)', marginBottom: '16px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${milestones.length > 0 ? Math.round(doneCount / milestones.length * 100) : 0}%`, borderRadius: '100px', background: 'linear-gradient(90deg,#7C3AED,#A855F7)', transition: 'width 0.5s ease' }} />
            </div>
            <MilestoneList
              milestones={milestones}
              canComplete={program.status === 'active'}
              onUpdate={(id) => setMilestones((prev) => prev.map((m) => m.id === id ? { ...m, is_completed: true, completed_at: new Date().toISOString() } : m))}
            />
          </>
        ) : (
          <p style={{ fontSize: '13px', color: 'rgba(139,92,246,0.4)', textAlign: 'center', padding: '20px 0' }}>
            Milestones will appear once the program is accepted.
          </p>
        )}
      </div>

      {/* Sessions */}
      {program.program_sessions.length > 0 && (
        <div style={cardStyle}>
          <p style={{ fontWeight: 600, fontSize: '14px', color: '#C4B5FD', marginBottom: '12px' }}>Check-in Sessions</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[...program.program_sessions]
              .sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime())
              .map((session) => (
                <div key={session.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '10px', background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.12)' }}>
                  <div>
                    <p style={{ fontSize: '13px', color: '#D4C8F0' }}>
                      {format(parseISO(session.scheduled_at), 'MMM d, yyyy · h:mm a')}
                    </p>
                    <p style={{ fontSize: '11px', color: '#7C6A9C', marginTop: '2px' }}>
                      {session.format.replace('_', ' ')} · {session.duration_minutes} min
                    </p>
                  </div>
                  <Badge style={{
                    fontSize: '10px',
                    background: session.status === 'completed' ? 'rgba(34,197,94,0.12)' : 'rgba(139,92,246,0.12)',
                    color: session.status === 'completed' ? '#22C55E' : '#A855F7',
                    border: 'none',
                  }}>
                    {session.status}
                  </Badge>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Completion section */}
      {program.status === 'active' && (allDone || program.status === 'active') && (
        <div style={{ ...cardStyle, border: '1px solid rgba(168,85,247,0.3)', background: 'rgba(124,58,237,0.05)' }}>
          <p style={{ fontWeight: 600, fontSize: '14px', color: '#C4B5FD', marginBottom: '4px' }}>
            {allDone ? '🎉 All milestones complete!' : 'Mark Program Complete'}
          </p>
          <p style={{ fontSize: '13px', color: '#7C6A9C', marginBottom: '14px' }}>
            {allDone
              ? 'Ready to complete this program? Both parties earn Akili points upon completion.'
              : 'You can complete this program even if not all milestones are done.'}
          </p>

          {!showCompleteForm ? (
            <Button
              onClick={() => setShowCompleteForm(true)}
              style={{ background: 'linear-gradient(135deg,#7C3AED,#A855F7)', border: 'none' }}
            >
              Mark as Complete
            </Button>
          ) : (
            <div className="space-y-4">
              {isMentee && (
                <>
                  <div className="space-y-2">
                    <Label>Rate your mentor (optional)</Label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {[1,2,3,4,5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setRating(n)}
                          onMouseEnter={() => setHoverRating(n)}
                          onMouseLeave={() => setHoverRating(0)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}
                        >
                          <Star size={22} style={{ color: n <= (hoverRating || rating) ? '#FBBF24' : 'rgba(139,92,246,0.25)', fill: n <= (hoverRating || rating) ? '#FBBF24' : 'none', transition: 'all 0.1s' }} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Leave a review (optional)</Label>
                    <Textarea
                      value={review}
                      onChange={(e) => setReview(e.target.value)}
                      placeholder="What did you find most valuable about this program?"
                      rows={3}
                      style={inputStyle}
                    />
                  </div>
                </>
              )}

              {isMentor && (
                <div className="space-y-2">
                  <Label>Mentor notes (optional)</Label>
                  <Textarea
                    value={mentorNotes}
                    onChange={(e) => setMentorNotes(e.target.value)}
                    placeholder="Summarise the mentee's progress and outcomes..."
                    rows={3}
                    style={inputStyle}
                  />
                </div>
              )}

              {completeError && (
                <Alert variant="destructive">
                  <AlertDescription>{completeError}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={handleComplete}
                  disabled={completing}
                  style={{ background: 'linear-gradient(135deg,#7C3AED,#A855F7)', border: 'none' }}
                >
                  {completing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Completing...</> : 'Confirm Completion'}
                </Button>
                <Button variant="outline" onClick={() => setShowCompleteForm(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Completed state */}
      {program.status === 'completed' && (
        <div style={{ ...cardStyle, textAlign: 'center', padding: '32px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(168,85,247,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <CheckCircle2 size={26} style={{ color: '#A855F7' }} />
          </div>
          <p style={{ fontWeight: 700, fontSize: '18px', color: '#F3F0FF' }}>Program Completed</p>
          {program.completed_at && (
            <p style={{ fontSize: '13px', color: '#7C6A9C', marginTop: '4px' }}>
              {formatDistanceToNow(parseISO(program.completed_at), { addSuffix: true })}
            </p>
          )}
          {program.mentee_rating && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginTop: '12px' }}>
              {[1,2,3,4,5].map((n) => (
                <Star key={n} size={18} style={{ color: n <= program.mentee_rating! ? '#FBBF24' : 'rgba(139,92,246,0.2)', fill: n <= program.mentee_rating! ? '#FBBF24' : 'none' }} />
              ))}
            </div>
          )}
          {program.mentee_review && (
            <p style={{ fontSize: '13px', color: '#D4C8F0', marginTop: '10px', fontStyle: 'italic' }}>
              &ldquo;{program.mentee_review}&rdquo;
            </p>
          )}
        </div>
      )}
    </div>
  )
}
