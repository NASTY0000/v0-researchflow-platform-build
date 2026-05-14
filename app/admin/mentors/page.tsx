import Link from 'next/link'
import { redirect } from 'next/navigation'
import { assertAdmin, createServiceRoleClient } from '@/lib/supabase/admin'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { MentorProfile, Profile, University } from '@/lib/types/database'

type MentorRow = MentorProfile & {
  profile?: Profile & { university?: University }
}

export default async function AdminMentorsPage({
  searchParams,
}: {
  searchParams: { tab?: string; tier?: string }
}) {
  const gate = await assertAdmin()
  if (!gate.ok) redirect('/dashboard')

  const admin = createServiceRoleClient()
  const tab = searchParams.tab === 'approved' ? 'approved' : 'pending'

  let rows: MentorRow[] = []

  if (tab === 'pending') {
    const { data } = await admin
      .from('mentor_profiles')
      .select(
        `
        *,
        profile:profiles!mentor_profiles_user_id_fkey(
          *,
          university:universities(*)
        )
      `,
      )
      .eq('verification_status', 'pending')
      .order('verification_submitted_at', { ascending: false, nullsFirst: false })
    rows = (data || []) as MentorRow[]
  } else {
    let q = admin
      .from('mentor_profiles')
      .select(
        `
        *,
        profile:profiles!mentor_profiles_user_id_fkey(
          *,
          university:universities(*)
        )
      `,
      )
      .eq('is_verified', true)
      .order('updated_at', { ascending: false })
    if (searchParams.tier && ['1', '2', '3'].includes(searchParams.tier)) {
      q = q.eq('tier', parseInt(searchParams.tier, 10) as 1 | 2 | 3)
    }
    const { data } = await q
    rows = (data || []) as MentorRow[]
  }

  const tierLabel = (t: number) => {
    if (t === 1) return 'Faculty'
    if (t === 2) return 'Postgraduate'
    if (t === 3) return 'Industry'
    return `Tier ${t}`
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold font-heading">Mentor verification</h1>
        <p className="text-sm text-muted-foreground mt-1">Review applications and manage verified mentors</p>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <Button variant={tab === 'pending' ? 'default' : 'outline'} size="sm" asChild>
          <Link href="/admin/mentors?tab=pending">Pending verifications</Link>
        </Button>
        <Button variant={tab === 'approved' ? 'default' : 'outline'} size="sm" asChild>
          <Link href="/admin/mentors?tab=approved">Approved mentors</Link>
        </Button>
        {tab === 'approved' && (
          <div className="flex gap-2 ml-auto text-sm items-center">
            <span className="text-muted-foreground">Tier:</span>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/mentors?tab=approved">All</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/mentors?tab=approved&tier=1">1</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/mentors?tab=approved&tier=2">2</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/mentors?tab=approved&tier=3">3</Link>
            </Button>
          </div>
        )}
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>University</TableHead>
              {tab === 'pending' ? (
                <TableHead>Submitted</TableHead>
              ) : (
                <TableHead>Email</TableHead>
              )}
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((m) => (
              <TableRow key={m.id}>
                <TableCell>{m.profile?.full_name || '—'}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{tierLabel(m.tier)}</Badge>
                </TableCell>
                <TableCell className="text-sm">{m.profile?.university?.name || '—'}</TableCell>
                {tab === 'pending' ? (
                  <TableCell className="text-xs text-muted-foreground">
                    {m.verification_submitted_at
                      ? new Date(m.verification_submitted_at).toLocaleString()
                      : '—'}
                  </TableCell>
                ) : (
                  <TableCell className="text-sm text-muted-foreground">
                    {m.institutional_email || m.profile?.email}
                  </TableCell>
                )}
                <TableCell>
                  <Button size="sm" asChild>
                    <Link href={`/admin/mentors/${m.id}`}>View documents</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground text-sm py-8">
                  No mentors in this list.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
