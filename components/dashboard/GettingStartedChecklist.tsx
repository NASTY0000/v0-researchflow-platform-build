'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Check, X, ArrowRight } from 'lucide-react'

interface ChecklistItem {
  key: string
  label: string
  description: string
  href: string
  completed: boolean
}

interface Props {
  userId: string
  akiliScore: number
  joinedAt: string
  hasBio: boolean
}

export function GettingStartedChecklist({ userId, akiliScore, joinedAt, hasBio }: Props) {
  const [visible, setVisible] = useState(false)
  const [items, setItems] = useState<ChecklistItem[]>([
    { key: 'profile', label: 'Complete your profile', description: 'Add a bio to introduce yourself', href: '/profile', completed: false },
    { key: 'idea', label: 'Post your first idea', description: 'Share a research concept with the community', href: '/ideas/new', completed: false },
    { key: 'connection', label: 'Connect with a researcher', description: 'Make your first collaboration connection', href: '/matches', completed: false },
    { key: 'mentor', label: 'Explore the Mentor Directory', description: 'Discover experienced researchers who can guide you', href: '/mentors', completed: false },
  ])

  useEffect(() => {
    // Don't show if already dismissed
    if (localStorage.getItem('rf_checklist_done')) return

    // Only show for new users (joined < 7 days ago OR akili_score < 100)
    const joinedDaysAgo = (Date.now() - new Date(joinedAt).getTime()) / (1000 * 60 * 60 * 24)
    const isNewUser = joinedDaysAgo < 7 || akiliScore < 100
    if (!isNewUser) return

    const mentorHintDismissed = !!localStorage.getItem('rf_hint_mentors')

    async function checkCompletion() {
      const supabase = createClient()

      const [ideasRes, connectionsRes] = await Promise.all([
        supabase.from('research_ideas').select('id', { count: 'exact', head: true }).eq('author_id', userId),
        supabase.from('connections').select('id', { count: 'exact', head: true })
          .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
          .eq('status', 'accepted'),
      ])

      setItems([
        { key: 'profile', label: 'Complete your profile', description: 'Add a bio to introduce yourself', href: '/profile', completed: hasBio },
        { key: 'idea', label: 'Post your first idea', description: 'Share a research concept with the community', href: '/ideas/new', completed: (ideasRes.count ?? 0) > 0 },
        { key: 'connection', label: 'Connect with a researcher', description: 'Make your first collaboration connection', href: '/matches', completed: (connectionsRes.count ?? 0) > 0 },
        { key: 'mentor', label: 'Explore the Mentor Directory', description: 'Discover experienced researchers who can guide you', href: '/mentors', completed: mentorHintDismissed },
      ])

      setVisible(true)
    }

    checkCompletion()
  }, [userId, akiliScore, joinedAt, hasBio])

  const completed = items.filter(i => i.completed).length
  const allDone = completed === items.length

  const dismiss = () => {
    localStorage.setItem('rf_checklist_done', 'true')
    setVisible(false)
  }

  useEffect(() => {
    if (allDone && visible) {
      const t = setTimeout(dismiss, 4000)
      return () => clearTimeout(t)
    }
  }, [allDone, visible])

  if (!visible) return null

  if (allDone) {
    return (
      <div className="relative rounded-2xl p-6 mb-2 text-center bg-banner" style={{ border: '1px solid rgba(139,92,246,0.3)' }}>
        <button onClick={dismiss} className="absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center text-primary/40 hover:text-primary hover:bg-primary/15 transition-all text-xs font-bold">
          <X className="w-3 h-3" />
        </button>
        <div className="text-3xl mb-3">🎉</div>
        <h3 className="text-lg font-bold text-banner-foreground mb-1">You're all set!</h3>
        <p className="text-sm text-banner-muted-foreground">You've completed all the getting started steps. Your research journey is underway.</p>
      </div>
    )
  }

  return (
    <div className="relative rounded-2xl p-5 mb-2 bg-banner" style={{ border: '1px solid rgba(139,92,246,0.2)' }}>
      <button
        onClick={dismiss}
        className="absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center text-primary/40 hover:text-primary hover:bg-primary/15 transition-all"
        aria-label="Dismiss checklist"
      >
        <X className="w-3 h-3" />
      </button>

      <div className="mb-4 pr-8">
        <h3 className="font-semibold font-heading text-banner-foreground mb-1">Get started on ResearchFlow</h3>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(139,92,246,0.2)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${(completed / items.length) * 100}%`, background: 'linear-gradient(90deg,#7C3AED,#A855F7)' }}
            />
          </div>
          <span className="text-xs font-medium flex-shrink-0 text-banner-muted-foreground">
            {completed}/{items.length}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {items.map(item => (
          <Link key={item.key} href={item.completed ? '#' : item.href}>
            <div className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${item.completed ? 'opacity-50 cursor-default' : 'cursor-pointer hover:bg-primary/8'}`}>
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300"
                style={{
                  background: item.completed ? 'rgba(124,58,237,0.9)' : 'rgba(139,92,246,0.15)',
                  border: `1.5px solid ${item.completed ? 'rgba(168,85,247,0.8)' : 'rgba(139,92,246,0.35)'}`,
                }}
              >
                {item.completed && <Check className="w-3 h-3 text-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${item.completed ? 'line-through text-banner-muted-foreground' : 'text-banner-foreground/85'}`}>
                  {item.label}
                </p>
                {!item.completed && (
                  <p className="text-xs mt-0.5 text-banner-muted-foreground">{item.description}</p>
                )}
              </div>
              {!item.completed && (
                <ArrowRight className="w-3.5 h-3.5 flex-shrink-0 text-banner-muted-foreground" />
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
