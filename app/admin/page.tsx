import { redirect } from 'next/navigation'
import Link from 'next/link'
import { assertAdmin, createServiceRoleClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { PlatformEvent } from '@/lib/types/database'

function startOfMonth() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString()
}

function thirtyDaysAgo() {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return d.toISOString()
}

function eventLabel(e: PlatformEvent) {
  switch (e.event_type) {
    case 'signup':
      return 'New signup'
    case 'idea_posted':
      return `Idea posted: ${(e.metadata as { title?: string })?.title || 'Untitled'}`
    case 'team_formed':
      return `Team formed: ${(e.metadata as { name?: string })?.name || 'Team'}`
    default:
      return e.event_type
  }
}

export default async function AdminOverviewPage() {
  const gate = await assertAdmin()
  if (!gate.ok) redirect('/dashboard')

  const admin = createServiceRoleClient()
  const monthStart = startOfMonth()
  const mauSince = thirtyDaysAgo()

  const [
    totalUsersRes,
    projectsMonthRes,
    teamsMonthRes,
    showcasePendingRes,
    mentorPendingRes,
    eventsRes,
  ] = await Promise.all([
    admin.from('profiles').select('id', { count: 'exact', head: true }),
    admin
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .gte('created_at', monthStart),
    admin.from('teams').select('id', { count: 'exact', head: true }).gte('created_at', monthStart),
    admin
      .from('showcase_entries')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'submitted'),
    admin
      .from('mentor_profiles')
      .select('id', { count: 'exact', head: true })
      .eq('verification_status', 'pending'),
    admin.from('platform_events').select('*').order('created_at', { ascending: false }).limit(20),
  ])

  const roleKeys = [
    'student_researcher',
    'collaborator',
    'technical_expert',
    'mentor',
    'admin',
  ] as const
  const roleCounts: Record<string, number> = {}
  for (const r of roleKeys) {
    const { count } = await admin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .contains('roles', [r])
    roleCounts[r] = count ?? 0
  }

  const { data: mauRows } = await admin
    .from('platform_events')
    .select('actor_id')
    .gte('created_at', mauSince)
    .not('actor_id', 'is', null)
  const mau = new Set((mauRows || []).map((row: { actor_id: string }) => row.actor_id)).size

  const events = (eventsRes.data || []) as PlatformEvent[]

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold font-heading text-foreground">Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">Platform health at a glance</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card className="border-violet-500/20 bg-card/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalUsersRes.count ?? 0}</p>
            <ul className="mt-3 text-xs text-muted-foreground space-y-1">
              {roleKeys.map((r) => (
                <li key={r} className="flex justify-between gap-2">
                  <span className="capitalize">{r.replace(/_/g, ' ')}</span>
                  <span>{roleCounts[r]}</span>
                </li>
              ))}
            </ul>
            <p className="text-[10px] text-muted-foreground mt-2">Users may have multiple roles.</p>
          </CardContent>
        </Card>

        <Card className="border-violet-500/20 bg-card/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active projects (created this month)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{projectsMonthRes.count ?? 0}</p>
          </CardContent>
        </Card>

        <Card className="border-violet-500/20 bg-card/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Teams formed this month</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{teamsMonthRes.count ?? 0}</p>
          </CardContent>
        </Card>

        <Card className="border-violet-500/20 bg-card/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Showcase pending review</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{showcasePendingRes.count ?? 0}</p>
            <Link href="/admin/showcase" className="text-xs text-violet-400 hover:underline mt-2 inline-block">
              Review queue
            </Link>
          </CardContent>
        </Card>

        <Card className="border-violet-500/20 bg-card/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Mentor verifications pending</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{mentorPendingRes.count ?? 0}</p>
            <Link href="/admin/mentors" className="text-xs text-violet-400 hover:underline mt-2 inline-block">
              Mentor queue
            </Link>
          </CardContent>
        </Card>

        <Card className="border-violet-500/20 bg-card/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly active users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{mau}</p>
            <p className="text-xs text-muted-foreground mt-1">Distinct users with platform activity (last 30 days)</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-violet-500/20 bg-card/40">
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
          <p className="text-sm text-muted-foreground">Last 20 platform events</p>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events yet. Events appear after migration triggers run.</p>
          ) : (
            <ul className="space-y-3">
              {events.map((e) => (
                <li
                  key={e.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-sm border-b border-border/40 pb-2 last:border-0"
                >
                  <span>{eventLabel(e)}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(e.created_at).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
