'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Trophy, Medal, Crown, Loader2, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AkiliScoreBadge } from '@/components/akili/AkiliScoreBadge'

interface LeaderboardEntry {
  id: string
  full_name: string | null
  avatar_url: string | null
  department: string | null
  roles: string[] | null
  akili_score: number | null
  akili_dimension_knowledge: number | null
  akili_dimension_collaboration: number | null
  akili_dimension_mentorship: number | null
  akili_dimension_technical: number | null
  university_name?: string | null
}

function getInitials(name: string | null) {
  if (!name) return 'U'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const DIMENSION_FIELDS: Record<string, keyof LeaderboardEntry> = {
  overall: 'akili_score',
  knowledge: 'akili_dimension_knowledge',
  collaboration: 'akili_dimension_collaboration',
  mentorship: 'akili_dimension_mentorship',
  technical: 'akili_dimension_technical',
}

const ROLE_OPTIONS = [
  { value: 'all', label: 'All Roles' },
  { value: 'student_researcher', label: 'Students' },
  { value: 'mentor', label: 'Mentors' },
  { value: 'technical_expert', label: 'Experts' },
]

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [universities, setUniversities] = useState<{ id: string; name: string }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserEntry, setCurrentUserEntry] = useState<LeaderboardEntry | null>(null)
  const [universityFilter, setUniversityFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [activeTab, setActiveTab] = useState('overall')

  useEffect(() => { loadData() }, [universityFilter, roleFilter])

  async function loadData() {
    setIsLoading(true)
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (user) setCurrentUserId(user.id)

    // Load universities for filter
    const { data: univData } = await supabase.from('universities').select('id, name').order('name')
    if (univData) setUniversities(univData)

    // Build query
    let query = supabase
      .from('profiles')
      .select(`
        id, full_name, avatar_url, department, roles,
        akili_score, akili_dimension_knowledge, akili_dimension_collaboration,
        akili_dimension_mentorship, akili_dimension_technical,
        university:universities!profiles_university_id_fkey(name)
      `)
      .order('akili_score', { ascending: false })
      .limit(50)

    if (universityFilter !== 'all') {
      query = query.eq('university_id', universityFilter)
    }
    if (roleFilter !== 'all') {
      query = query.contains('roles', [roleFilter])
    }

    const { data } = await query

    if (data) {
      const mapped: LeaderboardEntry[] = data.map((p: Record<string, unknown>) => ({
        id: p.id as string,
        full_name: p.full_name as string | null,
        avatar_url: p.avatar_url as string | null,
        department: p.department as string | null,
        roles: p.roles as string[] | null,
        akili_score: p.akili_score as number | null,
        akili_dimension_knowledge: p.akili_dimension_knowledge as number | null,
        akili_dimension_collaboration: p.akili_dimension_collaboration as number | null,
        akili_dimension_mentorship: p.akili_dimension_mentorship as number | null,
        akili_dimension_technical: p.akili_dimension_technical as number | null,
        university_name: Array.isArray(p.university) ? (p.university[0] as { name: string })?.name : (p.university as { name: string } | null)?.name,
      }))
      setEntries(mapped)

      // Find current user's entry or fetch if outside top 50
      const userEntry = mapped.find(e => e.id === user?.id)
      if (userEntry) {
        setCurrentUserEntry(userEntry)
      } else if (user) {
        const { data: me } = await supabase
          .from('profiles')
          .select(`id, full_name, avatar_url, department, roles, akili_score,
            akili_dimension_knowledge, akili_dimension_collaboration,
            akili_dimension_mentorship, akili_dimension_technical,
            university:universities!profiles_university_id_fkey(name)`)
          .eq('id', user.id)
          .single()
        if (me) {
          setCurrentUserEntry({
            id: me.id,
            full_name: me.full_name,
            avatar_url: me.avatar_url,
            department: me.department,
            roles: me.roles,
            akili_score: me.akili_score,
            akili_dimension_knowledge: me.akili_dimension_knowledge,
            akili_dimension_collaboration: me.akili_dimension_collaboration,
            akili_dimension_mentorship: me.akili_dimension_mentorship,
            akili_dimension_technical: me.akili_dimension_technical,
            university_name: Array.isArray(me.university) ? me.university[0]?.name : (me.university as { name: string } | null)?.name,
          })
        }
      }
    }

    setIsLoading(false)
  }

  function getDimensionScore(entry: LeaderboardEntry, dim: string): number {
    return (entry[DIMENSION_FIELDS[dim]] as number | null) || 0
  }

  function getSortedEntries(dim: string): LeaderboardEntry[] {
    return [...entries].sort((a, b) => getDimensionScore(b, dim) - getDimensionScore(a, dim))
  }

  const top50 = getSortedEntries('overall')
  const top3 = top50.slice(0, 3)
  const rest = top50.slice(3)

  const podiumOrder = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3
  const podiumHeights = ['h-20', 'h-28', 'h-14']
  const podiumRanks = [2, 1, 3]

  const cardStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: '12px' }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin mx-auto" style={{ color: '#7C3AED' }} />
          <p style={{ color: '#7C6A9C' }}>Loading leaderboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading flex items-center gap-2" style={{ color: '#E2D9F3' }}>
            <Trophy className="h-6 w-6 text-yellow-400" />
            Akili Leaderboard
          </h1>
          <p className="text-sm mt-1" style={{ color: '#7C6A9C' }}>Top researchers on ResearchFlow</p>
        </div>
        <div className="flex gap-2">
          <Select value={universityFilter} onValueChange={setUniversityFilter}>
            <SelectTrigger className="w-[180px]" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(139,92,246,0.2)', color: '#E2D9F3' }}>
              <SelectValue placeholder="University" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Universities</SelectItem>
              {universities.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[140px]" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(139,92,246,0.2)', color: '#E2D9F3' }}>
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              {ROLE_OPTIONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {entries.length === 0 ? (
        <Card style={cardStyle}>
          <CardContent className="py-16 text-center" style={{ color: '#7C6A9C' }}>
            <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No leaderboard data yet. Start earning Akili points!</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Top 3 Podium */}
          {top3.length >= 2 && (
            <Card style={cardStyle}>
              <CardContent className="p-6">
                <h2 className="text-sm font-semibold text-center mb-6" style={{ color: '#7C6A9C' }}>TOP RESEARCHERS</h2>
                <div className="flex items-end justify-center gap-4">
                  {podiumOrder.map((entry, i) => {
                    const rank = podiumRanks[i]
                    const isFirst = rank === 1
                    const medalColor = rank === 1 ? '#FFD700' : rank === 2 ? '#C0C0C0' : '#CD7F32'
                    return (
                      <div key={entry.id} className="flex flex-col items-center gap-2" style={{ flex: isFirst ? '0 0 160px' : '0 0 130px' }}>
                        <div className="relative">
                          {isFirst && <Crown className="absolute -top-6 left-1/2 -translate-x-1/2 h-5 w-5" style={{ color: '#FFD700' }} />}
                          <Avatar className={isFirst ? 'h-20 w-20' : 'h-14 w-14'} style={{ border: `3px solid ${medalColor}` }}>
                            <AvatarFallback style={{ background: 'rgba(124,58,237,0.2)', color: '#A855F7', fontSize: isFirst ? '24px' : '16px' }}>
                              {getInitials(entry.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-2 -right-2 h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: medalColor, color: '#05010F' }}>
                            {rank}
                          </div>
                        </div>
                        <div className="text-center mt-2">
                          <p className="font-semibold text-sm truncate max-w-[140px]" style={{ color: '#E2D9F3' }}>{entry.full_name}</p>
                          {entry.university_name && <p className="text-xs truncate max-w-[140px]" style={{ color: '#7C6A9C' }}>{entry.university_name}</p>}
                          <div className="mt-1.5">
                            <AkiliScoreBadge score={entry.akili_score || 0} showTitle={false} size="sm" />
                          </div>
                        </div>
                        {/* Podium block */}
                        <div
                          className={`w-full rounded-t-lg ${podiumHeights[i]}`}
                          style={{ background: `${medalColor}20`, border: `1px solid ${medalColor}40`, marginTop: '8px' }}
                        />
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dimension Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(139,92,246,0.15)' }}>
              {Object.keys(DIMENSION_FIELDS).map(dim => (
                <TabsTrigger key={dim} value={dim} className="capitalize text-xs">{dim}</TabsTrigger>
              ))}
            </TabsList>

            {Object.keys(DIMENSION_FIELDS).map(dim => {
              const sorted = getSortedEntries(dim)
              const displayList = dim === 'overall' ? rest : sorted.slice(0, 20)
              const userRank = top50.findIndex(e => e.id === currentUserId) + 1

              return (
                <TabsContent key={dim} value={dim}>
                  <Card style={cardStyle}>
                    <CardContent className="p-0">
                      <div className="divide-y divide-purple-900/20">
                        {/* Header row */}
                        <div className="grid grid-cols-[2.5rem_1fr_auto] gap-3 px-4 py-2 text-xs font-medium" style={{ color: '#4A3F6B' }}>
                          <span>Rank</span>
                          <span>Researcher</span>
                          <span>{dim === 'overall' ? 'Score' : `${dim.charAt(0).toUpperCase() + dim.slice(1)} pts`}</span>
                        </div>

                        {displayList.map((entry, idx) => {
                          const rank = dim === 'overall' ? idx + 4 : idx + 1
                          const isMe = entry.id === currentUserId
                          const score = getDimensionScore(entry, dim)

                          return (
                            <div
                              key={entry.id}
                              className="grid grid-cols-[2.5rem_1fr_auto] gap-3 px-4 py-3 items-center"
                              style={{ background: isMe ? 'rgba(124,58,237,0.08)' : 'transparent' }}
                            >
                              <span className="text-sm font-mono font-medium" style={{ color: isMe ? '#A855F7' : '#7C6A9C' }}>
                                {rank}
                              </span>
                              <div className="flex items-center gap-2 min-w-0">
                                <Avatar className="h-8 w-8 shrink-0">
                                  <AvatarFallback className="text-xs" style={{ background: 'rgba(124,58,237,0.15)', color: '#A855F7' }}>
                                    {getInitials(entry.full_name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate" style={{ color: isMe ? '#C4B5FD' : '#E2D9F3' }}>
                                    {entry.full_name} {isMe && <span className="text-xs" style={{ color: '#7C6A9C' }}>(you)</span>}
                                  </p>
                                  <p className="text-xs truncate" style={{ color: '#7C6A9C' }}>
                                    {entry.department || entry.university_name || 'Researcher'}
                                  </p>
                                </div>
                              </div>
                              <span className="font-bold text-sm" style={{ color: '#A855F7' }}>{score.toLocaleString()}</span>
                            </div>
                          )
                        })}

                        {/* Pinned current user (if outside top display) */}
                        {currentUserEntry && !displayList.find(e => e.id === currentUserId) && (
                          <>
                            <div className="px-4 py-1 text-center text-xs" style={{ color: '#4A3F6B' }}>· · ·</div>
                            <div
                              className="grid grid-cols-[2.5rem_1fr_auto] gap-3 px-4 py-3 items-center"
                              style={{ background: 'rgba(124,58,237,0.08)' }}
                            >
                              <span className="text-sm font-mono font-medium" style={{ color: '#A855F7' }}>
                                {userRank > 0 ? userRank : '50+'}
                              </span>
                              <div className="flex items-center gap-2 min-w-0">
                                <Avatar className="h-8 w-8 shrink-0">
                                  <AvatarFallback className="text-xs" style={{ background: 'rgba(124,58,237,0.15)', color: '#A855F7' }}>
                                    {getInitials(currentUserEntry.full_name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate" style={{ color: '#C4B5FD' }}>
                                    {currentUserEntry.full_name} <span className="text-xs" style={{ color: '#7C6A9C' }}>(you)</span>
                                  </p>
                                </div>
                              </div>
                              <span className="font-bold text-sm" style={{ color: '#A855F7' }}>
                                {getDimensionScore(currentUserEntry, dim).toLocaleString()}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              )
            })}
          </Tabs>
        </>
      )}
    </div>
  )
}
