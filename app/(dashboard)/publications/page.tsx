'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BackToHub } from '@/components/ui/back-to-hub'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Calendar, Globe, ExternalLink, BookOpen, GraduationCap } from 'lucide-react'
import { ListPageSkeleton } from '@/components/ui/skeleton-screens'
import { format } from 'date-fns'

interface Conference {
  id: string
  name: string
  acronym: string | null
  description: string | null
  website: string | null
  submission_deadline: string | null
  event_date: string | null
  location: string | null
  is_virtual: boolean
  research_areas: string[] | null
  acceptance_rate: number | null
  ranking: string | null
  created_at: string
}

interface Journal {
  id: string
  name: string
  abbreviation: string | null
  description: string | null
  website: string | null
  publisher: string | null
  impact_factor: number | null
  open_access: boolean
  research_areas: string[] | null
  submission_guidelines_url: string | null
  indexing: string[] | null
  created_at: string
}

type ActiveTab = 'conferences' | 'journals'

const RANKING_COLORS: Record<string, string> = {
  'A*': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  A: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  B: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  C: 'bg-green-500/10 text-green-400 border-green-500/20',
}

export default function PublicationsPage() {
  const [tab, setTab] = useState<ActiveTab>('conferences')
  const [conferences, setConferences] = useState<Conference[]>([])
  const [journals, setJournals] = useState<Journal[]>([])
  const [filteredConf, setFilteredConf] = useState<Conference[]>([])
  const [filteredJour, setFilteredJour] = useState<Journal[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [areaFilter, setAreaFilter] = useState('all')
  const [allAreas, setAllAreas] = useState<string[]>([])
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const [{ data: confData }, { data: jourData }] = await Promise.all([
        supabase.from('conferences').select('*').order('event_date', { ascending: true }),
        supabase.from('journals').select('*').order('impact_factor', { ascending: false }),
      ])
      const confs = confData || []
      const jours = jourData || []
      setConferences(confs)
      setJournals(jours)
      setFilteredConf(confs)
      setFilteredJour(jours)

      const areas = new Set<string>()
      confs.forEach(c => c.research_areas?.forEach((a: string) => areas.add(a)))
      jours.forEach(j => j.research_areas?.forEach((a: string) => areas.add(a)))
      setAllAreas(Array.from(areas).sort())
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    setFilteredConf(conferences.filter(c => {
      const matchSearch = !q || c.name.toLowerCase().includes(q) || (c.acronym || '').toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q)
      const matchArea = areaFilter === 'all' || c.research_areas?.includes(areaFilter)
      return matchSearch && matchArea
    }))
    setFilteredJour(journals.filter(j => {
      const matchSearch = !q || j.name.toLowerCase().includes(q) || (j.abbreviation || '').toLowerCase().includes(q) || (j.description || '').toLowerCase().includes(q)
      const matchArea = areaFilter === 'all' || j.research_areas?.includes(areaFilter)
      return matchSearch && matchArea
    }))
  }, [search, areaFilter, conferences, journals])

  if (loading) {
    return <div className="max-w-4xl mx-auto px-4 py-8"><ListPageSkeleton type="card" count={4} /></div>
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <BackToHub href="/discover" label="Back to Discover" />
      <div>
        <h1 className="text-2xl font-bold font-heading">Conferences & Journals</h1>
        <p className="text-muted-foreground text-sm mt-1">Find publication venues relevant to your research</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/50 p-1 rounded-xl w-fit">
        <button
          onClick={() => setTab('conferences')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
            tab === 'conferences'
              ? 'bg-background shadow text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          Conferences
          <span className="ml-1 text-xs bg-muted/80 px-1.5 py-0.5 rounded-full">{filteredConf.length}</span>
        </button>
        <button
          onClick={() => setTab('journals')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
            tab === 'journals'
              ? 'bg-background shadow text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Journals
          <span className="ml-1 text-xs bg-muted/80 px-1.5 py-0.5 rounded-full">{filteredJour.length}</span>
        </button>
      </div>

      {/* Search + Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${tab}...`}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={areaFilter} onValueChange={setAreaFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Research area" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All areas</SelectItem>
            {allAreas.map(area => (
              <SelectItem key={area} value={area}>{area}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Conferences */}
      {tab === 'conferences' && (
        <div className="space-y-3">
          {filteredConf.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No conferences found</p>
            </div>
          )}
          {filteredConf.map(conf => (
            <Card key={conf.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {conf.acronym && (
                        <span className="font-bold text-primary text-sm">{conf.acronym}</span>
                      )}
                      {conf.ranking && (
                        <Badge variant="outline" className={`text-xs ${RANKING_COLORS[conf.ranking] || 'bg-muted/50 text-muted-foreground'}`}>
                          Rank {conf.ranking}
                        </Badge>
                      )}
                      {conf.is_virtual && (
                        <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-400 border-blue-500/20">Virtual</Badge>
                      )}
                    </div>
                    <h2 className="font-semibold text-sm">{conf.name}</h2>
                    {conf.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{conf.description}</p>
                    )}
                    {conf.research_areas && conf.research_areas.length > 0 && (
                      <div className="flex gap-1.5 flex-wrap mt-2">
                        {conf.research_areas.slice(0, 4).map(area => (
                          <span key={area} className="text-xs bg-muted/50 text-muted-foreground px-2 py-0.5 rounded-full">
                            {area}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                      {conf.event_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(conf.event_date), 'MMM d, yyyy')}
                        </span>
                      )}
                      {conf.location && (
                        <span className="flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          {conf.location}
                        </span>
                      )}
                      {conf.submission_deadline && (
                        <span className="flex items-center gap-1">
                          Deadline: {format(new Date(conf.submission_deadline), 'MMM d, yyyy')}
                        </span>
                      )}
                    </div>
                  </div>
                  {conf.website && (
                    <a
                      href={conf.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="flex-shrink-0 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Journals */}
      {tab === 'journals' && (
        <div className="space-y-3">
          {filteredJour.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No journals found</p>
            </div>
          )}
          {filteredJour.map(journal => (
            <Card key={journal.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {journal.abbreviation && (
                        <span className="font-bold text-primary text-sm">{journal.abbreviation}</span>
                      )}
                      {journal.open_access && (
                        <Badge variant="outline" className="text-xs bg-green-500/10 text-green-400 border-green-500/20">
                          Open Access
                        </Badge>
                      )}
                      {journal.impact_factor && (
                        <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-400 border-purple-500/20">
                          IF {journal.impact_factor.toFixed(2)}
                        </Badge>
                      )}
                    </div>
                    <h2 className="font-semibold text-sm">{journal.name}</h2>
                    {journal.publisher && (
                      <p className="text-xs text-muted-foreground mt-0.5">{journal.publisher}</p>
                    )}
                    {journal.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{journal.description}</p>
                    )}
                    {journal.research_areas && journal.research_areas.length > 0 && (
                      <div className="flex gap-1.5 flex-wrap mt-2">
                        {journal.research_areas.slice(0, 4).map(area => (
                          <span key={area} className="text-xs bg-muted/50 text-muted-foreground px-2 py-0.5 rounded-full">
                            {area}
                          </span>
                        ))}
                      </div>
                    )}
                    {journal.indexing && journal.indexing.length > 0 && (
                      <div className="flex gap-1.5 flex-wrap mt-1.5">
                        <span className="text-xs text-muted-foreground">Indexed in:</span>
                        {journal.indexing.map(idx => (
                          <span key={idx} className="text-xs font-medium text-muted-foreground">{idx}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {journal.website && (
                      <a
                        href={journal.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary transition-colors"
                        title="Visit website"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
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
