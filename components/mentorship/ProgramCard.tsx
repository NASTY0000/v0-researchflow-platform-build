'use client'

import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, CheckCircle2 } from 'lucide-react'

interface ProgramCardProps {
  programId: string
  otherPerson: {
    full_name: string | null
    avatar_url: string | null
    university_name?: string | null
  }
  role: 'mentor' | 'mentee'
  status: string
  focusArea: string
  durationMonths: number
  milestones: { is_completed: boolean }[]
  startedAt: string | null
  expectedEndAt: string | null
}

const STATUS_STYLES: Record<string, { label: string; bg: string; color: string }> = {
  requested:  { label: 'Pending',    bg: 'rgba(245,158,11,0.15)',  color: '#F59E0B' },
  active:     { label: 'Active',     bg: 'rgba(34,197,94,0.12)',   color: '#22C55E' },
  completed:  { label: 'Completed',  bg: 'rgba(168,85,247,0.15)',  color: '#A855F7' },
  declined:   { label: 'Declined',   bg: 'rgba(239,68,68,0.12)',   color: '#EF4444' },
  cancelled:  { label: 'Cancelled',  bg: 'rgba(107,114,128,0.15)', color: '#9CA3AF' },
}

export function ProgramCard({
  programId, otherPerson, role, status, focusArea,
  durationMonths, milestones, startedAt, expectedEndAt,
}: ProgramCardProps) {
  const done   = milestones.filter((m) => m.is_completed).length
  const total  = milestones.length
  const pct    = total > 0 ? Math.round((done / total) * 100) : 0
  const style  = STATUS_STYLES[status] ?? STATUS_STYLES.active

  const daysLeft = expectedEndAt
    ? Math.ceil((new Date(expectedEndAt).getTime() - Date.now()) / 86400000)
    : null

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(139,92,246,0.2)',
        borderRadius: '16px',
        padding: '16px',
      }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Avatar className="h-9 w-9">
            <AvatarImage src={otherPerson.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {otherPerson.full_name?.charAt(0) || '?'}
            </AvatarFallback>
          </Avatar>
          <div>
            <p style={{ fontWeight: 600, fontSize: '14px', color: '#F3F0FF' }}>
              {otherPerson.full_name}
            </p>
            <p style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>
              {role === 'mentor' ? 'Mentee' : 'Mentor'}
              {otherPerson.university_name ? ` · ${otherPerson.university_name}` : ''}
            </p>
          </div>
        </div>
        <span
          style={{
            fontSize: '11px', fontWeight: 600, padding: '3px 10px',
            borderRadius: '100px', background: style.bg, color: style.color,
          }}
        >
          {style.label}
        </span>
      </div>

      {/* Duration badge + focus area */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <Badge style={{ background: 'rgba(124,58,237,0.15)', color: '#C4B5FD', border: '1px solid rgba(168,85,247,0.3)', fontSize: '11px' }}>
          <Clock size={10} className="mr-1" />
          {durationMonths}-Month Program
        </Badge>
      </div>

      <p style={{ fontSize: '13px', color: '#D4C8F0', marginBottom: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {focusArea}
      </p>

      {/* Milestone progress */}
      {total > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
            <span style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>Milestones</span>
            <span style={{ fontSize: '11px', color: '#A855F7' }}>
              <CheckCircle2 size={10} className="inline mr-1" />
              {done}/{total}
            </span>
          </div>
          <div style={{ height: '5px', borderRadius: '100px', background: 'rgba(139,92,246,0.15)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, borderRadius: '100px', background: 'var(--cta-bg-90)', transition: 'width 0.5s ease' }} />
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        {daysLeft !== null && status === 'active' && (
          <span style={{ fontSize: '11px', color: daysLeft < 14 ? '#F59E0B' : 'var(--muted-foreground)' }}>
            {daysLeft > 0 ? `${daysLeft} days left` : 'Overdue'}
          </span>
        )}
        {startedAt && status === 'active' && (
          <span style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>
            Started {new Date(startedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        )}
        <Link href={`/mentors/${programId}`} style={{ marginLeft: 'auto' }}>
          <Button size="sm" style={{ background: 'var(--cta-bg)', border: 'none', fontSize: '12px', height: '30px' }}>
            View Program
          </Button>
        </Link>
      </div>
    </div>
  )
}
