'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft, Calendar, DollarSign,
  Globe, ExternalLink, CheckCircle,
  BookmarkPlus, BookmarkCheck, Building2,
} from 'lucide-react'
import Link from 'next/link'
import { format, isPast } from 'date-fns'

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
  is_featured: boolean
}

interface Application {
  id: string
  status: string
  reviewer_notes: string | null
  awarded_amount: number | null
}

export default function GrantDetailPage() {
  const params = useParams()
  const router = useRouter()
  const grantId = params.id as string
  const [grant, setGrant] = useState<Grant | null>(null)
  const [application, setApplication] = useState<Application | null>(null)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grantId])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setCurrentUserId(user.id)

    const [grantRes, appRes, bookmarkRes] = await Promise.all([
      supabase.from('grants').select('*').eq('id', grantId).single(),
      user
        ? supabase.from('grant_applications').select('*').eq('grant_id', grantId).eq('applicant_id', user.id).maybeSingle()
        : Promise.resolve({ data: null }),
      user
        ? supabase.from('grant_bookmarks').select('id').eq('grant_id', grantId).eq('user_id', user.id).maybeSingle()
        : Promise.resolve({ data: null }),
    ])

    setGrant(grantRes.data)
    setApplication(appRes.data)
    setSaved(!!bookmarkRes.data)
    setLoading(false)
  }

  async function toggleBookmark() {
    if (!currentUserId) return
    if (saved) {
      await supabase.from('grant_bookmarks').delete().eq('grant_id', grantId).eq('user_id', currentUserId)
      setSaved(false)
    } else {
      await supabase.from('grant_bookmarks').insert({ user_id: currentUserId, grant_id: grantId })
      setSaved(true)
    }
  }

  function statusBadge(status: string) {
    const styles: Record<string, string> = {
      submitted: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      under_review: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      shortlisted: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      awarded: 'bg-green-500/10 text-green-400 border-green-500/20',
      rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
    }
    const labels: Record<string, string> = {
      submitted: '📋 Application Submitted',
      under_review: '🔍 Under Review',
      shortlisted: '⭐ Shortlisted',
      awarded: '🎉 Awarded',
      rejected: '❌ Not Selected',
    }
    return (
      <div className={`px-4 py-3 rounded-xl border text-sm font-medium ${styles[status]}`}>
        {labels[status]}
      </div>
    )
  }

  function formatAmount(min: number | null, max: number | null, currency: string) {
    if (!min && !max) return 'Not specified'
    const sym = currency === 'NGN' ? '₦' : currency === 'ZAR' ? 'R' : currency === 'EUR' ? '€' : '$'
    const fmt = (n: number) => `${sym}${n.toLocaleString()}`
    if (min && max) return `${fmt(min)} – ${fmt(max)}`
    if (max) return `Up to ${fmt(max)}`
    return `From ${fmt(min!)}`
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 rounded-full animate-spin border-4 border-primary border-t-transparent" />
    </div>
  )

  if (!grant) return <div className="text-center py-12">Grant not found</div>

  const isExpired = grant.deadline ? isPast(new Date(grant.deadline)) : false
  const hasApplied = !!application

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
        <ArrowLeft className="w-4 h-4" /> Back to Grants
      </Button>

      {/* Header Card */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            {grant.is_featured && (
              <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">✦ Featured Grant</Badge>
            )}
            <h1 className="text-2xl font-bold leading-tight">{grant.title}</h1>
            <p className="text-primary font-medium flex items-center gap-2">
              <Building2 className="w-4 h-4" /> {grant.funder}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={toggleBookmark}
            className={saved ? 'text-primary border-primary/30' : ''}>
            {saved ? <BookmarkCheck className="w-4 h-4" /> : <BookmarkPlus className="w-4 h-4" />}
          </Button>
        </div>

        {hasApplied && (
          <div className="space-y-2">
            {statusBadge(application.status)}
            {application.reviewer_notes && (
              <p className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                <span className="font-medium">Reviewer note:</span> {application.reviewer_notes}
              </p>
            )}
            {application.awarded_amount && (
              <p className="text-sm font-semibold text-green-400 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                Awarded: ${application.awarded_amount.toLocaleString()}
              </p>
            )}
          </div>
        )}

        {/* Key details */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Funding Amount</p>
            <p className="font-semibold text-sm">{formatAmount(grant.amount_min, grant.amount_max, grant.currency)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Deadline</p>
            <p className={`font-semibold text-sm ${isExpired ? 'text-red-400' : ''}`}>
              {grant.deadline ? format(new Date(grant.deadline), 'MMM d, yyyy') : 'Rolling'}
              {isExpired && ' (Closed)'}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Grant Type</p>
            <p className="font-semibold text-sm capitalize">{grant.grant_type}</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 pt-2">
          {hasApplied ? (
            <Button variant="outline" className="flex-1" asChild>
              <Link href={`/grants/${grantId}/application`}>View My Application</Link>
            </Button>
          ) : isExpired ? (
            <Button disabled className="flex-1">Applications Closed</Button>
          ) : (
            <Button className="flex-1" asChild>
              <Link href={`/grants/${grantId}/apply`}>Apply Now →</Link>
            </Button>
          )}
          {grant.apply_url && (
            <Button variant="outline" asChild>
              <a href={grant.apply_url} target="_blank" rel="noopener noreferrer" className="gap-2">
                <ExternalLink className="w-4 h-4" /> Official Site
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
        <h2 className="font-semibold">About This Grant</h2>
        <p className="text-muted-foreground leading-relaxed">{grant.description}</p>
      </div>

      {/* Eligibility */}
      {grant.eligibility && grant.eligibility.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
          <h2 className="font-semibold">Eligibility Requirements</h2>
          <ul className="space-y-2">
            {grant.eligibility.map((req, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" /> {req}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Research Areas */}
      {grant.research_areas && grant.research_areas.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
          <h2 className="font-semibold">Eligible Research Areas</h2>
          <div className="flex flex-wrap gap-2">
            {grant.research_areas.map(area => (
              <Badge key={area} variant="outline" className="border-violet-500/40 text-violet-400">{area}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Countries */}
      {grant.countries && grant.countries.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
          <h2 className="font-semibold">Eligible Countries</h2>
          <div className="flex flex-wrap gap-2">
            {grant.countries.map(country => (
              <Badge key={country} variant="outline">
                <Globe className="w-3 h-3 mr-1" /> {country}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
