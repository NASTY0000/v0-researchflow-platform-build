'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, BookOpen, Calendar, Eye, ArrowRight, Sparkles, Loader2, Filter } from 'lucide-react'
import type { ShowcaseEntry, Profile } from '@/lib/types/database'

type EntryWithAuthor = ShowcaseEntry & { author: Profile | null }

const RESEARCH_AREAS = [
  'Computer Science', 'Medicine & Health', 'Engineering', 'Agriculture',
  'Economics', 'Environmental Science', 'Physics', 'Chemistry',
  'Social Sciences', 'Education', 'Law', 'Mathematics', 'Other',
]

export default function ShowcasePage() {
  const [entries, setEntries] = useState<EntryWithAuthor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [search, setSearch] = useState('')
  const [areaFilter, setAreaFilter] = useState('all')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => setIsLoggedIn(!!user))
  }, [])

  useEffect(() => {
    async function load() {
      setIsLoading(true)
      const supabase = createClient()

      let query = supabase
        .from('showcase_entries')
        .select('*, author:profiles!author_id(id,full_name,avatar_url,department,university_id)')
        .in('status', ['published', 'featured'])
        .order('published_at', { ascending: false })
        .limit(50)

      if (search.trim()) {
        query = query.or(`title.ilike.%${search.trim()}%,abstract.ilike.%${search.trim()}%`)
      }
      if (areaFilter !== 'all') {
        query = query.eq('research_area', areaFilter)
      }

      const { data } = await query
      setEntries((data || []) as EntryWithAuthor[])
      setIsLoading(false)
    }

    load()
  }, [search, areaFilter])

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#05010F', color: '#F3F0FF' }}>

      {/* Nav */}
      <nav
        className="sticky top-0 z-40 px-4 sm:px-6 py-3 flex items-center justify-between"
        style={{ background: 'rgba(5,1,15,0.92)', borderBottom: '1px solid rgba(139,92,246,0.15)', backdropFilter: 'blur(12px)' }}
      >
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg overflow-hidden">
            <Image src="/icon.svg" alt="ResearchFlow" width={32} height={32} className="w-8 h-8" />
          </div>
          <span className="font-bold font-heading hidden sm:block" style={{ color: '#A855F7' }}>ResearchFlow</span>
        </Link>

        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <Button size="sm" asChild style={{ background: 'linear-gradient(135deg,#7C3AED,#A855F7)', border: 'none' }}>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button size="sm" variant="ghost" asChild style={{ color: '#C4B5D8' }}>
                <Link href="/auth/login">Sign In</Link>
              </Button>
              <Button size="sm" asChild style={{ background: 'linear-gradient(135deg,#7C3AED,#A855F7)', border: 'none' }}>
                <Link href="/auth/signup">Join Free</Link>
              </Button>
            </>
          )}
        </div>
      </nav>

      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-6 space-y-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5" style={{ color: '#A855F7' }} />
          <span className="text-sm font-semibold uppercase tracking-widest" style={{ color: '#A855F7' }}>Research Showcase</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold font-heading" style={{ letterSpacing: '-0.02em' }}>
          African Research, Shared Openly
        </h1>
        <p className="text-base max-w-xl" style={{ color: '#7C6A9C' }}>
          Explore published research from student researchers and academics across Africa.
        </p>
      </div>

      {/* Filters */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-8">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#7C6A9C' }} />
            <Input
              className="pl-9"
              placeholder="Search by title or abstract..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(139,92,246,0.2)', color: '#F3F0FF' }}
            />
          </div>
          <Select value={areaFilter} onValueChange={setAreaFilter}>
            <SelectTrigger
              className="w-full sm:w-52"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(139,92,246,0.2)', color: '#F3F0FF' }}
            >
              <Filter className="w-3.5 h-3.5 mr-2 shrink-0" style={{ color: '#7C6A9C' }} />
              <SelectValue placeholder="Research Area" />
            </SelectTrigger>
            <SelectContent style={{ background: '#0F0A1E', border: '1px solid rgba(139,92,246,0.3)' }}>
              <SelectItem value="all">All Areas</SelectItem>
              {RESEARCH_AREAS.map(area => (
                <SelectItem key={area} value={area}>{area}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#A855F7' }} />
          </div>
        ) : entries.length === 0 ? (
          <div className="py-20 text-center space-y-4 rounded-2xl" style={{ border: '1px dashed rgba(139,92,246,0.25)' }}>
            <BookOpen className="w-12 h-12 mx-auto opacity-20" />
            <p className="font-semibold text-lg">No published research yet.</p>
            <p style={{ color: '#7C6A9C' }}>Be the first to submit your work.</p>
            {isLoggedIn && (
              <Button asChild style={{ background: 'linear-gradient(135deg,#7C3AED,#A855F7)', border: 'none' }}>
                <Link href="/projects">Submit Research</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {entries.map(entry => (
              <EntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </div>

      {/* Join Banner */}
      {!isLoggedIn && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
          <div
            className="rounded-2xl p-10 text-center space-y-5"
            style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(168,85,247,0.08))', border: '1px solid rgba(139,92,246,0.3)' }}
          >
            <Sparkles className="w-10 h-10 mx-auto" style={{ color: '#A855F7' }} />
            <h2 className="text-2xl font-bold font-heading">Join ResearchFlow to Collaborate on Research</h2>
            <p className="max-w-lg mx-auto" style={{ color: '#7C6A9C' }}>
              Connect with researchers across Africa, share your own work, find collaborators, and grow your academic network — all in one place.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Button asChild style={{ background: 'linear-gradient(135deg,#7C3AED,#A855F7)', border: 'none' }}>
                <Link href="/auth/signup">Create Free Account</Link>
              </Button>
              <Button variant="outline" asChild style={{ border: '1px solid rgba(139,92,246,0.3)', color: '#A855F7' }}>
                <Link href="/auth/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-10 px-4 sm:px-6" style={{ borderTop: '1px solid rgba(139,92,246,0.12)' }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg overflow-hidden">
              <Image src="/icon.svg" alt="ResearchFlow" width={28} height={28} />
            </div>
            <span className="font-bold font-heading text-sm" style={{ color: '#A855F7' }}>ResearchFlow</span>
          </div>
          <div className="flex items-center gap-6 text-sm" style={{ color: '#7C6A9C' }}>
            {['About', 'Terms', 'Privacy', 'Contact'].map(item => (
              <Link key={item} href={`/${item.toLowerCase()}`} className="hover:text-[#F3F0FF] transition-colors">{item}</Link>
            ))}
          </div>
          <p className="text-xs" style={{ color: '#7C6A9C' }}>
            &copy; {new Date().getFullYear()} ResearchFlow. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

function truncateAbstract(text: string, wordLimit = 100): string {
  const words = text.trim().split(/\s+/)
  if (words.length <= wordLimit) return text
  return words.slice(0, wordLimit).join(' ') + '…'
}

function EntryCard({ entry }: { entry: EntryWithAuthor }) {
  const isFeatured = entry.status === 'featured'

  return (
    <div
      className="flex flex-col rounded-2xl overflow-hidden transition-all duration-200 hover:translate-y-[-2px]"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: isFeatured
          ? '1px solid rgba(234,179,8,0.35)'
          : '1px solid rgba(139,92,246,0.18)',
      }}
    >
      {isFeatured && (
        <div
          className="px-4 py-1.5 text-xs font-semibold flex items-center gap-1.5"
          style={{ background: 'rgba(234,179,8,0.12)', color: '#EAB308', borderBottom: '1px solid rgba(234,179,8,0.2)' }}
        >
          <Sparkles className="w-3 h-3" />Featured Research
        </div>
      )}

      <div className="p-5 flex flex-col flex-1 space-y-4">
        {/* Author */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Avatar className="h-7 w-7 shrink-0">
              <AvatarImage src={entry.author?.avatar_url || undefined} />
              <AvatarFallback className="text-xs" style={{ background: 'rgba(124,58,237,0.2)', color: '#A855F7' }}>
                {entry.author?.full_name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: '#C4B5D8' }}>
                {entry.author?.full_name || 'Unknown'}
              </p>
              {entry.author?.department && (
                <p className="text-[10px] truncate" style={{ color: '#7C6A9C' }}>{entry.author.department}</p>
              )}
            </div>
          </div>
          {entry.published_at && (
            <span className="flex items-center gap-1 shrink-0 text-[10px]" style={{ color: '#7C6A9C' }}>
              <Calendar className="w-3 h-3" />
              {new Date(entry.published_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-semibold text-sm leading-snug line-clamp-2" style={{ color: '#F3F0FF' }}>
          {entry.title}
        </h3>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          <Badge
            className="text-[10px] px-2 py-0"
            style={{ background: 'rgba(168,85,247,0.12)', color: '#A855F7', border: '1px solid rgba(168,85,247,0.25)' }}
          >
            {entry.research_area}
          </Badge>
          {entry.tags?.slice(0, 2).map(tag => (
            <Badge key={tag} variant="outline" className="text-[10px] px-2 py-0" style={{ borderColor: 'rgba(139,92,246,0.2)', color: '#7C6A9C' }}>
              {tag}
            </Badge>
          ))}
        </div>

        {/* Abstract preview */}
        <p className="text-xs leading-relaxed flex-1" style={{ color: '#7C6A9C' }}>
          {truncateAbstract(entry.abstract)}
        </p>

        {/* Footer row */}
        <div className="flex items-center justify-between pt-1">
          <span className="flex items-center gap-1 text-xs" style={{ color: '#7C6A9C' }}>
            <Eye className="w-3.5 h-3.5" />{entry.views.toLocaleString()}
          </span>
          <Link href={`/showcase/${entry.id}`}>
            <Button size="sm" variant="ghost" className="text-xs h-7 px-3 gap-1" style={{ color: '#A855F7' }}>
              Read More <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
