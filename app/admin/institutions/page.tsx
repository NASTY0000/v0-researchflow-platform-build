'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Building2, Plus, ArrowLeft, Edit, Trash2, Check, AlertCircle } from 'lucide-react'

export default function AdminInstitutionsPage() {
  const router = useRouter()
  const [institutions, setInstitutions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    acronym: '',
    country: 'Nigeria',
    website: '',
    contact_email: '',
    subscription_status: 'free',
    admin_user_id: '',
  })

  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUserId(user?.id || null)

    const { data } = await supabase
      .from('institutions')
      .select(`
        *,
        institution_members(count),
        profiles!institutions_admin_user_id_fkey(full_name, email)
      `)
      .order('created_at', { ascending: false })

    setInstitutions(data || [])
    setLoading(false)
  }

  async function handleSave() {
    if (!formData.name.trim()) {
      setError('Institution name is required')
      return
    }

    setSaving(true)
    setError('')

    if (editingId) {
      const { error: updateError } = await supabase
        .from('institutions')
        .update({ ...formData, updated_at: new Date().toISOString() })
        .eq('id', editingId)

      if (updateError) {
        setError(updateError.message)
        setSaving(false)
        return
      }
      setSuccess('Institution updated!')
    } else {
      const { error: insertError } = await supabase
        .from('institutions')
        .insert({
          ...formData,
          admin_user_id: formData.admin_user_id || currentUserId,
        })

      if (insertError) {
        setError(insertError.message)
        setSaving(false)
        return
      }
      setSuccess('Institution created!')
    }

    await loadData()
    setShowForm(false)
    setEditingId(null)
    resetForm()
    setSaving(false)

    setTimeout(() => setSuccess(''), 3000)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this institution? This cannot be undone.')) return
    await supabase.from('institutions').delete().eq('id', id)
    await loadData()
  }

  function startEdit(institution: any) {
    setFormData({
      name: institution.name || '',
      acronym: institution.acronym || '',
      country: institution.country || 'Nigeria',
      website: institution.website || '',
      contact_email: institution.contact_email || '',
      subscription_status: institution.subscription_status || 'free',
      admin_user_id: institution.admin_user_id || '',
    })
    setEditingId(institution.id)
    setShowForm(true)
  }

  function resetForm() {
    setFormData({
      name: '',
      acronym: '',
      country: 'Nigeria',
      website: '',
      contact_email: '',
      subscription_status: 'free',
      admin_user_id: '',
    })
    setEditingId(null)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push('/admin')} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Admin Panel
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Manage Institutions</h1>
            <p className="text-muted-foreground text-sm">Create and manage university institution accounts</p>
          </div>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true) }} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Institution
        </Button>
      </div>

      {success && (
        <div className="flex items-center gap-2 text-green-400 text-sm p-3 bg-green-500/10 rounded-lg border border-green-500/20">
          <Check className="w-4 h-4" />
          {success}
        </div>
      )}

      {/* Create/Edit Form */}
      {showForm && (
        <Card className="border-primary/20">
          <CardContent className="p-6 space-y-4">
            <h2 className="font-semibold">{editingId ? 'Edit Institution' : 'New Institution'}</h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Institution Name *</Label>
                <Input
                  value={formData.name}
                  onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                  placeholder="University of Lagos"
                />
              </div>
              <div className="space-y-2">
                <Label>Acronym</Label>
                <Input
                  value={formData.acronym}
                  onChange={e => setFormData(p => ({ ...p, acronym: e.target.value }))}
                  placeholder="UNILAG"
                />
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input
                  value={formData.country}
                  onChange={e => setFormData(p => ({ ...p, country: e.target.value }))}
                  placeholder="Nigeria"
                />
              </div>
              <div className="space-y-2">
                <Label>Contact Email</Label>
                <Input
                  value={formData.contact_email}
                  onChange={e => setFormData(p => ({ ...p, contact_email: e.target.value }))}
                  placeholder="research@university.edu"
                />
              </div>
              <div className="space-y-2">
                <Label>Website</Label>
                <Input
                  value={formData.website}
                  onChange={e => setFormData(p => ({ ...p, website: e.target.value }))}
                  placeholder="https://university.edu"
                />
              </div>
              <div className="space-y-2">
                <Label>Subscription Status</Label>
                <select
                  value={formData.subscription_status}
                  onChange={e => setFormData(p => ({ ...p, subscription_status: e.target.value }))}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="free">Free</option>
                  <option value="trial">Trial</option>
                  <option value="active">Active (Premium)</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>
                Institution Admin User ID
                <span className="text-muted-foreground font-normal ml-1">
                  (optional — paste a user UUID to make them the dashboard admin)
                </span>
              </Label>
              <Input
                value={formData.admin_user_id}
                onChange={e => setFormData(p => ({ ...p, admin_user_id: e.target.value }))}
                placeholder="User UUID from Supabase..."
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm p-3 bg-destructive/10 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => { setShowForm(false); resetForm() }}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                {saving ? (
                  <div className="w-4 h-4 rounded-full animate-spin border-2 border-white border-t-transparent" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                {editingId ? 'Save Changes' : 'Create Institution'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Institutions List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 rounded-full animate-spin border-4 border-primary border-t-transparent" />
        </div>
      ) : institutions.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <Building2 className="w-12 h-12 text-muted-foreground/30 mx-auto" />
          <p className="font-medium">No institutions yet</p>
          <p className="text-sm text-muted-foreground">Create the first institution to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {institutions.map(inst => (
            <Card key={inst.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                      <Building2 className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{inst.name}</h3>
                        {inst.acronym && (
                          <span className="text-sm text-muted-foreground">({inst.acronym})</span>
                        )}
                        <Badge
                          variant="outline"
                          className={
                            inst.subscription_status === 'active'
                              ? 'bg-green-500/10 text-green-400 border-green-500/20 text-xs'
                              : 'text-xs'
                          }
                        >
                          {inst.subscription_status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {inst.country}{inst.contact_email && ` · ${inst.contact_email}`}
                      </p>
                      {inst.profiles && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Admin: {inst.profiles.full_name} ({inst.profiles.email})
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => startEdit(inst)} className="gap-1">
                      <Edit className="w-3 h-3" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(inst.id)}
                      className="gap-1 text-destructive hover:text-destructive border-destructive/30"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
