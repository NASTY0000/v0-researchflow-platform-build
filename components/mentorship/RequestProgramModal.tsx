'use client'

import { useState } from 'react'
import { Loader2, X, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { requestMentorshipProgram } from '@/lib/actions/mentorship'

interface Mentor {
  user_id: string
  profile: {
    full_name: string | null
    avatar_url: string | null
    department: string | null
  }
  expertise_areas?: string[]
}

interface RequestProgramModalProps {
  mentor: Mentor
  onClose: () => void
  onSuccess: () => void
}

const DURATIONS: { months: 1 | 3 | 6; label: string }[] = [
  { months: 1, label: '1 Month' },
  { months: 3, label: '3 Months' },
  { months: 6, label: '6 Months' },
]

const inputStyle = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(139,92,246,0.25)',
  color: '#F3F0FF',
}

export function RequestProgramModal({ mentor, onClose, onSuccess }: RequestProgramModalProps) {
  const [duration, setDuration] = useState<1 | 3 | 6>(3)
  const [focusArea, setFocusArea] = useState('')
  const [goals, setGoals] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit() {
    if (!focusArea.trim()) { setError('Please enter a focus area.'); return }
    if (goals.trim().length < 30) { setError('Goals must be at least 30 characters.'); return }

    setLoading(true)
    setError(null)

    const result = await requestMentorshipProgram({
      mentorId: mentor.user_id,
      durationMonths: duration,
      focusArea: focusArea.trim(),
      goals: goals.trim(),
    })

    setLoading(false)
    if (!result.success) {
      setError(result.error || 'Failed to send request.')
    } else {
      setSuccess(true)
      setTimeout(onSuccess, 1500)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: '#0F0A1E', border: '1px solid rgba(139,92,246,0.3)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid rgba(139,92,246,0.15)' }}>
          <div>
            <h2 className="text-lg font-bold font-heading">Request Mentorship Program</h2>
            <p className="text-xs mt-0.5 text-muted-foreground">
              with {mentor.profile.full_name}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ color: 'var(--muted-foreground)', background: 'rgba(255,255,255,0.05)' }}>
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {success ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto" style={{ background: 'rgba(34,197,94,0.15)' }}>
                <span style={{ fontSize: '24px' }}>✓</span>
              </div>
              <p className="font-semibold text-lg">Request sent!</p>
              <p className="text-sm text-muted-foreground">
                You will be notified when {mentor.profile.full_name} responds.
              </p>
            </div>
          ) : (
            <>
              {/* Mentor preview */}
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.18)' }}>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={mentor.profile.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {mentor.profile.full_name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm">{mentor.profile.full_name}</p>
                  {mentor.profile.department && (
                    <p className="text-xs text-muted-foreground">{mentor.profile.department}</p>
                  )}
                </div>
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <Label className="text-sm">Program Duration</Label>
                <div className="flex gap-2">
                  {DURATIONS.map((d) => (
                    <button
                      key={d.months}
                      type="button"
                      onClick={() => setDuration(d.months)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-sm font-medium transition-all"
                      style={
                        duration === d.months
                          ? { background: 'rgba(124,58,237,0.3)', border: '1px solid rgba(168,85,247,0.5)', color: '#E2D9F3' }
                          : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.2)', color: 'var(--muted-foreground)' }
                      }
                    >
                      <Clock size={13} />
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Focus Area */}
              <div className="space-y-2">
                <Label>Focus Area</Label>
                <Input
                  value={focusArea}
                  onChange={(e) => setFocusArea(e.target.value)}
                  placeholder="e.g. Statistical analysis, research writing, grant proposals"
                  style={inputStyle}
                  maxLength={120}
                />
              </div>

              {/* Goals */}
              <div className="space-y-2">
                <Label>
                  Goals
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    {goals.length}/500 · min 30 chars
                  </span>
                </Label>
                <Textarea
                  value={goals}
                  onChange={(e) => setGoals(e.target.value.slice(0, 500))}
                  placeholder="What do you want to achieve by the end of this program? Be specific about skills, outputs, or milestones you hope to reach."
                  rows={4}
                  style={inputStyle}
                />
              </div>

              {error && (
                <p className="text-sm" style={{ color: '#EF4444' }}>{error}</p>
              )}

              <div className="flex gap-3 pt-1">
                <Button
                  onClick={handleSubmit}
                  disabled={loading || !focusArea.trim() || goals.trim().length < 30}
                  className="flex-1"
                  style={{ background: 'var(--cta-bg)', border: 'none' }}
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending...</>
                  ) : (
                    'Send Request'
                  )}
                </Button>
                <Button variant="outline" onClick={onClose}>Cancel</Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
