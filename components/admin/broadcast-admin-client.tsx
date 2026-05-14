'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { University, UserRole } from '@/lib/types/database'
import { countBroadcastRecipients, sendBroadcast } from '@/lib/actions/admin'

const ROLE_OPTIONS: UserRole[] = [
  'student_researcher',
  'collaborator',
  'technical_expert',
  'mentor',
  'admin',
]

export function BroadcastAdminClient({ universities }: { universities: University[] }) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [audience, setAudience] = useState<'all' | 'university' | 'role'>('all')
  const [uniId, setUniId] = useState<string>('')
  const [role, setRole] = useState<UserRole>('student_researcher')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [previewCount, setPreviewCount] = useState(0)
  const [busy, setBusy] = useState(false)

  async function openConfirm() {
    if (!title.trim() || !message.trim()) return
    const filter =
      audience === 'university' ? uniId || null : audience === 'role' ? role : null
    const res = await countBroadcastRecipients(audience, filter)
    if (res.error) {
      alert(res.error)
      return
    }
    setPreviewCount(res.count)
    setConfirmOpen(true)
  }

  async function confirmSend() {
    setBusy(true)
    const audienceFilter =
      audience === 'university' ? uniId || null : audience === 'role' ? role : null
    const res = await sendBroadcast({
      title: title.trim(),
      message: message.trim(),
      audience,
      audienceFilter,
    })
    setBusy(false)
    if (res.error) {
      alert(res.error)
      return
    }
    setConfirmOpen(false)
    setTitle('')
    setMessage('')
    router.refresh()
  }

  return (
    <div className="rounded-lg border border-border/60 p-4 space-y-4 bg-card/30">
      <h2 className="font-semibold">New broadcast</h2>
      <div className="space-y-2">
        <Label>Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Message</Label>
        <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} />
      </div>
      <div className="space-y-2">
        <Label>Target audience</Label>
        <RadioGroup value={audience} onValueChange={(v) => setAudience(v as typeof audience)}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="all" id="a-all" />
            <Label htmlFor="a-all">All users</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="university" id="a-uni" />
            <Label htmlFor="a-uni">Specific university</Label>
          </div>
          {audience === 'university' && (
            <Select value={uniId} onValueChange={setUniId}>
              <SelectTrigger className="max-w-md">
                <SelectValue placeholder="Select university" />
              </SelectTrigger>
              <SelectContent>
                {universities.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="role" id="a-role" />
            <Label htmlFor="a-role">Specific role</Label>
          </div>
          {audience === 'role' && (
            <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
              <SelectTrigger className="max-w-md">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </RadioGroup>
      </div>
      <Button onClick={openConfirm} disabled={busy}>
        Send
      </Button>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm broadcast</DialogTitle>
          </DialogHeader>
          <p className="text-sm">
            This will send to <strong>{previewCount}</strong> users. Are you sure?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmSend} disabled={busy}>
              Yes, send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
