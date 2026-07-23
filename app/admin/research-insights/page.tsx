import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/admin'
import { PhaseChartsClient } from './PhaseChartsClient'
import { AlertTriangle, BookOpen } from 'lucide-react'
import { format } from 'date-fns'

interface PhaseRow {
  phase_number: number
  phase_name: string
  completed_count: number
  in_progress_count: number
  with_evidence: number
  avg_summary_length: number | null
}

interface AnalyticsResult {
  by_phase: PhaseRow[]
  total_completions: number
  total_with_evidence: number
}

interface KeywordRow {
  word: string
  freq: number
}

interface Submission {
  id: string
  phase_number: number
  phase_name: string
  completed_at: string | null
  completion_answers: Record<string, string> | null
  completion_summary: string | null
  project: { title: string } | null
}

export default async function ResearchInsightsPage() {
  const supabase = await createClient()
  const admin = createServiceRoleClient()

  // Aggregate analytics via RPC (SECURITY DEFINER)
  const { data: analyticsRaw } = await supabase
    .rpc('get_phase_analytics')

  const { data: keywordsRaw } = await supabase
    .rpc('get_challenge_keywords')

  const analytics = analyticsRaw as AnalyticsResult | null
  const keywords  = (keywordsRaw as KeywordRow[] | null) ?? []

  // Individual submissions via service role — bypasses RLS; admin only
  const { data: submissionsRaw } = await admin
    .from('project_phases')
    .select('id, phase_number, phase_name, completed_at, completion_answers, completion_summary, project:projects(title)')
    .not('completion_answers', 'is', null)
    .order('completed_at', { ascending: false })
    .limit(200)

  const submissions = (submissionsRaw ?? []) as unknown as Submission[]

  const byPhase    = analytics?.by_phase           ?? []
  const totalCompletions   = analytics?.total_completions   ?? 0
  const totalWithEvidence  = analytics?.total_with_evidence ?? 0

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold font-heading">Research Insights</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Aggregated phase completion patterns and submission analytics
        </p>
      </div>

      {/* Aggregate charts */}
      <PhaseChartsClient
        byPhase={byPhase}
        totalCompletions={totalCompletions}
        totalWithEvidence={totalWithEvidence}
        keywords={keywords}
      />

      {/* Individual submissions — admin-only, server-rendered */}
      <section className="space-y-4">
        {/* Confidentiality notice */}
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/8 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-300">Individual research submissions</p>
            <p className="text-xs text-amber-400/80 mt-0.5">
              Treat as confidential — this is unpublished student work. Do not share, quote, or reference outside of platform review.
            </p>
          </div>
        </div>

        <div className="space-y-1">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            Submissions ({submissions.length})
          </h2>
          <p className="text-xs text-muted-foreground">Most recent first · maximum 200 shown</p>
        </div>

        {submissions.length === 0 ? (
          <div className="rounded-xl border border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
            No submissions yet. They will appear here once teams start completing phases with evidence.
          </div>
        ) : (
          <div className="space-y-3">
            {submissions.map(sub => {
              const answers = sub.completion_answers ?? {}
              const entries = Object.entries(answers).filter(([, v]) => v?.trim())
              return (
                <div
                  key={sub.id}
                  className="rounded-xl border border-border bg-card p-4 space-y-3"
                >
                  {/* Submission header */}
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-semibold text-foreground">
                      {sub.project?.title ?? 'Untitled project'}
                    </span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground">
                      Phase {sub.phase_number}: {sub.phase_name}
                    </span>
                    {sub.completed_at && (
                      <>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(sub.completed_at), 'dd MMM yyyy')}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Answers */}
                  {entries.length > 0 ? (
                    <dl className="space-y-2.5">
                      {entries.map(([key, val]) => (
                        <div key={key} className="space-y-0.5">
                          <dt className="text-xs font-medium text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</dt>
                          <dd className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{val}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No answers recorded</p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
