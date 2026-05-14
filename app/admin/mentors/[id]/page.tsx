import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { assertAdmin, createServiceRoleClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MentorReviewActions } from '@/components/admin/mentor-review-actions'
import type { MentorProfile, Profile, University } from '@/lib/types/database'

type MentorRow = MentorProfile & {
  profile?: Profile & { university?: University }
}

export default async function AdminMentorReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const gate = await assertAdmin()
  if (!gate.ok) redirect('/dashboard')

  const { id } = await params
  const admin = createServiceRoleClient()

  const { data: mentor, error } = await admin
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
    .eq('id', id)
    .maybeSingle()

  if (error || !mentor) notFound()

  const m = mentor as MentorRow

  async function signPath(path: string | null | undefined) {
    if (!path) return null
    const { data, error: sErr } = await admin.storage
      .from('mentor-verification')
      .createSignedUrl(path, 3600)
    if (sErr) return null
    return data?.signedUrl || null
  }

  const staffUrl = await signPath(m.staff_id_document_url)
  const letterUrl = await signPath(m.supervisor_letter_url)

  const tierLabel = m.tier === 1 ? 'Faculty' : m.tier === 2 ? 'Postgraduate' : 'Industry'

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/admin/mentors" className="text-sm text-violet-400 hover:underline">
          Back to mentors
        </Link>
      </div>
      <div>
        <h1 className="text-2xl font-bold font-heading">Review mentor</h1>
        <p className="text-muted-foreground text-sm mt-1">{m.profile?.full_name}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Application</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex flex-wrap gap-2">
            <Badge>Tier {m.tier}</Badge>
            <Badge variant="secondary">{tierLabel}</Badge>
            <Badge variant="outline">{m.verification_status}</Badge>
          </div>
          <p>
            <span className="text-muted-foreground">Institutional email:</span>{' '}
            {m.institutional_email || '—'}
          </p>
          <p>
            <span className="text-muted-foreground">University:</span>{' '}
            {m.profile?.university?.name || '—'}
          </p>
          {m.verification_rejection_reason && (
            <p className="text-destructive">
              <span className="font-medium">Last rejection:</span> {m.verification_rejection_reason}
            </p>
          )}
        </CardContent>
      </Card>

      {staffUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Staff / professional document</CardTitle>
          </CardHeader>
          <CardContent>
            <iframe title="Staff document" src={staffUrl} className="w-full h-[480px] rounded-md border" />
          </CardContent>
        </Card>
      )}

      {letterUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Supervisor letter</CardTitle>
          </CardHeader>
          <CardContent>
            <iframe title="Supervisor letter" src={letterUrl} className="w-full h-[480px] rounded-md border" />
          </CardContent>
        </Card>
      )}

      {!staffUrl && !letterUrl && (
        <p className="text-sm text-muted-foreground">No documents on file for this application.</p>
      )}

      <MentorReviewActions mentorProfileId={m.id} />
    </div>
  )
}
