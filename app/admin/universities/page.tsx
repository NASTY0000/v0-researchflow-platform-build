'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Building2, Plus, Edit, Check, X, Power, PowerOff } from 'lucide-react'
import type { UniversityRecord } from '@/lib/types/database'

const emptyForm = { name: '', country: '', type: 'Federal' as 'Federal' | 'State' | 'Private', email_domain: '' }

export default function AdminUniversitiesPage() {
  const [universities, setUniversities] = useState<UniversityRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [editForm, setEditForm] = useState(emptyForm)
  const [isSaving, setIsSaving] = useState(false)
  const [search, setSearch] = useState('')

  const supabase = createClient()

  const load = useCallback(async () => {
    setIsLoading(true)
    const { data } = await supabase
      .from('universities')
      .select('*')
      .order('name', { ascending: true })
    if (data) setUniversities(data as UniversityRecord[])
    setIsLoading(false)
  }, [supabase])

  useEffect(() => { load() }, [load])

  async function addUniversity() {
    if (!form.name.trim() || !form.country.trim()) return
    setIsSaving(true)
    const { data } = await supabase
      .from('universities')
      .insert({
        name: form.name.trim(),
        country: form.country.trim(),
        type: form.type,
        email_domain: form.email_domain.trim() || null,
        is_active: true,
      })
      .select()
      .single()
    if (data) {
      setUniversities(prev => [...prev, data as UniversityRecord].sort((a, b) => a.name.localeCompare(b.name)))
      setForm(emptyForm)
      setShowAddForm(false)
    }
    setIsSaving(false)
  }

  async function saveEdit(id: string) {
    if (!editForm.name.trim() || !editForm.country.trim()) return
    setIsSaving(true)
    const { data } = await supabase
      .from('universities')
      .update({
        name: editForm.name.trim(),
        country: editForm.country.trim(),
        type: editForm.type,
        email_domain: editForm.email_domain.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()
    if (data) {
      setUniversities(prev => prev.map(u => u.id === id ? data as UniversityRecord : u))
      setEditingId(null)
    }
    setIsSaving(false)
  }

  async function toggleActive(university: UniversityRecord) {
    const { data } = await supabase
      .from('universities')
      .update({ is_active: !university.is_active, updated_at: new Date().toISOString() })
      .eq('id', university.id)
      .select()
      .single()
    if (data) {
      setUniversities(prev => prev.map(u => u.id === university.id ? data as UniversityRecord : u))
    }
  }

  function startEdit(u: UniversityRecord) {
    setEditingId(u.id)
    setEditForm({ name: u.name, country: u.country, type: u.type, email_domain: u.email_domain || '' })
  }

  const filtered = universities.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.country.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading">Universities</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage partner universities and institutions</p>
        </div>
        <Button onClick={() => { setShowAddForm(true); setForm(emptyForm) }}>
          <Plus className="w-4 h-4 mr-2" />Add University
        </Button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add University</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Name <span className="text-destructive">*</span></Label>
                <Input className="mt-1" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g., University of Lagos" />
              </div>
              <div>
                <Label>Country <span className="text-destructive">*</span></Label>
                <Input className="mt-1" value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} placeholder="e.g., Nigeria" />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as 'Federal' | 'State' | 'Private' }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Federal">Federal</SelectItem>
                    <SelectItem value="State">State</SelectItem>
                    <SelectItem value="Private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Email Domain <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input className="mt-1" value={form.email_domain} onChange={e => setForm(f => ({ ...f, email_domain: e.target.value }))} placeholder="e.g., unilag.edu.ng" />
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={addUniversity} disabled={!form.name.trim() || !form.country.trim() || isSaving}>
                <Check className="w-4 h-4 mr-2" />{isSaving ? 'Adding...' : 'Add University'}
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}><X className="w-4 h-4 mr-2" />Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <Input
        placeholder="Search universities..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <Building2 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-medium">No universities found</p>
          <p className="text-sm text-muted-foreground mt-1">Add your first university to get started</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(u => (
            <Card key={u.id} className={`transition-colors ${!u.is_active ? 'opacity-60' : 'hover:border-primary/20'}`}>
              <CardContent className="p-4">
                {editingId === u.id ? (
                  <div className="space-y-3">
                    <div className="grid md:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Name</Label>
                        <Input className="mt-1 h-8 text-sm" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
                      </div>
                      <div>
                        <Label className="text-xs">Country</Label>
                        <Input className="mt-1 h-8 text-sm" value={editForm.country} onChange={e => setEditForm(f => ({ ...f, country: e.target.value }))} />
                      </div>
                      <div>
                        <Label className="text-xs">Type</Label>
                        <Select value={editForm.type} onValueChange={v => setEditForm(f => ({ ...f, type: v as 'Federal' | 'State' | 'Private' }))}>
                          <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Federal">Federal</SelectItem>
                            <SelectItem value="State">State</SelectItem>
                            <SelectItem value="Private">Private</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Email Domain</Label>
                        <Input className="mt-1 h-8 text-sm" value={editForm.email_domain} onChange={e => setEditForm(f => ({ ...f, email_domain: e.target.value }))} />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => saveEdit(u.id)} disabled={!editForm.name.trim() || isSaving}>
                        <Check className="w-3.5 h-3.5 mr-1" />Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                        <X className="w-3.5 h-3.5 mr-1" />Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm">{u.name}</p>
                          <Badge variant="outline" className="text-xs">{u.type}</Badge>
                          {!u.is_active && <Badge variant="secondary" className="text-xs">Inactive</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {u.country}{u.email_domain ? ` · ${u.email_domain}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button size="icon" variant="ghost" className="w-8 h-8" onClick={() => startEdit(u)}>
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className={`w-8 h-8 ${u.is_active ? 'text-red-500 hover:text-red-600' : 'text-green-500 hover:text-green-600'}`}
                        onClick={() => toggleActive(u)}
                        title={u.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {u.is_active ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
