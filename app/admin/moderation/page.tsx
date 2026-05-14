import { redirect } from 'next/navigation'
import { assertAdmin, createServiceRoleClient } from '@/lib/supabase/admin'
import { ModerationRowActions } from '@/components/admin/moderation-row-actions'
import type { ContentReport, Profile } from '@/lib/types/database'

type ReportRow = ContentReport & { reporter?: Profile }

async function resolveTargetUserId(
  admin: ReturnType<typeof createServiceRoleClient>,
  r: ContentReport,
): Promise<string | null> {
  if (r.content_type === 'idea') {
    const { data } = await admin.from('research_ideas').select('author_id').eq('id', r.content_id).maybeSingle()
    return data?.author_id || null
  }
  if (r.content_type === 'task') {
    const { data } = await admin
      .from('tasks')
      .select('assignee_id, assigned_to')
      .eq('id', r.content_id)
      .maybeSingle()
    const row = data as { assignee_id?: string | null; assigned_to?: string | null } | null
    return row?.assignee_id || row?.assigned_to || null
  }
  if (r.content_type === 'message') {
    const { data } = await admin.from('messages').select('sender_id').eq('id', r.content_id).maybeSingle()
    return data?.sender_id || null
  }
  return null
}

async function previewContent(
  admin: ReturnType<typeof createServiceRoleClient>,
  r: ContentReport,
): Promise<string> {
  if (r.content_type === 'idea') {
    const { data } = await admin.from('research_ideas').select('title,description').eq('id', r.content_id).maybeSingle()
    if (!data) return '[Removed or missing]'
    return `${data.title}: ${(data.description || '').slice(0, 160)}…`
  }
  if (r.content_type === 'task') {
    const { data } = await admin.from('tasks').select('title').eq('id', r.content_id).maybeSingle()
    return data?.title || '[Task]'
  }
  if (r.content_type === 'message') {
    const { data } = await admin.from('messages').select('content').eq('id', r.content_id).maybeSingle()
    return (data?.content || '').slice(0, 200) || '[Message]'
  }
  return ''
}

export default async function AdminModerationPage() {
  const gate = await assertAdmin()
  if (!gate.ok) redirect('/dashboard')

  const admin = createServiceRoleClient()
  const { data } = await admin
    .from('content_reports')
    .select('*, reporter:profiles(*)')
    .eq('status', 'open')
    .order('created_at', { ascending: false })

  const reports = (data || []) as ReportRow[]
  const enriched = await Promise.all(
    reports.map(async (r) => ({
      report: r,
      preview: await previewContent(admin, r),
      targetUserId: await resolveTargetUserId(admin, r),
    })),
  )

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold font-heading">Moderation</h1>
        <p className="text-sm text-muted-foreground mt-1">Reported content queue</p>
      </div>

      <div className="space-y-4">
        {enriched.length === 0 && (
          <p className="text-sm text-muted-foreground">No open reports.</p>
        )}
        {enriched.map(({ report, preview, targetUserId }) => (
          <div
            key={report.id}
            className="rounded-lg border border-border/60 p-4 space-y-2 bg-card/30"
          >
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs uppercase text-muted-foreground">{report.content_type}</span>
              <span className="text-xs text-muted-foreground">
                {new Date(report.created_at).toLocaleString()}
              </span>
            </div>
            <p className="text-sm">{preview}</p>
            <p className="text-xs text-muted-foreground">
              Reporter: {report.reporter?.full_name || report.reporter_id} — {report.reason}
            </p>
            <ModerationRowActions
              reportId={report.id}
              contentType={report.content_type}
              contentId={report.content_id}
              targetUserId={targetUserId}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
