'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Plus, Pencil, Trash2, Star, Eye, EyeOff, ExternalLink } from 'lucide-react'
import { format, isPast } from 'date-fns'
import { ListPageSkeleton } from '@/components/ui/skeleton-screens'

interface Grant {
  id: string
  title: string
  funder: string
  description: string | null
  amount_min: number | null
  amount_max: number | null
  currency: string
  deadline: string | null
  eligibility: string[] | null
  research_areas: string[] | null
  countries: string[] | null
  grant_type: string | null
  apply_url: string | null
  is_active: boolean
  is_featured: boolean
  created_at: string
}

const EMPTY_FORM = {
  title: '',
  funder: '',
  description: '',
  amount_min: '',
  amount_max: '',
  currency: 'USD',
  deadline: '',
  eligibility: '',
  research_areas: '',
  countries: '',
  grant_type: 'research',
  apply_url: '',
  is_active: true,
  is_featured: false,
}

export default function AdminGrantsPage() {
  const [grants, setGrants] = useState<Grant[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => { loadGrants() }, [])

  async function loadGrants() {
    const { data } = await supabase
      .from('grants')
      .select('*')
      .order('created_at', { ascending: false })
    setGrants(data || [])
    setLoading(false)
  }

  function openNew() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  function openEdit(grant: Grant) {
    setEditingId(grant.id)
    setForm({
      title: grant.title,
      funder: grant.funder,
      description: grant.description || '',
      amount_min: grant.amount_min?.toString() || '',
      amount_max: grant.amount_max?.toString() || '',
      currency: grant.currency,
      deadline: grant.deadline ? grant.deadline.slice(0, 10) : '',
      eligibility: grant.eligibility?.join('\n') || '',
      research_areas: grant.research_areas?.join('\n') || '',
      countries: grant.countries?.join('\n') || '',
      grant_type: grant.grant_type || 'research',
      apply_url: grant.apply_url || '',
      is_active: grant.is_active,
      is_featured: grant.is_featured,
    })
    setDialogOpen(true)
  }

  async function saveGrant() {
    setSaving(true)
    const payload = {
      title: form.title,
      funder: form.funder,
      description: form.description || null,
      amount_min: form.amount_min ? parseInt(form.amount_min) : null,
      amount_max: form.amount_max ? parseInt(form.amount_max) : null,
      currency: form.currency,
      deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
      eligibility: form.eligibility ? form.eligibility.split('\n').filter(Boolean) : [],
      research_areas: form.research_areas ? form.research_areas.split('\n').filter(Boolean) : [],
      countries: form.countries ? form.countries.split('\n').filter(Boolean) : [],
      grant_type: form.grant_type,
      apply_url: form.apply_url || null,
      is_active: form.is_active,
      is_featured: form.is_featured,
      updated_at: new Date().toISOString(),
    }

    if (editingId) {
      await supabase.from('grants').update(payload).eq('id', editingId)
    } else {
      await supabase.from('grants').insert(payload)
    }

    setSaving(false)
    setDialogOpen(false)
    loadGrants()
  }

  async function deleteGrant(id: string) {
    if (!confirm('Delete this grant?')) return
    await supabase.from('grants').delete().eq('id', id)
    setGrants(prev => prev.filter(g => g.id !== id))
  }

  async function toggleField(id: string, field: 'is_active' | 'is_featured', value: boolean) {
    await supabase.from('grants').update({ [field]: value }).eq('id', id)
    setGrants(prev => prev.map(g => g.id === id ? { ...g, [field]: value } : g))
  }

  const f = (key: keyof typeof EMPTY_FORM, val: string | boolean) =>
    setForm(prev => ({ ...prev, [key]: val }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Grants Management</h1>
          <p className="text-muted-foreground text-sm mt-1">{grants.length} grants total</p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="w-4 h-4" /> Add Grant
        </Button>
      </div>

      {loading ? (
        <ListPageSkeleton type="card" count={4} />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 font-medium text-muted-foreground">Title / Funder</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Type</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Deadline</th>
                    <th className="text-center p-4 font-medium text-muted-foreground">Featured</th>
                    <th className="text-center p-4 font-medium text-muted-foreground">Active</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {grants.map(grant => {
                    const expired = grant.deadline ? isPast(new Date(grant.deadline)) : false
                    return (
                      <tr key={grant.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                        <td className="p-4">
                          <p className="font-medium truncate max-w-[260px]">{grant.title}</p>
                          <p className="text-xs text-muted-foreground">{grant.funder}</p>
                        </td>
                        <td className="p-4">
                          <Badge variant="outline" className="text-xs capitalize">
                            {grant.grant_type}
                          </Badge>
                        </td>
                        <td className="p-4">
                          {grant.deadline ? (
                            <span className={expired ? 'text-muted-foreground line-through' : ''}>
                              {format(new Date(grant.deadline), 'MMM d, yyyy')}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => toggleField(grant.id, 'is_featured', !grant.is_featured)}
                            className={grant.is_featured ? 'text-yellow-500' : 'text-muted-foreground'}
                            title={grant.is_featured ? 'Remove featured' : 'Set featured'}
                          >
                            <Star className="w-4 h-4 mx-auto" fill={grant.is_featured ? 'currentColor' : 'none'} />
                          </button>
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => toggleField(grant.id, 'is_active', !grant.is_active)}
                            className={grant.is_active ? 'text-green-500' : 'text-muted-foreground'}
                            title={grant.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {grant.is_active
                              ? <Eye className="w-4 h-4 mx-auto" />
                              : <EyeOff className="w-4 h-4 mx-auto" />}
                          </button>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2">
                            {grant.apply_url && (
                              <a href={grant.apply_url} target="_blank" rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-foreground">
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                            <Button size="sm" variant="ghost" onClick={() => openEdit(grant)}>
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => deleteGrant(grant.id)}
                              className="text-destructive hover:text-destructive">
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {grants.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        No grants yet. Add the first one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Grant' : 'Add Grant'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label>Title *</Label>
                <Input value={form.title} onChange={e => f('title', e.target.value)} placeholder="Grant title" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Funder *</Label>
                <Input value={form.funder} onChange={e => f('funder', e.target.value)} placeholder="Organization name" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={e => f('description', e.target.value)} rows={3} />
              </div>
              <div className="space-y-1.5">
                <Label>Amount Min</Label>
                <Input type="number" value={form.amount_min} onChange={e => f('amount_min', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Amount Max</Label>
                <Input type="number" value={form.amount_max} onChange={e => f('amount_max', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Currency</Label>
                <Select value={form.currency} onValueChange={v => f('currency', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="NGN">NGN (₦)</SelectItem>
                    <SelectItem value="ZAR">ZAR (R)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Grant Type</Label>
                <Select value={form.grant_type} onValueChange={v => f('grant_type', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="research">Research</SelectItem>
                    <SelectItem value="fellowship">Fellowship</SelectItem>
                    <SelectItem value="scholarship">Scholarship</SelectItem>
                    <SelectItem value="travel">Travel</SelectItem>
                    <SelectItem value="equipment">Equipment</SelectItem>
                    <SelectItem value="conference">Conference</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Deadline</Label>
                <Input type="date" value={form.deadline} onChange={e => f('deadline', e.target.value)} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Apply URL</Label>
                <Input value={form.apply_url} onChange={e => f('apply_url', e.target.value)} placeholder="https://..." />
              </div>
              <div className="space-y-1.5">
                <Label>Research Areas (one per line)</Label>
                <Textarea value={form.research_areas} onChange={e => f('research_areas', e.target.value)} rows={3} placeholder="Computer Science&#10;Data Science" />
              </div>
              <div className="space-y-1.5">
                <Label>Countries (one per line)</Label>
                <Textarea value={form.countries} onChange={e => f('countries', e.target.value)} rows={3} placeholder="Nigeria&#10;Kenya&#10;All African countries" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Eligibility (one per line)</Label>
                <Textarea value={form.eligibility} onChange={e => f('eligibility', e.target.value)} rows={3} placeholder="PhD students&#10;African institution required" />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_active} onChange={e => f('is_active', e.target.checked)}
                    className="rounded" />
                  <span className="text-sm">Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_featured} onChange={e => f('is_featured', e.target.checked)}
                    className="rounded" />
                  <span className="text-sm">Featured</span>
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveGrant} disabled={saving || !form.title || !form.funder}>
              {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Add Grant'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
