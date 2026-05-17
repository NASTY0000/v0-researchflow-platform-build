'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Search, MoreVertical, Eye, Ban, CheckCircle2, UserCog,
  ChevronLeft, ChevronRight, X, AlertTriangle
} from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import type { Profile } from '@/lib/types/database'
import { resolveUniversityName } from '@/lib/utils/university'

const PAGE_SIZE = 50

type SuspendForm = {
  reason: string
  durationType: 'permanent' | 'temporary'
  days: string
}

export default function AdminUsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<Profile[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('active')
  const [isLoading, setIsLoading] = useState(true)

  const [suspendTarget, setSuspendTarget] = useState<Profile | null>(null)
  const [changeRoleTarget, setChangeRoleTarget] = useState<Profile | null>(null)
  const [newRole, setNewRole] = useState('')
  const [suspendForm, setSuspendForm] = useState<SuspendForm>({
    reason: '', durationType: 'permanent', days: '7',
  })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const loadUsers = useCallback(async () => {
    setIsLoading(true)

    // Build base filter conditions
    const applyFilters = (q: ReturnType<typeof supabase.from>) => {
      if (search.trim()) {
        q = q.or(`full_name.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%`)
      }
      if (roleFilter !== 'all') q = q.contains('roles', [roleFilter])
      if (statusFilter === 'suspended') q = q.eq('is_suspended', true)
      else if (statusFilter === 'active') q = q.eq('is_suspended', false).eq('onboarding_completed', true)
      else if (statusFilter === 'onboarding') q = q.eq('onboarding_completed', false)
      return q
    }

    // Step 1: Get count without join (join can skew exact count)
    const countQ = applyFilters(supabase.from('profiles').select('id', { count: 'exact', head: true }))
    const { count } = await countQ
    setTotalCount(count || 0)

    // Step 2: Get paginated data
    const dataQ = applyFilters(
      supabase.from('profiles').select('*')
    ).order('created_at', { ascending: false }).range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
    const { data: profiles } = await dataQ

    if (profiles) {
      // Step 3: Resolve UUID university_ids separately
      const uuidIds = profiles
        .map(p => p.university_id)
        .filter((uid): uid is string => !!uid && /^[0-9a-f]{8}-[0-9a-f]{4}/.test(uid))
      const uniMap = new Map<string, string>()
      if (uuidIds.length > 0) {
        const { data: unis } = await supabase.from('universities').select('id, name').in('id', uuidIds)
        unis?.forEach(u => uniMap.set(u.id, u.name))
      }
      const enriched = profiles.map(p => ({
        ...p,
        university_id: uniMap.get(p.university_id ?? '') || p.university_id,
      }))
      setUsers(enriched as Profile[])
    }
    setIsLoading(false)
  }, [search, roleFilter, statusFilter, page])

  useEffect(() => { loadUsers() }, [loadUsers])

  async function handleSuspend() {
    if (!suspendTarget || !suspendForm.reason.trim()) return
    setSaving(true)
    const suspendedUntil = suspendForm.durationType === 'temporary'
      ? new Date(Date.now() + parseInt(suspendForm.days) * 86400000).toISOString()
      : null

    const { error } = await supabase.from('profiles').update({
      is_suspended: true,
      suspended_until: suspendedUntil,
      suspension_reason: suspendForm.reason.trim(),
    }).eq('id', suspendTarget.id)

    if (!error) {
      await supabase.from('notifications').insert({
        user_id: suspendTarget.id,
        title: 'Account Suspended',
        message: `Your account has been suspended. Contact support@researchflowafrica.com`,
        type: 'admin',
      })
      toast.success(`${suspendTarget.full_name} has been suspended`)
      setSuspendTarget(null)
      setSuspendForm({ reason: '', durationType: 'permanent', days: '7' })
      loadUsers()
    } else {
      toast.error('Failed to suspend user')
    }
    setSaving(false)
  }

  async function handleRestore(user: Profile) {
    const { error } = await supabase.from('profiles').update({
      is_suspended: false, suspended_until: null, suspension_reason: null,
    }).eq('id', user.id)
    if (!error) {
      toast.success(`${user.full_name} account restored`)
      loadUsers()
    }
  }

  async function handleChangeRole() {
    if (!changeRoleTarget || !newRole) return
    setSaving(true)
    const currentRoles = changeRoleTarget.roles || []
    const baseRoles = currentRoles.filter(r => r === 'admin')
    const updatedRoles = [...new Set([...baseRoles, newRole])]
    const { error } = await supabase.from('profiles').update({ roles: updatedRoles }).eq('id', changeRoleTarget.id)
    if (!error) {
      toast.success('Role updated')
      setChangeRoleTarget(null)
      setNewRole('')
      loadUsers()
    }
    setSaving(false)
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-heading">Users</h1>
        <p className="text-muted-foreground mt-1">Manage platform users · {totalCount} total</p>
      </div>

      {/* Suspend Modal */}
      {suspendTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-background border rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <h3 className="font-semibold">Suspend Account</h3>
                  <p className="text-sm text-muted-foreground">{suspendTarget.full_name}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSuspendTarget(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <Label>Reason <span className="text-destructive">*</span></Label>
                <Textarea
                  className="mt-1.5"
                  value={suspendForm.reason}
                  onChange={e => setSuspendForm(f => ({ ...f, reason: e.target.value }))}
                  placeholder="Explain why this account is being suspended..."
                  rows={3}
                />
              </div>
              <div>
                <Label>Duration</Label>
                <div className="space-y-2 mt-2">
                  {(['permanent', 'temporary'] as const).map(d => (
                    <label key={d} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="duration" value={d}
                        checked={suspendForm.durationType === d}
                        onChange={() => setSuspendForm(f => ({ ...f, durationType: d }))} />
                      <span className="text-sm capitalize">{d}</span>
                    </label>
                  ))}
                </div>
                {suspendForm.durationType === 'temporary' && (
                  <div className="mt-3">
                    <Label>Number of days</Label>
                    <Input
                      type="number" min="1" max="365"
                      value={suspendForm.days}
                      onChange={e => setSuspendForm(f => ({ ...f, days: e.target.value }))}
                      className="mt-1 w-32"
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t">
              <Button variant="destructive" disabled={!suspendForm.reason.trim() || saving} onClick={handleSuspend} className="flex-1">
                {saving ? 'Suspending...' : 'Confirm Suspension'}
              </Button>
              <Button variant="outline" onClick={() => setSuspendTarget(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* Change Role Modal */}
      {changeRoleTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-background border rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="font-semibold">Change Primary Role</h3>
              <Button variant="ghost" size="icon" onClick={() => setChangeRoleTarget(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Changing role for: <span className="font-medium text-foreground">{changeRoleTarget.full_name}</span>
              </p>
              <div>
                <Label>New Role</Label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select role..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student_researcher">Student Researcher</SelectItem>
                    <SelectItem value="collaborator">Collaborator</SelectItem>
                    <SelectItem value="technical_expert">Technical Expert</SelectItem>
                    <SelectItem value="mentor">Mentor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t">
              <Button disabled={!newRole || saving} onClick={handleChangeRole} className="flex-1">
                {saving ? 'Saving...' : 'Update Role'}
              </Button>
              <Button variant="outline" onClick={() => setChangeRoleTarget(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(0) }}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={v => { setRoleFilter(v); setPage(0) }}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="student_researcher">Student Researcher</SelectItem>
                <SelectItem value="collaborator">Collaborator</SelectItem>
                <SelectItem value="technical_expert">Technical Expert</SelectItem>
                <SelectItem value="mentor">Mentor</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(0) }}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="onboarding">Onboarding</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>University</TableHead>
                <TableHead>Role(s)</TableHead>
                <TableHead>Akili Score</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}><div className="h-4 bg-muted rounded animate-pulse" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map(user => (
                  <TableRow key={user.id} className={user.is_suspended ? 'opacity-60' : ''}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">{user.full_name?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{user.full_name || '—'}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-36 truncate">
                      {resolveUniversityName(user.university_id)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.roles?.slice(0, 2).map(r => (
                          <Badge key={r} variant="outline" className="text-xs capitalize">
                            {r.replace('_', ' ')}
                          </Badge>
                        ))}
                        {(user.roles?.length || 0) > 2 && (
                          <Badge variant="outline" className="text-xs">+{(user.roles?.length || 0) - 2}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-semibold text-primary">
                        {(user.akili_score || 0).toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </TableCell>
                    <TableCell>
                      {user.is_suspended ? (
                        <Badge variant="destructive" className="text-xs">Suspended</Badge>
                      ) : user.onboarding_completed ? (
                        <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-500">Active</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">Onboarding</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="w-8 h-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/profile/${user.id}`)}>
                            <Eye className="w-4 h-4 mr-2" /> View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setChangeRoleTarget(user); setNewRole(user.roles?.[0] || '') }}>
                            <UserCog className="w-4 h-4 mr-2" /> Change Role
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {user.is_suspended ? (
                            <DropdownMenuItem onClick={() => handleRestore(user)} className="text-green-500">
                              <CheckCircle2 className="w-4 h-4 mr-2" /> Restore Account
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => setSuspendTarget(user)} className="text-destructive">
                              <Ban className="w-4 h-4 mr-2" /> Suspend Account
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalCount)} of {totalCount}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm px-2">Page {page + 1} of {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
