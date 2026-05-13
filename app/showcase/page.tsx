"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Search,
  Eye,
  Calendar,
  FileText,
  Loader2,
  X,
  Sparkles,
  Trophy,
  Filter,
  GraduationCap,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import type { ShowcaseEntry, Profile } from "@/lib/types/database"

type ShowcaseWithAuthor = ShowcaseEntry & {
  author: Profile | null
}

const RESEARCH_AREAS = [
  "All Areas",
  "Computer Science",
  "Medicine & Health",
  "Engineering",
  "Social Sciences",
  "Environmental Science",
  "Economics",
  "Education",
  "Law",
  "Psychology",
  "Biotechnology",
  "Data Science",
  "Agriculture",
  "Mathematics",
  "Physics",
  "Chemistry",
]

function truncateWords(text: string, wordCount: number): string {
  const words = text.split(/\s+/)
  if (words.length <= wordCount) return text
  return words.slice(0, wordCount).join(" ") + "…"
}

export default function PublicShowcasePage() {
  const [entries, setEntries] = useState<ShowcaseWithAuthor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // Filter state
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedArea, setSelectedArea] = useState("All Areas")
  const [selectedDepartment, setSelectedDepartment] = useState("All Departments")
  const [selectedUniversity, setSelectedUniversity] = useState("All Universities")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  // Derived lists for dropdowns (populated from data)
  const [departments, setDepartments] = useState<string[]>([])
  const [universities, setUniversities] = useState<string[]>([])

  useEffect(() => {
    loadShowcase()
  }, [selectedArea])

  async function loadShowcase() {
    setIsLoading(true)
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    setIsLoggedIn(!!user)

    let query = supabase
      .from("showcase_entries")
      .select("*, author:profiles!author_id(*)")
      .in("status", ["published", "featured"])
      .order("published_at", { ascending: false })

    if (selectedArea !== "All Areas") {
      query = query.eq("research_area", selectedArea)
    }

    const { data } = await query.limit(100)

    if (data) {
      setEntries(data as ShowcaseWithAuthor[])

      // Build department and university lists from loaded data
      const depts = [...new Set(
        data.map((e: ShowcaseWithAuthor) => e.author?.department).filter(Boolean)
      )] as string[]
      const univs = [...new Set(
        data.map((e: ShowcaseWithAuthor) => e.author?.university_id).filter(Boolean)
      )] as string[]
      setDepartments(depts.sort())
      setUniversities(univs.sort())
    }

    setIsLoading(false)
  }

  const filteredEntries = entries.filter((entry) => {
    if (
      searchQuery &&
      !entry.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !entry.abstract.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !entry.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
    ) {
      return false
    }
    if (
      selectedDepartment !== "All Departments" &&
      entry.author?.department !== selectedDepartment
    ) {
      return false
    }
    if (
      selectedUniversity !== "All Universities" &&
      entry.author?.university_id !== selectedUniversity
    ) {
      return false
    }
    if (dateFrom && entry.published_at && entry.published_at < dateFrom) {
      return false
    }
    if (dateTo && entry.published_at && entry.published_at > dateTo + "T23:59:59") {
      return false
    }
    return true
  })

  const featuredEntries = filteredEntries.filter((e) => e.status === "featured")
  const regularEntries = filteredEntries.filter((e) => e.status !== "featured")

  const hasActiveFilters =
    searchQuery ||
    selectedArea !== "All Areas" ||
    selectedDepartment !== "All Departments" ||
    selectedUniversity !== "All Universities" ||
    dateFrom ||
    dateTo

  function clearFilters() {
    setSearchQuery("")
    setSelectedArea("All Areas")
    setSelectedDepartment("All Departments")
    setSelectedUniversity("All Universities")
    setDateFrom("")
    setDateTo("")
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#05010F', color: '#F3F0FF' }}>
      {/* Nav */}
      <nav
        className="sticky top-0 z-40 px-4 py-3 flex items-center justify-between"
        style={{ background: 'rgba(5,1,15,0.92)', borderBottom: '1px solid rgba(139,92,246,0.15)', backdropFilter: 'blur(12px)' }}
      >
        <Link href="/" className="flex items-center gap-2 font-bold text-lg font-heading" style={{ color: '#F3F0FF' }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#7C3AED,#A855F7)' }}>
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="hidden sm:inline">ResearchFlow</span>
        </Link>
        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <Button size="sm" asChild style={{ background: 'linear-gradient(135deg,#7C3AED,#A855F7)', border: 'none' }}>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button size="sm" variant="ghost" asChild style={{ color: '#A855F7' }}>
                <Link href="/auth/login">Sign In</Link>
              </Button>
              <Button size="sm" asChild style={{ background: 'linear-gradient(135deg,#7C3AED,#A855F7)', border: 'none' }}>
                <Link href="/auth/signup">Join Free</Link>
              </Button>
            </>
          )}
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-10 space-y-8">
        {/* Header */}
        <div className="text-center space-y-3 pb-4">
          <h1 className="text-4xl md:text-5xl font-bold font-heading" style={{ letterSpacing: '-0.03em' }}>
            Research Showcase
          </h1>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: '#7C6A9C' }}>
            Discover completed research from African university students and researchers
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Published Works", value: entries.length, color: '#A855F7' },
            { label: "Researchers", value: new Set(entries.map(e => e.author_id)).size, color: '#06B6D4' },
            { label: "Total Views", value: entries.reduce((s, e) => s + e.views, 0).toLocaleString(), color: '#22C55E' },
            { label: "Research Areas", value: new Set(entries.map(e => e.research_area)).size, color: '#EAB308' },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="rounded-xl p-4 text-center"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.15)' }}
            >
              <p className="text-2xl font-bold" style={{ color }}>{value}</p>
              <p className="text-xs mt-1" style={{ color: '#7C6A9C' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Search & Filters */}
        <div
          className="rounded-2xl p-5 space-y-4"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.2)' }}
        >
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#7C6A9C' }} />
            <Input
              placeholder="Search by title, abstract, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.25)', color: '#F3F0FF' }}
            />
          </div>

          {/* Filter row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Select value={selectedArea} onValueChange={setSelectedArea}>
              <SelectTrigger style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.25)', color: '#F3F0FF' }}>
                <SelectValue placeholder="Research Area" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Areas">All Areas</SelectItem>
                {RESEARCH_AREAS.slice(1).map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.25)', color: '#F3F0FF' }}>
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Departments">All Departments</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedUniversity} onValueChange={setSelectedUniversity}>
              <SelectTrigger style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.25)', color: '#F3F0FF' }}>
                <SelectValue placeholder="University" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Universities">All Universities</SelectItem>
                {universities.map((u) => (
                  <SelectItem key={u} value={u}>{u}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                title="From date"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.25)', color: '#F3F0FF', flex: 1 }}
              />
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                title="To date"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.25)', color: '#F3F0FF', flex: 1 }}
              />
            </div>
          </div>

          {/* Results count + clear */}
          <div className="flex items-center justify-between">
            <p className="text-sm" style={{ color: '#7C6A9C' }}>
              Showing <span style={{ color: '#A855F7', fontWeight: 600 }}>{filteredEntries.length}</span> result{filteredEntries.length !== 1 ? 's' : ''}
            </p>
            {hasActiveFilters && (
              <Button
                size="sm"
                variant="ghost"
                onClick={clearFilters}
                style={{ color: '#A855F7', fontSize: '12px' }}
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Clear filters
              </Button>
            )}
          </div>
        </div>

        {/* Featured Section */}
        {featuredEntries.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Featured Research
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {featuredEntries.slice(0, 2).map((entry) => (
                <ShowcaseCard key={entry.id} entry={entry} featured />
              ))}
            </div>
          </div>
        )}

        {/* Main Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin" style={{ color: '#A855F7' }} />
          </div>
        ) : regularEntries.length === 0 && featuredEntries.length === 0 ? (
          <div className="text-center py-20">
            <Sparkles className="h-12 w-12 mx-auto mb-4" style={{ color: '#7C6A9C' }} />
            <h3 className="text-xl font-semibold mb-2">No research found</h3>
            <p style={{ color: '#7C6A9C' }}>
              {hasActiveFilters ? "Try adjusting your filters" : "No research has been published yet."}
            </p>
            {hasActiveFilters && (
              <Button variant="ghost" onClick={clearFilters} className="mt-4" style={{ color: '#A855F7' }}>
                Clear all filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {regularEntries.map((entry) => (
              <ShowcaseCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}

        {/* Join Banner */}
        {!isLoggedIn && (
          <div
            className="rounded-2xl p-10 text-center space-y-5 mt-8"
            style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(168,85,247,0.08))', border: '1px solid rgba(139,92,246,0.3)' }}
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto" style={{ background: 'linear-gradient(135deg,#7C3AED,#A855F7)' }}>
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold font-heading mb-2">Join ResearchFlow to Collaborate</h3>
              <p className="max-w-lg mx-auto" style={{ color: '#7C6A9C' }}>
                Connect with African researchers, publish your work, find collaborators, and access mentorship from experienced academics.
              </p>
            </div>
            <div className="flex items-center justify-center gap-4">
              <Button
                size="lg"
                asChild
                style={{ background: 'linear-gradient(135deg,#7C3AED,#A855F7)', border: 'none', boxShadow: '0 0 20px rgba(124,58,237,0.3)' }}
              >
                <Link href="/auth/signup">Create Free Account</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                style={{ border: '1px solid rgba(139,92,246,0.3)', color: '#A855F7' }}
              >
                <Link href="/auth/login">Sign In</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ShowcaseCard({
  entry,
  featured = false,
}: {
  entry: ShowcaseWithAuthor
  featured?: boolean
}) {
  return (
    <Link href={`/showcase/${entry.id}`} className="block group">
      <Card
        className="h-full transition-all duration-200 hover:scale-[1.01]"
        style={{
          background: featured
            ? 'linear-gradient(135deg, rgba(234,179,8,0.08), rgba(255,255,255,0.03))'
            : 'rgba(255,255,255,0.03)',
          border: featured
            ? '1px solid rgba(234,179,8,0.3)'
            : '1px solid rgba(139,92,246,0.15)',
          borderRadius: '14px',
        }}
      >
        <CardContent className="p-5 flex flex-col h-full space-y-3">
          {/* Badges */}
          <div className="flex flex-wrap gap-1.5">
            {featured && (
              <Badge style={{ background: 'rgba(234,179,8,0.15)', color: '#EAB308', border: '1px solid rgba(234,179,8,0.3)', fontSize: '11px' }}>
                <Trophy className="h-2.5 w-2.5 mr-1" />
                Featured
              </Badge>
            )}
            <Badge variant="secondary" style={{ fontSize: '11px' }}>{entry.research_area}</Badge>
            {entry.tags?.slice(0, 1).map((tag) => (
              <Badge key={tag} variant="outline" style={{ fontSize: '11px' }}>{tag}</Badge>
            ))}
          </div>

          {/* Title */}
          <h3
            className="font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors"
            style={{ color: '#F3F0FF', fontSize: '15px' }}
          >
            {entry.title}
          </h3>

          {/* Author */}
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs" style={{ background: 'rgba(124,58,237,0.15)', color: '#A855F7' }}>
                {entry.author?.full_name?.charAt(0) || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: '#C4B5D8' }}>{entry.author?.full_name}</p>
              {(entry.author?.department || entry.author?.university_id) && (
                <p className="text-xs truncate" style={{ color: '#7C6A9C' }}>
                  {[entry.author.department, entry.author.university_id].filter(Boolean).join(" · ")}
                </p>
              )}
            </div>
          </div>

          {/* Abstract preview */}
          <p className="text-xs leading-relaxed line-clamp-4 flex-1" style={{ color: '#7C6A9C' }}>
            {truncateWords(entry.abstract, 100)}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid rgba(139,92,246,0.1)' }}>
            <div className="flex items-center gap-3 text-xs" style={{ color: '#7C6A9C' }}>
              {entry.published_at && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(entry.published_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {entry.views.toLocaleString()}
              </span>
            </div>
            <span className="text-xs font-medium" style={{ color: '#A855F7' }}>
              Read More →
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
