'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import {
  Search, BookmarkPlus, BookmarkCheck,
  ExternalLink, Calendar, DollarSign, Globe,
} from 'lucide-react'
import { format, isPast, addDays } from 'date-fns'
import { BaobabLoader } from '@/components/ui/baobab-loader'
import { ContextualHint } from '@/components/ui/ContextualHint'

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

const GRANT_TYPE_COLORS: Record<string, string> = {
  research: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  fellowship: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  scholarship: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  travel: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  equipment: 'bg-green-500/10 text-green-400 border-green-500/20',
  conference: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
}

type Tab = 'all' | 'saved' | 'closing'

export default function GrantsPage() {
  const [grants, setGrants] = useState<Grant[]>([])
  const [filtered, setFiltered] = useState<Grant[]>([])
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [countryFilter, setCountryFilter] = useState('all')
  const [activeTab, setActiveTab] = useState<Tab>('all')
  const supabase = createClient()

  useEffect(() => {
    loadGrants()
    loadBookmarks()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    applyFilters()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grants, search, typeFilter, countryFilter, activeTab, bookmarks])

  async function loadGrants() {
    const { data } = await supabase
      .from('grants')
      .select('*')
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('deadline', { ascending: true })
    setGrants(data || [])
    setLoading(false)
  }

  async function loadBookmarks() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('grant_bookmarks')
      .select('grant_id')
      .eq('user_id', user.id)
    setBookmarks(new Set((data || []).map(b => b.grant_id)))
  }

  async function toggleBookmark(grantId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (bookmarks.has(grantId)) {
      await supabase
        .from('grant_bookmarks')
        .delete()
        .eq('user_id', user.id)
        .eq('grant_id', grantId)
      setBookmarks(prev => { const n = new Set(prev); n.delete(grantId); return n })
    } else {
      await supabase
        .from('grant_bookmarks')
        .insert({ user_id: user.id, grant_id: grantId })
      setBookmarks(prev => new Set([...prev, grantId]))
    }
  }

  function applyFilters() {
    let result = [...grants]

    if (activeTab === 'saved') {
      result = result.filter(g => bookmarks.has(g.id))
    } else if (activeTab === 'closing') {
      const soon = addDays(new Date(), 30)
      result = result.filter(g => {
        if (!g.deadline) return false
        const d = new Date(g.deadline)
        return !isPast(d) && d <= soon
      })
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(g =>
        g.title.toLowerCase().includes(q) ||
        g.funder.toLowerCase().includes(q) ||
        g.description?.toLowerCase().includes(q) ||
        g.research_areas?.some(a => a.toLowerCase().includes(q))
      )
    }

    if (typeFilter !== 'all') {
      result = result.filter(g => g.grant_type === typeFilter)
    }

    if (countryFilter !== 'all') {
      result = result.filter(g =>
        g.countries?.includes(countryFilter) ||
        g.countries?.includes('All African countries')
      )
    }

    setFiltered(result)
  }

  function deadlineStatus(deadline: string | null) {
    if (!deadline) return 'open'
    const d = new Date(deadline)
    if (isPast(d)) return 'expired'
    const days = Math.ceil((d.getTime() - Date.now()) / 86400000)
    if (days <= 7) return 'urgent'
    if (days <= 30) return 'soon'
    return 'open'
  }

  function formatAmount(min: number | null, max: number | null, currency: string) {
    if (!min && !max) return 'Amount not specified'
    const sym = currency === 'NGN' ? '₦' : currency === 'ZAR' ? 'R' : currency === 'EUR' ? '€' : '$'
    const fmt = (n: number) => `${sym}${n.toLocaleString()}`
    if (min && max) return `${fmt(min)} – ${fmt(max)}`
    if (max) return `Up to ${fmt(max)}`
    return `From ${fmt(min!)}`
  }

  const activeCount = grants.filter(g => !g.deadline || !isPast(new Date(g.deadline))).length
  const closingCount = grants.filter(g => {
    if (!g.deadline) return false
    const d = new Date(g.deadline)
    return !isPast(d) && d <= addDays(new Date(), 30)
  }).length

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      <ContextualHint
        hintKey="hint_grants"
        icon="💰"
        title="Research Funding Opportunities"
        description="Browse grants and funding opportunities matched to your research field and academic level."
      />

      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <span>💰</span> Research Grants Directory
        </h1>
        <p className="text-muted-foreground">Curated funding opportunities for African researchers</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Active Grants', value: activeCount, color: 'text-primary' },
          { label: 'Closing Soon', value: closingCount, color: 'text-orange-400' },
          { label: 'Saved', value: bookmarks.size, color: 'text-teal-400' },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4 text-center">
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        {([
          { key: 'all', label: 'All Grants' },
          { key: 'closing', label: '⏰ Closing Soon' },
          { key: 'saved', label: '🔖 Saved' },
        ] as { key: Tab; label: string }[]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search grants..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="research">Research</SelectItem>
            <SelectItem value="fellowship">Fellowship</SelectItem>
            <SelectItem value="scholarship">Scholarship</SelectItem>
            <SelectItem value="travel">Travel</SelectItem>
            <SelectItem value="equipment">Equipment</SelectItem>
            <SelectItem value="conference">Conference</SelectItem>
          </SelectContent>
        </Select>
        <Select value={countryFilter} onValueChange={setCountryFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Countries</SelectItem>
            <SelectItem value="Nigeria">Nigeria</SelectItem>
            <SelectItem value="South Africa">South Africa</SelectItem>
            <SelectItem value="Kenya">Kenya</SelectItem>
            <SelectItem value="Ghana">Ghana</SelectItem>
            <SelectItem value="Tanzania">Tanzania</SelectItem>
            <SelectItem value="Uganda">Uganda</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-muted-foreground">
        Showing {filtered.length} grant{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <BaobabLoader size="md" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg font-medium">No grants found</p>
          <p className="text-sm mt-2">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(grant => {
            const status = deadlineStatus(grant.deadline)
            const saved = bookmarks.has(grant.id)
            return (
              <Card
                key={grant.id}
                className={`border transition-all hover:border-primary/30 ${
                  grant.is_featured ? 'border-primary/20 bg-primary/5' : 'border-border'
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3 min-w-0">
                      {/* Title */}
                      <div className="flex items-start gap-2 flex-wrap">
                        {grant.is_featured && (
                          <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 text-xs shrink-0">
                            ✦ Featured
                          </Badge>
                        )}
                        <h3 className="font-bold text-base leading-tight">{grant.title}</h3>
                      </div>
                      <p className="text-sm font-medium text-primary/80">{grant.funder}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                        {grant.description}
                      </p>

                      {/* Meta */}
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          {formatAmount(grant.amount_min, grant.amount_max, grant.currency)}
                        </span>
                        {grant.deadline && (
                          <span className={`flex items-center gap-1 font-medium ${
                            status === 'urgent' ? 'text-red-400'
                            : status === 'soon' ? 'text-orange-400'
                            : status === 'expired' ? 'text-muted-foreground line-through'
                            : 'text-muted-foreground'
                          }`}>
                            <Calendar className="w-3 h-3" />
                            {status === 'expired'
                              ? 'Closed'
                              : status === 'urgent'
                              ? `⚠️ Closes ${format(new Date(grant.deadline), 'MMM d')}`
                              : `Deadline: ${format(new Date(grant.deadline), 'MMM d, yyyy')}`}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          {grant.countries?.[0] === 'All African countries'
                            ? 'Pan-African'
                            : grant.countries?.slice(0, 2).join(', ')}
                        </span>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2">
                        {grant.grant_type && (
                          <Badge variant="outline" className={`text-xs ${GRANT_TYPE_COLORS[grant.grant_type] || ''}`}>
                            {grant.grant_type}
                          </Badge>
                        )}
                        {grant.research_areas?.slice(0, 3).map(area => (
                          <Badge key={area} variant="outline" className="text-xs border-border">
                            {area}
                          </Badge>
                        ))}
                      </div>

                      {grant.eligibility && grant.eligibility.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          <span className="font-medium">Eligibility:</span>{' '}
                          {grant.eligibility.slice(0, 2).join(' · ')}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 shrink-0">
                      <Button size="sm" asChild disabled={status === 'expired'}>
                        <Link href={`/grants/${grant.id}`} className="gap-1.5">
                          <ExternalLink className="w-3 h-3" />
                          View &amp; Apply
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleBookmark(grant.id)}
                        className={saved ? 'text-primary border-primary/30' : ''}
                      >
                        {saved
                          ? <><BookmarkCheck className="w-3 h-3 mr-1" />Saved</>
                          : <><BookmarkPlus className="w-3 h-3 mr-1" />Save</>}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <div className="text-center py-6 border-t border-border">
        <p className="text-sm text-muted-foreground">Know a grant that should be listed?</p>
        <p className="text-xs text-muted-foreground mt-1">Contact us at support@researchflowafrica.com</p>
      </div>
    </div>
  )
}
