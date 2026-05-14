'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { setShowcaseStatus } from '@/lib/actions/admin'

export function ShowcaseReviewActions({ entryId }: { entryId: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function publish() {
    setBusy(true)
    const res = await setShowcaseStatus(entryId, 'published')
    setBusy(false)
    if (res.error) alert(res.error)
    else router.refresh()
  }

  async function feature() {
    setBusy(true)
    const res = await setShowcaseStatus(entryId, 'featured')
    setBusy(false)
    if (res.error) alert(res.error)
    else router.refresh()
  }

  async function reject() {
    if (!confirm('Archive this submission?')) return
    setBusy(true)
    const res = await setShowcaseStatus(entryId, 'archived')
    setBusy(false)
    if (res.error) alert(res.error)
    else router.refresh()
  }

  return (
    <span className="inline-flex gap-2">
      <Button size="sm" disabled={busy} onClick={publish}>
        Publish
      </Button>
      <Button size="sm" variant="secondary" disabled={busy} onClick={feature}>
        Feature
      </Button>
      <Button size="sm" variant="outline" disabled={busy} onClick={reject}>
        Archive
      </Button>
    </span>
  )
}
