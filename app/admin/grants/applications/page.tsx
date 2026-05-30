'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { format } from 'date-fns'
import { ListPageSkeleton } from '@/components/ui/skeleton-screens'

interface Application {
  id: string
  grant_id: string
  applicant_id: string
  status: string
  proposal_text: string
  expected_outcomes: string
  budget_breakdown: string | null
  timeline: string | null
  reviewer_notes: string | null
  awarded_amount: number | null
  submitted_at: string
  grants: { title: string; funder: string; amount_min: number | null; amount_max: number | null; currency: string } | null
  profiles: { full_name: string | null; email: string; department: string | null } | null
}

const STATUS_COLORS: Record<string, string> = {
  submitted: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  under_review: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  shortlisted: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  awarded: 'bg-green-500/10 text-green-400 border-green-500/20',
  rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
}

const STATUS_MESSAGES: Record<string, string> = {
  under_review: 'Your application is now under review.',
  shortlisted: 'Congratulations! You have been shortlisted.',
  awarded: 'Congratulations! You have been awarded this grant!',
  rejected: 'Your application was reviewed but not selected.',
}

export default function AdminGrantApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [updating, setUpdating] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => { loadApplications() }, [])

  async function loadApplications() {
    const { data } = await supabase
      .from('grant_applications')
      .select(`
        *,
        grants(title, funder, amount_min, amount_max, currency),
        profiles(full_name, email, department)
      `)
      .order('submitted_at', { ascending: false })
    setApplications((data as Application[]) || [])
    setLoading(false)
  }

  async function updateStatus(appId: string, status: string) {
    setUpdating(appId)
    await supabase
      .from('grant_applications')
      .update({
        status,
        reviewer_notes: notes[appId] || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', appId)

    const app = applications.find(a => a.id === appId)
    if (app && STATUS_MESSAGES[status]) {
      await supabase.from('notifications').insert({
        user_id: app.applicant_id,
        type: 'system',
        title: 'Grant application update',
        message: STATUS_MESSAGES[status],
        link: `/grants/${app.grant_id}/application`,
        is_read: false,
      })
    }

    setApplications(prev => prev.map(a => a.id === appId ? { ...a, status } : a))
    setUpdating(null)
  }

  const counts = {
    submitted: applications.filter(a => a.status === 'submitted').length,
    under_review: applications.filter(a => a.status === 'under_review').length,
    shortlisted: applications.filter(a => a.status === 'shortlisted').length,
    awarded: applications.filter(a => a.status === 'awarded').length,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Grant Applications</h1>
        <p className="text-muted-foreground text-sm mt-1">{applications.length} total applications</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Pending Review', value: counts.submitted, color: 'text-blue-400' },
          { label: 'Under Review', value: counts.under_review, color: 'text-yellow-400' },
          { label: 'Shortlisted', value: counts.shortlisted, color: 'text-purple-400' },
          { label: 'Awarded', value: counts.awarded, color: 'text-green-400' },
        ].map(stat => (
          <div key={stat.label} className="bg-card border border-border rounded-xl p-4 text-center">
            <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Applications */}
      {loading ? (
        <ListPageSkeleton type="card" count={4} />
      ) : applications.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No applications yet</p>
      ) : (
        <div className="space-y-3">
          {applications.map(app => (
            <div key={app.id} className="bg-card border border-border rounded-xl overflow-hidden">
              {/* Header row */}
              <div className="p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm">{app.profiles?.full_name || app.profiles?.email}</p>
                    <Badge variant="outline" className={`text-xs ${STATUS_COLORS[app.status]}`}>
                      {app.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Applied for: <span className="font-medium">{app.grants?.title}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {app.profiles?.department && `${app.profiles.department} · `}
                    Submitted {format(new Date(app.submitted_at), 'MMM d, yyyy')}
                  </p>
                </div>
                <button
                  onClick={() => setExpanded(expanded === app.id ? null : app.id)}
                  className="text-muted-foreground hover:text-foreground shrink-0"
                >
                  {expanded === app.id
                    ? <ChevronUp className="w-5 h-5" />
                    : <ChevronDown className="w-5 h-5" />}
                </button>
              </div>

              {/* Expanded */}
              {expanded === app.id && (
                <div className="border-t border-border p-4 space-y-4">
                  {[
                    { label: 'Research Proposal', value: app.proposal_text },
                    { label: 'Expected Outcomes', value: app.expected_outcomes },
                    app.budget_breakdown ? { label: 'Budget', value: app.budget_breakdown } : null,
                    app.timeline ? { label: 'Timeline', value: app.timeline } : null,
                  ].filter(Boolean).map(s => (
                    <div key={s!.label} className="space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{s!.label}</p>
                      <p className="text-sm leading-relaxed">{s!.value}</p>
                    </div>
                  ))}

                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Reviewer Notes (sent to applicant)
                    </p>
                    <Textarea
                      value={notes[app.id] ?? app.reviewer_notes ?? ''}
                      onChange={e => setNotes(prev => ({ ...prev, [app.id]: e.target.value }))}
                      placeholder="Add feedback for the applicant..."
                      rows={3}
                      className="resize-none text-sm"
                    />
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {[
                      { status: 'under_review', label: 'Mark Under Review', variant: 'outline' as const },
                      { status: 'shortlisted', label: 'Shortlist', variant: 'outline' as const },
                      { status: 'awarded', label: '🎉 Award Grant', variant: 'default' as const },
                      { status: 'rejected', label: 'Reject', variant: 'destructive' as const },
                    ].map(action => (
                      <Button
                        key={action.status}
                        size="sm"
                        variant={action.variant}
                        disabled={app.status === action.status || updating === app.id}
                        onClick={() => updateStatus(app.id, action.status)}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
