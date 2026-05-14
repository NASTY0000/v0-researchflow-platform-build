'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import type { University, UniversityType } from '@/lib/types/database'
import { createUniversity, updateUniversity } from '@/lib/actions/admin'

export function UniversitiesAdminForm({ initialUniversities }: { initialUniversities: University[] }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [country, setCountry] = useState('Nigeria')
  const [type, setType] = useState<UniversityType>('federal')
  const [domain, setDomain] = useState('')
  const [busy, setBusy] = useState(false)

  async function add(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    const res = await createUniversity({
      name: name.trim(),
      country: country.trim() || 'Nigeria',
      university_type: type,
      email_domain: domain.trim() || null,
    })
    setBusy(false)
    if (res.error) alert(res.error)
    else {
      setName('')
      setDomain('')
      router.refresh()
    }
  }

  async function toggleActive(u: University) {
    const next = u.is_active === false
    setBusy(true)
    const res = await updateUniversity(u.id, { is_active: next })
    setBusy(false)
    if (res.error) alert(res.error)
    else router.refresh()
  }

  return (
    <div className="space-y-8">
      <form onSubmit={add} className="rounded-lg border border-border/60 p-4 space-y-4 bg-card/30">
        <h2 className="font-semibold">Add university</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label>Country</Label>
            <Input value={country} onChange={(e) => setCountry(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as UniversityType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="federal">Federal</SelectItem>
                <SelectItem value="state">State</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Email domain</Label>
            <Input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="university.edu.ng"
            />
          </div>
        </div>
        <Button type="submit" disabled={busy}>
          Add
        </Button>
      </form>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Domain</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialUniversities.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.name}</TableCell>
                <TableCell>{u.country}</TableCell>
                <TableCell className="capitalize">{u.university_type || '—'}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{u.email_domain || '—'}</TableCell>
                <TableCell>
                  <Badge variant={u.is_active === false ? 'destructive' : 'secondary'}>
                    {u.is_active === false ? 'Inactive' : 'Active'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => toggleActive(u)}>
                    {u.is_active === false ? 'Activate' : 'Deactivate'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
