'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, FileText, Users, CheckCircle, Clock, Edit, Eye } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ListPageSkeleton } from '@/components/ui/skeleton-screens'

export default function AgreementsPage() {
  const [agreements, setAgreements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadAgreements()
  }, [])

  async function loadAgreements() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: initiated } = await supabase
      .from('coauthorship_agreements')
      .select(`
        *,
        coauthorship_signatories(
          id, has_signed,
          profiles(full_name, avatar_url)
        )
      `)
      .eq('initiator_id', user.id)
      .order('created_at', { ascending: false })

    const { data: participating } = await supabase
      .from('coauthorship_signatories')
      .select(`
        *,
        coauthorship_agreements(
          *,
          coauthorship_signatories(
            id, has_signed,
            profiles(full_name, avatar_url)
          )
        )
      `)
      .eq('user_id', user.id)

    const participatingAgreements = (participating || [])
      .map((p: any) => p.coauthorship_agreements)
      .filter((a: any) => a && a.initiator_id !== user.id)

    const all = [...(initiated || []), ...participatingAgreements].filter(Boolean)

    setAgreements(all)
    setLoading(false)
  }

  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    draft: { label: 'Draft', color: 'bg-gray-500/10 text-gray-400 border-gray-500/20', icon: Edit },
    pending: { label: 'Pending Signatures', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', icon: Clock },
    active: { label: 'Active', color: 'bg-green-500/10 text-green-400 border-green-500/20', icon: CheckCircle },
    completed: { label: 'Completed', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: CheckCircle },
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">

      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            Co-authorship Agreements
          </h1>
          <p className="text-muted-foreground">Formal agreements for research collaborations</p>
        </div>
        <Button asChild>
          <Link href="/agreements/new">
            <Plus className="w-4 h-4 mr-2" />
            New Agreement
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total', value: agreements.length, color: 'text-primary' },
          { label: 'Pending', value: agreements.filter(a => a.status === 'pending').length, color: 'text-yellow-400' },
          { label: 'Active', value: agreements.filter(a => a.status === 'active').length, color: 'text-green-400' },
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {loading ? (
        <ListPageSkeleton type="card" count={3} />
      ) : agreements.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground opacity-30" />
          <h2 className="font-semibold text-lg">No agreements yet</h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Create a co-authorship agreement to formalize collaboration terms,
            authorship order, and IP ownership with your research partners.
          </p>
          <Button asChild>
            <Link href="/agreements/new">Create First Agreement</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {agreements.map(agreement => {
            const config = statusConfig[agreement.status] || statusConfig.draft
            const signatories = agreement.coauthorship_signatories || []
            const signedCount = signatories.filter((s: any) => s.has_signed).length

            return (
              <Card key={agreement.id} className="hover:border-primary/30 transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={`text-xs ${config.color}`}>
                          {config.label}
                        </Badge>
                      </div>
                      <h3 className="font-semibold">{agreement.project_title}</h3>
                      <p className="text-sm text-muted-foreground">{agreement.title}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {signatories.length} co-author{signatories.length !== 1 ? 's' : ''}
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          {signedCount}/{signatories.length} signed
                        </span>
                        <span>
                          Created {format(new Date(agreement.created_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/agreements/${agreement.id}`}>
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
