'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ContextualHint } from '@/components/ui/ContextualHint'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { Search, Trophy, Calendar, Users, Zap } from 'lucide-react'
import { formatDistanceToNow, format, isPast } from 'date-fns'
import { ForumCardSkeleton } from '@/components/ui/skeleton-screens'
import { StaggerContainer, StaggerItem } from '@/components/ui/stagger-container'
import { HoverCardLift } from '@/components/ui/hover-card-lift'

interface Challenge {
  id: string
  title: string
  description: string | null
  difficulty: string
  status: string
  submission_deadline: string | null
  prize_description: string | null
  akili_reward: number
  submission_count: number
  research_areas: string[] | null
  created_at: string
}

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: 'bg-green-500/10 text-green-400 border-green-500/20',
  intermediate: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  advanced: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  expert: 'bg-red-500/10 text-red-400 border-red-500/20',
}

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-green-500/10 text-green-400 border-green-500/20',
  closed: 'bg-muted/50 text-muted-foreground border-border',
  judging: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  completed: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
}

const STATUSES = ['all', 'open', 'judging', 'closed', 'completed']
const DIFFICULTIES = ['all', 'beginner', 'intermediate', 'advanced', 'expert']

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [filtered, setFiltered] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [difficulty, setDifficulty] = useState('all')
  const [isAdmin, setIsAdmin] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('profiles').select('is_admin').eq('id', user.id).single().then(({ data }) => {
        setIsAdmin(data?.is_admin || false)
      })
    })
  }, [])

  useEffect(() => {
    async function load() {
      const { data: challengesData, error } = await supabase
        .from('research_challenges')
        .select('*')
        .order('created_at', { ascending: false })
      console.log('Challenges:', challengesData, 'Error:', error)
      setChallenges(challengesData || [])
      setFiltered(challengesData || [])
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    let result = challenges
    if (status !== 'all') result = result.filter(c => c.status === status)
    if (difficulty !== 'all') result = result.filter(c => c.difficulty === difficulty)
    if (search) result = result.filter(c =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      (c.description || '').toLowerCase().includes(search.toLowerCase())
    )
    setFiltered(result)
  }, [search, status, difficulty, challenges])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => <ForumCardSkeleton key={i} />)}
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <ContextualHint
        hintKey="hint_challenges"
        icon="🏆"
        title="Research Challenges"
        description="Compete with researchers across Africa. Top entries get published and earn significant Akili points toward your next tier."
      />
      <div>
        <h1 className="text-2xl font-bold font-heading">Research Challenges</h1>
        <p className="text-muted-foreground text-sm mt-1">Solve real problems and earn Akili points</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search challenges..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-xs text-muted-foreground font-medium">Status:</span>
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all border ${
                status === s
                  ? 'bg-primary/20 border-primary/50 text-primary'
                  : 'bg-transparent border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-xs text-muted-foreground font-medium">Level:</span>
          {DIFFICULTIES.map(d => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all border ${
                difficulty === d
                  ? 'bg-primary/20 border-primary/50 text-primary'
                  : 'bg-transparent border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Challenges */}
      <StaggerContainer className="space-y-4">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground space-y-3">
            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No challenges found</p>
            {isAdmin && challenges.length === 0 && (
              <div className="space-y-3">
                <p className="text-sm">No challenges in database.</p>
                <Button
                  onClick={async () => {
                    await supabase.from('research_challenges').insert([
                      {
                        title: 'Africa Climate Solutions Challenge',
                        description: 'Develop innovative research solutions addressing climate change impacts in African communities.',
                        problem_statement: 'Climate change disproportionately affects African communities. We need innovative, locally-grounded research that proposes practical solutions for adaptation and mitigation across the continent.',
                        requirements: ['Must be a student or early-career researcher at an African institution', 'Submission must be original research', 'Research must address a specific African community or region', 'Minimum 1,500 words'],
                        prize_description: '🥇 $500 + Featured Showcase + 2,000 Akili · 🥈 $200 + 1,000 Akili · 🥉 $100 + 500 Akili',
                        akili_reward: 2000,
                        difficulty: 'intermediate',
                        research_areas: ['Climate Science', 'Environmental Science', 'Agriculture', 'Public Policy'],
                        status: 'open',
                        submission_deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
                        is_featured: true,
                        submission_count: 0,
                      },
                      {
                        title: 'AI for African Healthcare Challenge',
                        description: 'Use artificial intelligence and data science to solve healthcare challenges in Africa.',
                        problem_statement: 'Healthcare access and quality remain critical challenges across Africa. This challenge invites researchers to propose AI-driven solutions.',
                        requirements: ['Open to all African university students', 'Must propose a practical AI application', 'Must address a real healthcare problem'],
                        prize_description: '🥇 $1,000 + Mentorship + 3,000 Akili · 🥈 $500 + 1,500 Akili',
                        akili_reward: 3000,
                        difficulty: 'advanced',
                        research_areas: ['Artificial Intelligence', 'Public Health', 'Data Science'],
                        status: 'open',
                        submission_deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
                        is_featured: true,
                        submission_count: 0,
                      },
                      {
                        title: 'Agricultural Innovation Research Sprint',
                        description: 'Fast-track research ideas to improve food security and agricultural productivity in Africa.',
                        problem_statement: 'Africa faces significant food security challenges. This sprint calls for focused research proposals.',
                        requirements: ['Research must be Africa-focused', 'Open to all academic levels'],
                        prize_description: '🥇 $300 + 1,500 Akili · 🥈 $150 + 750 Akili',
                        akili_reward: 1500,
                        difficulty: 'beginner',
                        research_areas: ['Agriculture', 'Food Security', 'Economics'],
                        status: 'open',
                        submission_deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                        is_featured: false,
                        submission_count: 0,
                      },
                    ])
                    window.location.reload()
                  }}
                >
                  Seed Challenges
                </Button>
              </div>
            )}
          </div>
        )}
        {filtered.map(challenge => {
          const deadlinePast = challenge.submission_deadline ? isPast(new Date(challenge.submission_deadline)) : false
          return (
            <StaggerItem key={challenge.id}>
            <HoverCardLift>
            <Link href={`/challenges/${challenge.id}`}>
              <Card className="hover:border-primary/40 transition-colors cursor-pointer">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <Badge
                          variant="outline"
                          className={`text-xs capitalize ${STATUS_COLORS[challenge.status] || ''}`}
                        >
                          {challenge.status}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`text-xs capitalize ${DIFFICULTY_COLORS[challenge.difficulty] || ''}`}
                        >
                          {challenge.difficulty}
                        </Badge>
                      </div>
                      <h2 className="font-semibold mb-1">{challenge.title}</h2>
                      {challenge.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{challenge.description}</p>
                      )}
                      {challenge.research_areas && challenge.research_areas.length > 0 && (
                        <div className="flex gap-1.5 flex-wrap mt-2">
                          {challenge.research_areas.slice(0, 3).map(area => (
                            <span key={area} className="text-xs bg-muted/50 text-muted-foreground px-2 py-0.5 rounded-full">
                              {area}
                            </span>
                          ))}
                          {challenge.research_areas.length > 3 && (
                            <span className="text-xs text-muted-foreground">+{challenge.research_areas.length - 3}</span>
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Zap className="w-3 h-3 text-primary" />
                          <span className="text-primary font-medium">+{challenge.akili_reward}</span> Akili pts
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {challenge.submission_count} submissions
                        </span>
                        {challenge.submission_deadline && (
                          <span className={`flex items-center gap-1 ${deadlinePast ? 'text-red-400' : ''}`}>
                            <Calendar className="w-3 h-3" />
                            {deadlinePast
                              ? `Ended ${formatDistanceToNow(new Date(challenge.submission_deadline), { addSuffix: true })}`
                              : `Closes ${format(new Date(challenge.submission_deadline), 'MMM d, yyyy')}`
                            }
                          </span>
                        )}
                      </div>
                    </div>
                    {challenge.prize_description && (
                      <div className="flex-shrink-0 text-right">
                        <div className="text-xs text-muted-foreground mb-1">Prize</div>
                        <div className="text-sm font-semibold text-primary max-w-[140px] text-right line-clamp-2">
                          {challenge.prize_description}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
            </HoverCardLift>
            </StaggerItem>
          )
        })}
      </StaggerContainer>
    </div>
  )
}
