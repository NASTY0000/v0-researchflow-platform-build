'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'
import { ListPageSkeleton } from '@/components/ui/skeleton-screens'

interface ApplicationData {
  id: string
  status: string
  proposal_text: string
  expected_outcomes: string
  budget_breakdown: string | null
  timeline: string | null
  reviewer_notes: string | null
  awarded_amount: number | null
  submitted_at: string
  grants: { title: string; funder: string } | null
}

const STATUS_CONFIG: Record<string, { label: string; color: string; description: string }> = {
  submitted: {
    label: 'Submitted',
    color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    description: 'Your application has been received and is awaiting review.',
  },
  under_review: {
    label: 'Under Review',
    color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    description: 'Reviewers are currently evaluating your application.',
  },
  shortlisted: {
    label: 'Shortlisted',
    color: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    description: 'Congratulations! You have been shortlisted for this grant.',
  },
  awarded: {
    label: 'Awarded',
    color: 'bg-green-500/10 text-green-400 border-green-500/20',
    description: 'Congratulations! You have been awarded this grant.',
  },
  rejected: {
    label: 'Not Selected',
    color: 'bg-red-500/10 text-red-400 border-red-500/20',
    description: 'Unfortunately your application was not selected this time.',
  },
}

export default function MyApplicationPage() {
  const params = useParams()
  const router = useRouter()
  const grantId = params.id as string
  const [data, setData] = useState<ApplicationData | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: app } = await supabase
        .from('grant_applications')
        .select('*, grants(title, funder)')
        .eq('grant_id', grantId)
        .eq('applicant_id', user.id)
        .maybeSingle()

      setData(app)
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grantId])

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <ListPageSkeleton type="card" count={3} />
    </div>
  )

  if (!data) return (
    <div className="text-center py-12">
      <p className="text-muted-foreground">Application not found</p>
      <Button className="mt-4" onClick={() => router.back()}>Go Back</Button>
    </div>
  )

  const status = STATUS_CONFIG[data.status] ?? STATUS_CONFIG.submitted

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">
      <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
        <ArrowLeft className="w-4 h-4" /> Back
      </Button>

      <div className="space-y-1">
        <h1 className="text-2xl font-bold">My Application</h1>
        <p className="text-muted-foreground">{data.grants?.title}</p>
      </div>

      {/* Status */}
      <div className={`p-4 rounded-xl border ${status.color}`}>
        <p className="font-semibold">{status.label}</p>
        <p className="text-sm mt-1 opacity-80">{status.description}</p>
        {data.reviewer_notes && (
          <div className="mt-3 pt-3 border-t border-current/20">
            <p className="text-xs font-medium opacity-70">Reviewer Notes:</p>
            <p className="text-sm mt-1">{data.reviewer_notes}</p>
          </div>
        )}
        {data.awarded_amount && (
          <div className="mt-3 pt-3 border-t border-current/20">
            <p className="font-semibold">Awarded Amount: ${data.awarded_amount.toLocaleString()}</p>
          </div>
        )}
      </div>

      {/* Application content */}
      <div className="space-y-4">
        {[
          { label: 'Research Proposal', value: data.proposal_text },
          { label: 'Expected Outcomes', value: data.expected_outcomes },
          data.budget_breakdown ? { label: 'Budget Breakdown', value: data.budget_breakdown } : null,
          data.timeline ? { label: 'Timeline', value: data.timeline } : null,
        ].filter(Boolean).map(section => (
          <div key={section!.label} className="bg-card border border-border rounded-xl p-5 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {section!.label}
            </p>
            <p className="text-sm leading-relaxed">{section!.value}</p>
          </div>
        ))}

        <p className="text-xs text-muted-foreground text-center">
          Submitted {format(new Date(data.submitted_at), 'MMMM d, yyyy')}
        </p>
      </div>
    </div>
  )
}
