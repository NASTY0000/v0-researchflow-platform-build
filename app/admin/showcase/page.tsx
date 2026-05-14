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
import { ShowcaseReviewActions } from '@/components/admin/showcase-review-actions'
import type { Profile, ShowcaseEntry } from '@/lib/types/database'

type Row = ShowcaseEntry & { author?: Profile }

export default async function AdminShowcasePage() {
  const gate = await assertAdmin()
  if (!gate.ok) redirect('/dashboard')

  const admin = createServiceRoleClient()
  const { data } = await admin
    .from('showcase_entries')
    .select(`
        *,
        author:profiles!author_id(*)
      `)
    .eq('status', 'submitted')
    .order('created_at', { ascending: false })

  const rows = (data || []) as Row[]

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold font-heading">Showcase review</h1>
        <p className="text-sm text-muted-foreground mt-1">Entries awaiting publication</p>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Area</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium max-w-[240px] truncate">{r.title}</TableCell>
                <TableCell className="text-sm">{r.author?.full_name || '—'}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{r.research_area}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleString()}
                </TableCell>
                <TableCell className="space-x-2">
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/research-showcase`}>Open showcase</Link>
                  </Button>
                  <ShowcaseReviewActions entryId={r.id} />
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground text-sm py-8">
                  No submissions pending review.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
