'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  updateReportStatus,
  removeReportedContent,
  warnReportedUser,
  suspendUser,
} from '@/lib/actions/admin'

export function ModerationRowActions({
  reportId,
  contentType,
  contentId,
  targetUserId,
}: {
  reportId: string
  contentType: 'idea' | 'task' | 'message'
  contentId: string
  targetUserId: string | null
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function dismiss() {
    setBusy(true)
    const res = await updateReportStatus(reportId, 'dismissed')
    setBusy(false)
    if (res.error) alert(res.error)
    else router.refresh()
  }

  async function remove() {
    if (!confirm('Remove this content?')) return
    setBusy(true)
    const res = await removeReportedContent(contentType, contentId)
    if (res.error) {
      setBusy(false)
      alert(res.error)
      return
    }
    await updateReportStatus(reportId, 'actioned')
    setBusy(false)
    router.refresh()
  }

  async function warn() {
    if (!targetUserId) {
      alert('Could not resolve user for this content.')
      return
    }
    const msg = prompt('Warning message to send:')
    if (!msg?.trim()) return
    setBusy(true)
    const res = await warnReportedUser(targetUserId, msg.trim())
    if (res.error) {
      setBusy(false)
      alert(res.error)
      return
    }
    await updateReportStatus(reportId, 'actioned')
    setBusy(false)
    router.refresh()
  }

  async function suspend() {
    if (!targetUserId) {
      alert('Could not resolve user for this content.')
      return
    }
    const reason = prompt('Suspension reason (required):')
    if (!reason?.trim()) return
    if (!confirm('Suspend this user?')) return
    setBusy(true)
    const res = await suspendUser({
      userId: targetUserId,
      reason: reason.trim(),
      days: null,
    })
    if (res.error) {
      setBusy(false)
      alert(res.error)
      return
    }
    await updateReportStatus(reportId, 'actioned')
    setBusy(false)
    router.refresh()
  }

  return (
    <div className="flex flex-wrap gap-2 pt-2">
      <Button size="sm" variant="outline" disabled={busy} onClick={dismiss}>
        Dismiss report
      </Button>
      <Button size="sm" variant="destructive" disabled={busy} onClick={remove}>
        Remove content
      </Button>
      <Button size="sm" variant="secondary" disabled={busy} onClick={warn}>
        Warn user
      </Button>
      <Button size="sm" variant="destructive" disabled={busy} onClick={suspend}>
        Suspend user
      </Button>
    </div>
  )
}
