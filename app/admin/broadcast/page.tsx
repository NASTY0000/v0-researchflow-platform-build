'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Megaphone, Send, Users, Globe, GraduationCap, Clock } from 'lucide-react'
import type { Broadcast } from '@/lib/types/database'

type Audience = 'all' | 'university' | 'role'

const ROLE_OPTIONS = [
  { value: 'student_researcher', label: 'Student Researchers' },
  { value: 'collaborator', label: 'Collaborators' },
  { value: 'technical_expert', label: 'Technical Experts' },
  { value: 'mentor', label: 'Mentors' },
]

export default function AdminBroadcastPage() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [form, setForm] = useState({
    title: '',
    message: '',
    audience: 'all' as Audience,
    audience_filter: '',
  })

  const supabase = createClient()

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/admin/broadcasts')
      if (res.ok) {
        const data = await res.json()
        setBroadcasts(data as Broadcast[])
      }
    } catch {
      // silent
    }
    setIsLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function sendBroadcast() {
    if (!form.title.trim() || !form.message.trim()) return
    setIsSending(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setIsSending(false); return }

    // Count recipients
    let recipientQuery = supabase.from('profiles').select('id', { count: 'exact', head: true })
    if (form.audience === 'university' && form.audience_filter) {
      recipientQuery = recipientQuery.eq('university_id', form.audience_filter)
    } else if (form.audience === 'role' && form.audience_filter) {
      recipientQuery = recipientQuery.contains('roles', [form.audience_filter])
    }
    const { count } = await recipientQuery
    const recipientCount = count || 0

    // Fetch recipient IDs for notification insert
    let idsQuery = supabase.from('profiles').select('id')
    if (form.audience === 'university' && form.audience_filter) {
      idsQuery = idsQuery.eq('university_id', form.audience_filter)
    } else if (form.audience === 'role' && form.audience_filter) {
      idsQuery = idsQuery.contains('roles', [form.audience_filter])
    }
    const { data: recipientData } = await idsQuery

    // Insert broadcast record
    const { data: broadcastData } = await supabase
      .from('broadcasts')
      .insert({
        sent_by: user.id,
        title: form.title.trim(),
        message: form.message.trim(),
        audience: form.audience,
        audience_filter: form.audience_filter.trim() || null,
        recipient_count: recipientCount,
        sent_at: new Date().toISOString(),
      })
      .select('*, sender:profiles!sent_by(id,full_name,email)')
      .single()

    // Insert notifications for all recipients (batched)
    if (recipientData && recipientData.length > 0) {
      const notifications = recipientData.map((r: { id: string }) => ({
        user_id: r.id,
        type: 'system',
        title: form.title.trim(),
        message: form.message.trim(),
        link: null,
      }))
      // Insert in chunks of 100
      for (let i = 0; i < notifications.length; i += 100) {
        await supabase.from('notifications').insert(notifications.slice(i, i + 100))
      }
    }

    if (broadcastData) setBroadcasts(prev => [broadcastData as Broadcast, ...prev])
    setForm({ title: '', message: '', audience: 'all', audience_filter: '' })
    setIsSending(false)
  }

  const getAudienceIcon = (audience: string) => {
    switch (audience) {
      case 'all': return <Globe className="w-3.5 h-3.5" />
      case 'university': return <GraduationCap className="w-3.5 h-3.5" />
      case 'role': return <Users className="w-3.5 h-3.5" />
      default: return <Globe className="w-3.5 h-3.5" />
    }
  }

  function timeAgo(date: string) {
    const diff = Date.now() - new Date(date).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    const d = Math.floor(h / 24)
    if (d < 30) return `${d}d ago`
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Broadcast</h1>
        <p className="text-muted-foreground text-sm mt-1">Send announcements and notifications to platform users</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Compose */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-primary" />Compose Broadcast
            </CardTitle>
            <CardDescription>Send a notification to all or selected users</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Title <span className="text-destructive">*</span></Label>
              <Input
                className="mt-1"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g., Platform Maintenance Scheduled"
                maxLength={100}
              />
            </div>
            <div>
              <Label>Message <span className="text-destructive">*</span></Label>
              <Textarea
                className="mt-1"
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                placeholder="Write your announcement..."
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1 text-right">{form.message.length}/500</p>
            </div>
            <div>
              <Label>Audience</Label>
              <Select value={form.audience} onValueChange={v => setForm(f => ({ ...f, audience: v as Audience, audience_filter: '' }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="university">By University</SelectItem>
                  <SelectItem value="role">By Role</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.audience === 'university' && (
              <div>
                <Label>University ID</Label>
                <Input
                  className="mt-1"
                  value={form.audience_filter}
                  onChange={e => setForm(f => ({ ...f, audience_filter: e.target.value }))}
                  placeholder="University UUID"
                />
              </div>
            )}

            {form.audience === 'role' && (
              <div>
                <Label>Role</Label>
                <Select value={form.audience_filter} onValueChange={v => setForm(f => ({ ...f, audience_filter: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select role" /></SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map(r => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button
              className="w-full"
              onClick={sendBroadcast}
              disabled={!form.title.trim() || !form.message.trim() || isSending ||
                ((form.audience === 'university' || form.audience === 'role') && !form.audience_filter)}
            >
              <Send className="w-4 h-4 mr-2" />
              {isSending ? 'Sending...' : 'Send Broadcast'}
            </Button>
          </CardContent>
        </Card>

        {/* History */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold">Broadcast History</h2>
          {isLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />)}
            </div>
          ) : broadcasts.length === 0 ? (
            <Card className="p-8 text-center">
              <Megaphone className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No broadcasts sent yet</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {broadcasts.map(b => (
                <Card key={b.id}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-sm">{b.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{b.message}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs shrink-0 flex items-center gap-1">
                        {getAudienceIcon(b.audience)}
                        {b.audience === 'all' ? 'All' : b.audience === 'university' ? 'University' : 'Role'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />{timeAgo(b.sent_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />{b.recipient_count.toLocaleString()} recipients
                      </span>
                      {b.sender && <span>by {b.sender.full_name || b.sender.email}</span>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
