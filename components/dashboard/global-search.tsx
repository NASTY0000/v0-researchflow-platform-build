'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, Clock, User, Lightbulb, GraduationCap, Award, Loader2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'

const RECENT_KEY = 'rf_recent_searches'
const MAX_RECENT = 5

function getRecent(): string[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')
  } catch {
    return []
  }
}

function saveRecent(query: string) {
  const recent = [query, ...getRecent().filter(q => q !== query)].slice(0, MAX_RECENT)
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent))
}

function getInitials(name: string | null) {
  if (!name) return 'U'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

interface SearchResults {
  researchers: Array<{ id: string; full_name: string | null; department: string | null; avatar_url: string | null; akili_score: number | null }>
  ideas: Array<{ id: string; title: string; research_area: string | null; created_at: string; author: { full_name: string | null } | null }>
  mentors: Array<{ user_id: string; expertise_areas: string[] | null; tier: number | null; profile: { full_name: string | null; avatar_url: string | null } | null }>
  showcase: Array<{ id: string; title: string; research_area: string | null }>
}

const emptyResults: SearchResults = { researchers: [], ideas: [], mentors: [], showcase: [] }

export function GlobalSearch() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults>(emptyResults)
  const [isSearching, setIsSearching] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    function onKeydown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(true)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    function onOpen() { setOpen(true) }
    window.addEventListener('keydown', onKeydown)
    window.addEventListener('open-search', onOpen)
    return () => {
      window.removeEventListener('keydown', onKeydown)
      window.removeEventListener('open-search', onOpen)
    }
  }, [])

  useEffect(() => {
    if (open) {
      setRecentSearches(getRecent())
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setQuery('')
      setResults(emptyResults)
      setSelectedIndex(0)
    }
  }, [open])

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults(emptyResults)
      setIsSearching(false)
      return
    }
    setIsSearching(true)
    const supabase = createClient()
    const term = q.trim()

    const [researchersRes, ideasRes, mentorsRes, showcaseRes] = await Promise.allSettled([
      supabase
        .from('profiles')
        .select('id, full_name, department, avatar_url, akili_score')
        .or(`full_name.ilike.%${term}%,department.ilike.%${term}%`)
        .eq('public_profile', true)
        .limit(5),
      supabase
        .from('research_ideas')
        .select('id, title, research_area, created_at, author:profiles!research_ideas_author_id_fkey(full_name)')
        .or(`title.ilike.%${term}%,description.ilike.%${term}%`)
        .eq('status', 'open')
        .limit(5),
      supabase
        .from('mentor_profiles')
        .select('user_id, expertise_areas, tier, profile:profiles!mentor_profiles_user_id_fkey(full_name, avatar_url)')
        .eq('is_verified', true)
        .limit(3),
      supabase
        .from('showcase_entries')
        .select('id, title, research_area')
        .ilike('title', `%${term}%`)
        .limit(3),
    ])

    const researchers = researchersRes.status === 'fulfilled' ? (researchersRes.value.data || []) : []
    const ideas = ideasRes.status === 'fulfilled' ? (ideasRes.value.data || []) : []
    const allMentors = mentorsRes.status === 'fulfilled' ? (mentorsRes.value.data || []) : []
    const showcase = showcaseRes.status === 'fulfilled' ? (showcaseRes.value.data || []) : []

    // Filter mentors client-side by name/expertise
    const mentors = allMentors.filter(m => {
      const prof = Array.isArray(m.profile) ? m.profile[0] : m.profile
      const nameMatch = prof?.full_name?.toLowerCase().includes(term.toLowerCase())
      const expertiseMatch = m.expertise_areas?.some((a: string) => a.toLowerCase().includes(term.toLowerCase()))
      return nameMatch || expertiseMatch
    }).slice(0, 3)

    setResults({
      researchers: researchers as SearchResults['researchers'],
      ideas: ideas.map(i => ({ ...i, author: Array.isArray(i.author) ? i.author[0] : i.author })) as SearchResults['ideas'],
      mentors: mentors.map(m => ({ ...m, profile: Array.isArray(m.profile) ? m.profile[0] : m.profile })) as SearchResults['mentors'],
      showcase: showcase as SearchResults['showcase'],
    })
    setIsSearching(false)
    setSelectedIndex(0)
  }, [])

  useEffect(() => {
    clearTimeout(debounceRef.current)
    if (!query.trim()) {
      setResults(emptyResults)
      return
    }
    debounceRef.current = setTimeout(() => doSearch(query), 300)
    return () => clearTimeout(debounceRef.current)
  }, [query, doSearch])

  // Flatten results for keyboard navigation
  const flatItems: Array<{ type: string; id: string; href: string }> = [
    ...results.researchers.map(r => ({ type: 'researcher', id: r.id, href: `/profile/${r.id}` })),
    ...results.ideas.map(i => ({ type: 'idea', id: i.id, href: `/ideas/${i.id}` })),
    ...results.mentors.map(m => ({ type: 'mentor', id: m.user_id, href: '/mentors' })),
    ...results.showcase.map(s => ({ type: 'showcase', id: s.id, href: `/showcase/${s.id}` })),
  ]

  function navigate(href: string) {
    if (query.trim()) saveRecent(query.trim())
    setRecentSearches(getRecent())
    setOpen(false)
    router.push(href)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(i => Math.min(i + 1, flatItems.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && flatItems[selectedIndex]) {
      navigate(flatItems[selectedIndex].href)
    }
  }

  const hasResults = flatItems.length > 0
  const tierLabel = (tier: number | null) => tier === 1 ? 'Faculty' : tier === 2 ? 'Postgraduate' : 'Industry'

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-16 px-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: 'rgba(10,5,25,0.98)', border: '1px solid rgba(139,92,246,0.25)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: 'rgba(139,92,246,0.15)' }}>
          {isSearching
            ? <Loader2 className="h-5 w-5 shrink-0 animate-spin" style={{ color: '#7C6A9C' }} />
            : <Search className="h-5 w-5 shrink-0" style={{ color: '#7C6A9C' }} />
          }
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search researchers, ideas, mentors..."
            className="flex-1 bg-transparent outline-none text-base"
            style={{ color: '#E2D9F3' }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ color: '#7C6A9C' }}>
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden sm:flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.06)', color: '#7C6A9C', border: '1px solid rgba(139,92,246,0.2)' }}>
            Esc
          </kbd>
        </div>

        {/* Body */}
        <div className="max-h-[60vh] overflow-y-auto">
          {!query && recentSearches.length > 0 && (
            <div className="p-3">
              <p className="text-xs font-medium px-1 mb-2" style={{ color: '#4A3F6B' }}>RECENT SEARCHES</p>
              {recentSearches.map(s => (
                <button
                  key={s}
                  onClick={() => setQuery(s)}
                  className="w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left transition-colors hover:bg-white/5"
                >
                  <Clock className="h-4 w-4 shrink-0" style={{ color: '#7C6A9C' }} />
                  <span className="text-sm" style={{ color: '#A78BFA' }}>{s}</span>
                </button>
              ))}
            </div>
          )}

          {!query && recentSearches.length === 0 && (
            <div className="py-12 text-center" style={{ color: '#7C6A9C' }}>
              <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Search for researchers, ideas, mentors and more</p>
            </div>
          )}

          {query && !isSearching && !hasResults && (
            <div className="py-12 text-center" style={{ color: '#7C6A9C' }}>
              <p className="text-sm">No results for <span style={{ color: '#A78BFA' }}>"{query}"</span></p>
            </div>
          )}

          {hasResults && (
            <div className="p-2 space-y-1">
              {/* Researchers */}
              {results.researchers.length > 0 && (
                <Section label="RESEARCHERS" icon={<User className="h-3 w-3" />}>
                  {results.researchers.map((r, i) => {
                    const idx = i
                    return (
                      <ResultRow key={r.id} selected={selectedIndex === idx} onClick={() => navigate(`/profile/${r.id}`)}>
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarImage src={r.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">{getInitials(r.full_name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: '#E2D9F3' }}>{r.full_name}</p>
                          {r.department && <p className="text-xs truncate" style={{ color: '#7C6A9C' }}>{r.department}</p>}
                        </div>
                        {r.akili_score != null && (
                          <Badge className="text-xs shrink-0" style={{ background: 'rgba(124,58,237,0.15)', color: '#C4B5FD', border: '1px solid rgba(124,58,237,0.25)' }}>
                            {r.akili_score} pts
                          </Badge>
                        )}
                      </ResultRow>
                    )
                  })}
                </Section>
              )}

              {/* Ideas */}
              {results.ideas.length > 0 && (
                <Section label="RESEARCH IDEAS" icon={<Lightbulb className="h-3 w-3" />}>
                  {results.ideas.map((idea, i) => {
                    const idx = results.researchers.length + i
                    return (
                      <ResultRow key={idea.id} selected={selectedIndex === idx} onClick={() => navigate(`/ideas/${idea.id}`)}>
                        <div className="h-8 w-8 rounded-lg shrink-0 flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.15)' }}>
                          <Lightbulb className="h-4 w-4" style={{ color: '#A78BFA' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: '#E2D9F3' }}>{idea.title}</p>
                          <p className="text-xs" style={{ color: '#7C6A9C' }}>
                            {idea.research_area} · {idea.author?.full_name || 'Unknown'} · {formatDistanceToNow(new Date(idea.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </ResultRow>
                    )
                  })}
                </Section>
              )}

              {/* Mentors */}
              {results.mentors.length > 0 && (
                <Section label="MENTORS" icon={<GraduationCap className="h-3 w-3" />}>
                  {results.mentors.map((m, i) => {
                    const idx = results.researchers.length + results.ideas.length + i
                    const prof = m.profile
                    return (
                      <ResultRow key={m.user_id} selected={selectedIndex === idx} onClick={() => navigate('/mentors')}>
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarImage src={prof?.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">{getInitials(prof?.full_name || null)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: '#E2D9F3' }}>{prof?.full_name}</p>
                          {m.expertise_areas && m.expertise_areas.length > 0 && (
                            <p className="text-xs truncate" style={{ color: '#7C6A9C' }}>{m.expertise_areas.slice(0, 2).join(', ')}</p>
                          )}
                        </div>
                        <Badge className="text-xs shrink-0" style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981', border: '1px solid rgba(16,185,129,0.25)' }}>
                          {tierLabel(m.tier)}
                        </Badge>
                      </ResultRow>
                    )
                  })}
                </Section>
              )}

              {/* Showcase */}
              {results.showcase.length > 0 && (
                <Section label="SHOWCASE" icon={<Award className="h-3 w-3" />}>
                  {results.showcase.map((s, i) => {
                    const idx = results.researchers.length + results.ideas.length + results.mentors.length + i
                    return (
                      <ResultRow key={s.id} selected={selectedIndex === idx} onClick={() => navigate(`/showcase/${s.id}`)}>
                        <div className="h-8 w-8 rounded-lg shrink-0 flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.15)' }}>
                          <Award className="h-4 w-4" style={{ color: '#F59E0B' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: '#E2D9F3' }}>{s.title}</p>
                          {s.research_area && <p className="text-xs truncate" style={{ color: '#7C6A9C' }}>{s.research_area}</p>}
                        </div>
                      </ResultRow>
                    )
                  })}
                </Section>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 flex items-center gap-4 border-t text-xs" style={{ borderColor: 'rgba(139,92,246,0.1)', color: '#4A3F6B' }}>
          <span><kbd className="px-1">↑↓</kbd> navigate</span>
          <span><kbd className="px-1">↵</kbd> open</span>
          <span><kbd className="px-1">Esc</kbd> close</span>
        </div>
      </div>
    </div>
  )
}

function Section({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 px-2 py-1.5">
        <span style={{ color: '#4A3F6B' }}>{icon}</span>
        <span className="text-[11px] font-semibold tracking-wider" style={{ color: '#4A3F6B' }}>{label}</span>
      </div>
      {children}
    </div>
  )
}

function ResultRow({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      className="w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left transition-colors"
      style={{ background: selected ? 'rgba(124,58,237,0.15)' : 'transparent' }}
      onClick={onClick}
      onMouseEnter={() => {}}
    >
      {children}
    </button>
  )
}
