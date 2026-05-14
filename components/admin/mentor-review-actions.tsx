'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { mentorApprove, mentorReject, mentorRevoke } from '@/lib/actions/admin'

export function MentorReviewActions({ mentorProfileId }: { mentorProfileId: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [reason, setReason] = useState('')

  async function approve() {
    setBusy(true)
    const res = await mentorApprove(mentorProfileId)
    setBusy(false)
    if (res.error) {
      alert(res.error)
      return
    }
    router.push('/admin/mentors?tab=approved')
    router.refresh()
  }

  async function reject() {
    if (!reason.trim()) return
    setBusy(true)
    const res = await mentorReject(mentorProfileId, reason.trim())
    setBusy(false)
    if (res.error) {
      alert(res.error)
      return
    }
    setRejectOpen(false)
    setReason('')
    router.push('/admin/mentors?tab=pending')
    router.refresh()
  }

  async function revoke() {
    if (!confirm('Revoke verification for this mentor?')) return
    setBusy(true)
    const res = await mentorRevoke(mentorProfileId)
    setBusy(false)
    if (res.error) {
      alert(res.error)
      return
    }
    router.refresh()
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Button onClick={approve} disabled={busy}>
        Approve
      </Button>
      <Button variant="destructive" disabled={busy} onClick={() => setRejectOpen(true)}>
        Reject
      </Button>
      <Button variant="outline" disabled={busy} onClick={revoke}>
        Revoke verification
      </Button>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject application</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Reason (required)</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={!reason.trim() || busy} onClick={reject}>
              Send rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
