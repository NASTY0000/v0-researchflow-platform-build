'use client'

import { useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { completeMilestone } from '@/lib/actions/mentorship'
import { format, parseISO, isPast } from 'date-fns'

interface Milestone {
  id: string
  title: string
  description?: string | null
  due_date?: string | null
  is_completed: boolean
  completed_at?: string | null
  position: number
}

interface MilestoneListProps {
  milestones: Milestone[]
  canComplete?: boolean
  onUpdate?: (id: string) => void
}

export function MilestoneList({ milestones, canComplete = true, onUpdate }: MilestoneListProps) {
  const [completing, setCompleting] = useState<string | null>(null)
  const [localDone, setLocalDone] = useState<Set<string>>(
    new Set(milestones.filter((m) => m.is_completed).map((m) => m.id))
  )

  async function handleComplete(id: string) {
    if (!canComplete || localDone.has(id)) return
    setCompleting(id)
    const result = await completeMilestone(id)
    if (result.success) {
      setLocalDone((prev) => new Set([...prev, id]))
      onUpdate?.(id)
    }
    setCompleting(null)
  }

  const sorted = [...milestones].sort((a, b) => a.position - b.position)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      {sorted.map((m, i) => {
        const done = localDone.has(m.id)
        const isOverdue = m.due_date && !done && isPast(parseISO(m.due_date))
        const isLoading = completing === m.id

        return (
          <div
            key={m.id}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '12px',
              borderRadius: '10px',
              background: done ? 'rgba(34,197,94,0.04)' : 'transparent',
              transition: 'background 0.2s',
            }}
          >
            {/* Position + checkbox */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, paddingTop: '1px' }}>
              <span style={{ fontSize: '11px', color: 'rgba(139,92,246,0.45)', width: '14px', textAlign: 'right' }}>
                {i + 1}.
              </span>
              <button
                type="button"
                onClick={() => handleComplete(m.id)}
                disabled={done || !canComplete || isLoading}
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '6px',
                  border: done
                    ? '1.5px solid rgba(34,197,94,0.5)'
                    : '1.5px solid rgba(139,92,246,0.4)',
                  background: done
                    ? 'rgba(34,197,94,0.15)'
                    : 'rgba(255,255,255,0.03)',
                  cursor: done || !canComplete ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.15s',
                }}
              >
                {isLoading ? (
                  <Loader2 size={11} style={{ color: '#A855F7', animation: 'spin 1s linear infinite' }} />
                ) : done ? (
                  <Check size={11} style={{ color: '#22C55E' }} />
                ) : null}
              </button>
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: done ? 'rgba(139,92,246,0.5)' : '#F3F0FF',
                  textDecoration: done ? 'line-through' : 'none',
                  lineHeight: 1.4,
                }}
              >
                {m.title}
              </p>
              {m.description && !done && (
                <p style={{ fontSize: '12px', color: '#7C6A9C', marginTop: '2px' }}>{m.description}</p>
              )}
              {m.due_date && (
                <p style={{
                  fontSize: '11px',
                  color: done ? '#22C55E' : isOverdue ? '#EF4444' : '#7C6A9C',
                  marginTop: '3px',
                }}>
                  {done
                    ? `Completed ${m.completed_at ? format(parseISO(m.completed_at), 'MMM d') : ''}`
                    : `Due ${format(parseISO(m.due_date), 'MMM d, yyyy')}${isOverdue ? ' · Overdue' : ''}`}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
