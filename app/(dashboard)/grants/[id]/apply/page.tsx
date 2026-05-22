'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Send, AlertCircle } from 'lucide-react'

interface Grant {
  id: string
  title: string
  funder: string
  deadline: string | null
}

export default function ApplyPage() {
  const params = useParams()
  const router = useRouter()
  const grantId = params.id as string
  const [grant, setGrant] = useState<Grant | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    proposal_text: '',
    expected_outcomes: '',
    budget_breakdown: '',
    timeline: '',
  })
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('grants')
      .select('id, title, funder, deadline')
      .eq('id', grantId)
      .single()
      .then(({ data }) => setGrant(data))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grantId])

  function set(field: keyof typeof formData, value: string) {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit() {
    if (!formData.proposal_text.trim()) { setError('Research proposal is required'); return }
    if (!formData.expected_outcomes.trim()) { setError('Expected outcomes are required'); return }
    if (formData.proposal_text.length < 200) {
      setError('Proposal must be at least 200 characters')
      return
    }

    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const { error: submitError } = await supabase.from('grant_applications').insert({
      grant_id: grantId,
      applicant_id: user.id,
      proposal_text: formData.proposal_text,
      expected_outcomes: formData.expected_outcomes,
      budget_breakdown: formData.budget_breakdown || null,
      timeline: formData.timeline || null,
      status: 'submitted',
      submitted_at: new Date().toISOString(),
    })

    if (submitError) {
      setError(submitError.code === '23505' ? 'You have already applied for this grant' : submitError.message)
      setLoading(false)
      return
    }

    // Award Akili points for applying
    try {
      await supabase.from('akili_score_events').insert({
        user_id: user.id,
        event_type: 'grant_application',
        points_earned: 25,
        description: `Applied for: ${grant?.title}`,
        related_id: grantId,
      })
    } catch { /* non-critical */ }

    // Notify the applicant
    await supabase.from('notifications').insert({
      user_id: user.id,
      type: 'system',
      title: 'Application submitted!',
      message: `Your application for "${grant?.title}" has been submitted successfully.`,
      link: `/grants/${grantId}/application`,
      is_read: false,
    })

    router.push(`/grants/${grantId}`)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">
      <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
        <ArrowLeft className="w-4 h-4" /> Back
      </Button>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Apply for Grant</h1>
        {grant && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
            <p className="font-semibold">{grant.title}</p>
            <p className="text-sm text-muted-foreground mt-1">{grant.funder}</p>
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="bg-teal-500/5 border border-teal-500/20 rounded-xl p-4 text-sm text-teal-400 space-y-1">
        <p className="font-semibold">💡 Tips for a strong application:</p>
        <ul className="space-y-1 text-teal-400/80 ml-4 list-disc">
          <li>Be specific about your research question</li>
          <li>Explain why you are uniquely qualified</li>
          <li>Show clear, measurable outcomes</li>
          <li>Be realistic about your budget</li>
        </ul>
      </div>

      <div className="space-y-6">
        {/* Research Proposal */}
        <div className="space-y-2">
          <Label className="text-base font-semibold">Research Proposal *</Label>
          <p className="text-sm text-muted-foreground">
            Describe your research, its significance, and your methodology. Minimum 200 characters.
          </p>
          <Textarea
            value={formData.proposal_text}
            onChange={e => set('proposal_text', e.target.value)}
            placeholder="Describe your research project, its importance to African research, and how you plan to conduct it..."
            rows={8}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground text-right">
            {formData.proposal_text.length} characters
            {formData.proposal_text.length > 0 && formData.proposal_text.length < 200 &&
              ` (${200 - formData.proposal_text.length} more needed)`}
          </p>
        </div>

        {/* Expected Outcomes */}
        <div className="space-y-2">
          <Label className="text-base font-semibold">Expected Outcomes *</Label>
          <p className="text-sm text-muted-foreground">What will you produce or achieve with this funding?</p>
          <Textarea
            value={formData.expected_outcomes}
            onChange={e => set('expected_outcomes', e.target.value)}
            placeholder="e.g. A published research paper, a dataset, a prototype, policy recommendations..."
            rows={4}
            className="resize-none"
          />
        </div>

        {/* Budget */}
        <div className="space-y-2">
          <Label className="text-base font-semibold">Budget Breakdown</Label>
          <p className="text-sm text-muted-foreground">How will you use the funding?</p>
          <Textarea
            value={formData.budget_breakdown}
            onChange={e => set('budget_breakdown', e.target.value)}
            placeholder="e.g. Equipment: $2,000 | Travel: $1,500 | Research materials: $500 | Publication fees: $1,000"
            rows={4}
            className="resize-none"
          />
        </div>

        {/* Timeline */}
        <div className="space-y-2">
          <Label className="text-base font-semibold">Research Timeline</Label>
          <p className="text-sm text-muted-foreground">Key milestones and duration.</p>
          <Textarea
            value={formData.timeline}
            onChange={e => set('timeline', e.target.value)}
            placeholder="e.g. Month 1-2: Literature review | Month 3-4: Data collection | Month 5-6: Analysis and writing"
            rows={4}
            className="resize-none"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 text-destructive text-sm p-3 bg-destructive/10 rounded-lg border border-destructive/20">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <Button onClick={handleSubmit} disabled={loading} className="w-full gap-2" size="lg">
          {loading ? (
            <><div className="w-4 h-4 rounded-full animate-spin border-2 border-white border-t-transparent" /> Submitting...</>
          ) : (
            <><Send className="w-4 h-4" /> Submit Application</>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          By submitting you confirm this application is your own work and all information is accurate.
        </p>
      </div>
    </div>
  )
}
