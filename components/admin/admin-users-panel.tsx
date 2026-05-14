'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useMemo, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { MoreVertical } from 'lucide-react'
import type { Profile, University, UserRole } from '@/lib/types/database'
import { suspendUser, restoreUser, updateUserRolesAndAdmin } from '@/lib/actions/admin'

const ALL_ROLES: UserRole[] = [
  'student_researcher',
  'collaborator',
  'technical_expert',
  'mentor',
  'admin',
]

type Filters = { q?: string; role?: string; university?: string; status?: string }

export function AdminUsersPanel({
  users,
  universities,
  page,
  totalPages,
  total,
  filters,
}: {
  users: (Profile & { university?: University })[]
  universities: University[]
  page: number
  totalPages: number
  total: number
  filters: Filters
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()

  const [q, setQ] = useState(filters.q || '')
  const [suspendOpen, setSuspendOpen] = useState(false)
  const [suspendUserId, setSuspendUserId] = useState<string | null>(null)
  const [suspendReason, setSuspendReason] = useState('')
  const [suspendMode, setSuspendMode] = useState<'permanent' | 'temporary'>('temporary')
  const [suspendDays, setSuspendDays] = useState(7)
  const [viewUser, setViewUser] = useState<(Profile & { university?: University }) | null>(null)
  const [rolesOpen, setRolesOpen] = useState(false)
  const [rolesEditUser, setRolesEditUser] = useState<(Profile & { university?: University }) | null>(null)
  const [rolesDraft, setRolesDraft] = useState<UserRole[]>([])
  const [isAdminDraft, setIsAdminDraft] = useState(false)

  function applyFilters(next?: Partial<Filters>) {
    const p = new URLSearchParams(searchParams.toString())
    const merged: Filters = {
      q: searchParams.get('q') || undefined,
      role: searchParams.get('role') || undefined,
      university: searchParams.get('university') || undefined,
      status: searchParams.get('status') || undefined,
      ...next,
    }
    if (merged.q) p.set('q', merged.q)
    else p.delete('q')
    if (merged.role) p.set('role', merged.role)
    else p.delete('role')
    if (merged.university) p.set('university', merged.university)
    else p.delete('university')
    if (merged.status) p.set('status', merged.status)
    else p.delete('status')
    p.set('page', '1')
    startTransition(() => router.push(`/admin/users?${p.toString()}`))
  }

  const universityName = useMemo(() => {
    const m = new Map(universities.map((u) => [u.id, u.name]))
    return (id: string | null) => (id ? m.get(id) || '—' : '—')
  }, [universities])

  async function onSuspendConfirm() {
    if (!suspendUserId || !suspendReason.trim()) return
    const days = suspendMode === 'permanent' ? null : suspendDays
    const res = await suspendUser({
      userId: suspendUserId,
      reason: suspendReason.trim(),
      days,
    })
    if (res.error) {
      alert(res.error)
      return
    }
    setSuspendOpen(false)
    setSuspendUserId(null)
    setSuspendReason('')
    router.refresh()
  }

  async function onRestore(userId: string) {
    const res = await restoreUser(userId)
    if (res.error) {
      alert(res.error)
      return
    }
    router.refresh()
  }

  function openRoles(u: Profile & { university?: University }) {
    setRolesEditUser(u)
    setRolesDraft([...(u.roles || [])] as UserRole[])
    setIsAdminDraft(u.is_admin === true || u.roles?.includes('admin'))
    setRolesOpen(true)
  }

  async function saveRoles() {
    if (!rolesEditUser) return
    const next = new Set(rolesDraft)
    if (isAdminDraft) next.add('admin')
    else next.delete('admin')
    const res = await updateUserRolesAndAdmin(rolesEditUser.id, Array.from(next) as UserRole[], isAdminDraft)
    if (res.error) {
      alert(res.error)
      return
    }
    setRolesOpen(false)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <form
        className="flex flex-wrap gap-3 items-end"
        onSubmit={(e) => {
          e.preventDefault()
          applyFilters({ q: q.trim() || undefined })
        }}
      >
        <div className="space-y-1">
          <Label className="text-xs">Search</Label>
          <Input
            placeholder="Name or email"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-[220px]"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Role</Label>
          <Select
            value={filters.role || '__all__'}
            onValueChange={(v) => applyFilters({ role: v === '__all__' ? undefined : v })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All roles</SelectItem>
              {ALL_ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {r.replace(/_/g, ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">University</Label>
          <Select
            value={filters.university || '__all__'}
            onValueChange={(v) => applyFilters({ university: v === '__all__' ? undefined : v })}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All universities</SelectItem>
              {universities.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Status</Label>
          <Select
            value={filters.status || '__all__'}
            onValueChange={(v) =>
              applyFilters({ status: v === '__all__' ? undefined : v })
            }
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" disabled={pending}>
          Apply
        </Button>
      </form>

      <p className="text-xs text-muted-foreground">
        Showing {users.length} of {total} users (page {page} / {totalPages})
      </p>

      <div className="rounded-md border border-border/60 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>University</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Akili</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[80px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.full_name || '—'}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{u.email}</TableCell>
                <TableCell className="text-sm">
                  {u.university?.name || universityName(u.university_id)}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {(u.roles || []).map((r) => (
                      <Badge key={r} variant="secondary" className="text-[10px] capitalize">
                        {r.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>{u.akili_score ?? 0}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(u.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Badge variant={u.account_status === 'suspended' ? 'destructive' : 'outline'}>
                    {u.account_status || 'active'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setViewUser(u)}>View profile</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openRoles(u)}>Change role</DropdownMenuItem>
                      {u.account_status !== 'suspended' ? (
                        <DropdownMenuItem
                          onClick={() => {
                            setSuspendUserId(u.id)
                            setSuspendOpen(true)
                          }}
                        >
                          Suspend account
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => onRestore(u.id)}>Restore account</DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex gap-2 justify-end">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1 || pending}
          onClick={() => {
            const p = new URLSearchParams(searchParams.toString())
            p.set('page', String(page - 1))
            router.push(`/admin/users?${p}`)
          }}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages || pending}
          onClick={() => {
            const p = new URLSearchParams(searchParams.toString())
            p.set('page', String(page + 1))
            router.push(`/admin/users?${p}`)
          }}
        >
          Next
        </Button>
      </div>

      <Dialog open={!!viewUser} onOpenChange={() => setViewUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Profile summary</DialogTitle>
          </DialogHeader>
          {viewUser && (
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">Name:</span> {viewUser.full_name}
              </p>
              <p>
                <span className="text-muted-foreground">Email:</span> {viewUser.email}
              </p>
              <p>
                <span className="text-muted-foreground">University:</span>{' '}
                {viewUser.university?.name || universityName(viewUser.university_id)}
              </p>
              <p>
                <span className="text-muted-foreground">Bio:</span> {viewUser.bio || '—'}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewUser(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rolesOpen} onOpenChange={setRolesOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Change roles</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {ALL_ROLES.filter((r) => r !== 'admin').map((r) => (
              <label key={r} className="flex items-center gap-2 text-sm capitalize">
                <Checkbox
                  checked={rolesDraft.includes(r)}
                  onCheckedChange={(c) => {
                    if (c) setRolesDraft([...new Set([...rolesDraft, r])])
                    else setRolesDraft(rolesDraft.filter((x) => x !== r))
                  }}
                />
                {r.replace(/_/g, ' ')}
              </label>
            ))}
            <label className="flex items-center gap-2 text-sm font-medium">
              <Checkbox checked={isAdminDraft} onCheckedChange={(c) => setIsAdminDraft(!!c)} />
              Platform admin
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRolesOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveRoles}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={suspendOpen} onOpenChange={setSuspendOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Reason (required)</Label>
              <Textarea value={suspendReason} onChange={(e) => setSuspendReason(e.target.value)} rows={3} />
            </div>
            <RadioGroup
              value={suspendMode}
              onValueChange={(v) => setSuspendMode(v as 'permanent' | 'temporary')}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="temporary" id="tmp" />
                <Label htmlFor="tmp">Temporary</Label>
              </div>
              {suspendMode === 'temporary' && (
                <Input
                  type="number"
                  min={1}
                  max={365}
                  value={suspendDays}
                  onChange={(e) => setSuspendDays(parseInt(e.target.value, 10) || 1)}
                  className="w-24"
                />
              )}
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="permanent" id="perm" />
                <Label htmlFor="perm">Permanent</Label>
              </div>
            </RadioGroup>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!suspendReason.trim()}
              onClick={onSuspendConfirm}
            >
              Confirm suspend
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
