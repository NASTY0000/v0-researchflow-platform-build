'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  ArrowLeft, Trophy, Calendar, Users, Zap, CheckCircle, Loader2,
  Crown, ExternalLink, Star, Shield,
} from 'lucide-react'
import { format, isPast } from 'date-fns'
import { celebrateMilestone } from '@/lib/utils/confetti'
import { ListPageSkeleton } from '@/components/ui/skeleton-screens'
import {
  getChallengeTeams, getChallengeSubmissions, getUserTeamForChallenge,
  submitToChallenge, createChallengeTeam, joinChallengeTeam,
  ChallengeTeam, ChallengeSubmission,
} from '@/lib/actions/challenges'
import { WinnerBadge } from '@/components/challenges/WinnerBadge'

interface Challenge {
  id: string
  title: string
  description: string | null
  full_description: string | null
  difficulty: string
  status: string
  submission_deadline: string | null
  prize_description: string | null
  prize_type: string | null
  akili_reward: number
  submission_count: number
  evaluation_criteria: string | null
  judging_criteria: Record<string, number> | null
  research_areas: string[] | null
  max_team_size: number | null
  min_team_size: number | null
  winner_id: string | null
  winner_team_id: string | null
  featured_in_showcase: boolean
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

type Tab = 'overview' | 'teams' | 'submissions'

export default function ChallengeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const challengeId = params.id as string

  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  // Teams tab
  const [teams, setTeams] = useState<ChallengeTeam[]>([])
  const [loadingTeams, setLoadingTeams] = useState(false)
  const [myTeam, setMyTeam] = useState<ChallengeTeam | null>(null)
  const [showCreateTeam, setShowCreateTeam] = useState(false)
  const [newTeamName, setNewTeamName] = useState('')
  const [creatingTeam, setCreatingTeam] = useState(false)
  const [joiningTeamId, setJoiningTeamId] = useState<string | null>(null)
  const [teamError, setTeamError] = useState<string | null>(null)

  // Submissions tab
  const [submissions, setSubmissions] = useState<ChallengeSubmission[]>([])
  const [loadingSubmissions, setLoadingSubmissions] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)

  // Submission form
  const [submitTitle, setSubmitTitle] = useState('')
  const [submitAbstract, setSubmitAbstract] = useState('')
  const [submitUrl, setSubmitUrl] = useState('')
  const [submitNotes, setSubmitNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const [{ data: { user } }, { data: challengeData }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from('challenges').select('*').eq('id', challengeId).single(),
      ])

      setCurrentUserId(user?.id || null)
      setChallenge(challengeData)

      if (user) {
        const { data: prof } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
        setIsAdmin(prof?.is_admin || false)

        if (challengeData) {
          const { data: existing } = await supabase
            .from('challenge_submissions')
            .select('id')
            .eq('challenge_id', challengeId)
            .eq('author_id', user.id)
            .maybeSingle()
          setHasSubmitted(!!existing)
        }
      }
      setLoading(false)
    }
    load()
  }, [challengeId])

  useEffect(() => {
    if (activeTab === 'teams' && teams.length === 0 && !loadingTeams) {
      loadTeams()
    }
    if (activeTab === 'submissions' && submissions.length === 0 && !loadingSubmissions) {
      loadSubmissions()
    }
  }, [activeTab])

  async function loadTeams() {
    setLoadingTeams(true)
    const [allTeams, userTeam] = await Promise.all([
      getChallengeTeams(challengeId),
      getUserTeamForChallenge(challengeId),
    ])
    setTeams(allTeams)
    setMyTeam(userTeam)
    setLoadingTeams(false)
  }

  async function loadSubmissions() {
    setLoadingSubmissions(true)
    const subs = await getChallengeSubmissions(challengeId)
    setSubmissions(subs)
    setLoadingSubmissions(false)
  }

  async function handleCreateTeam() {
    if (!newTeamName.trim()) return
    setCreatingTeam(true)
    setTeamError(null)
    const result = await createChallengeTeam({ challengeId, name: newTeamName.trim() })
    if (result.success) {
      setNewTeamName('')
      setShowCreateTeam(false)
      await loadTeams()
    } else {
      setTeamError(result.error || 'Failed to create team')
    }
    setCreatingTeam(false)
  }

  async function handleJoinTeam(teamId: string) {
    setJoiningTeamId(teamId)
    setTeamError(null)
    const result = await joinChallengeTeam(teamId)
    if (result.success) {
      await loadTeams()
    } else {
      setTeamError(result.error || 'Failed to join team')
    }
    setJoiningTeamId(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitTitle.trim().length < 5) { setSubmitError('Title is too short.'); return }
    if (submitAbstract.trim().length < 100) { setSubmitError('Abstract must be at least 100 characters.'); return }
    if (!currentUserId || !challenge) return

    setSubmitting(true)
    setSubmitError(null)

    const result = await submitToChallenge({
      challengeId: challenge.id,
      title: submitTitle,
      abstract: submitAbstract,
      teamId: myTeam?.id,
      submissionUrl: submitUrl || undefined,
      additionalNotes: submitNotes || undefined,
    })

    if (result.error) {
      setSubmitError(result.error)
      setSubmitting(false)
      return
    }

    setHasSubmitted(true)
    setChallenge(c => c ? { ...c, submission_count: c.submission_count + 1 } : c)
    setSubmitting(false)
    celebrateMilestone()
  }

  if (loading) {
    return <div className="max-w-4xl mx-auto px-4 py-8"><ListPageSkeleton type="card" count={3} /></div>
  }

  if (!challenge) {
    return <div className="max-w-4xl mx-auto px-4 py-8 text-center text-muted-foreground">Challenge not found.</div>
  }

  const isOpen = challenge.status === 'open' &&
    (!challenge.submission_deadline || !isPast(new Date(challenge.submission_deadline)))
  const isTeamChallenge = (challenge.max_team_size || 1) > 1
  const deadlinePast = challenge.submission_deadline ? isPast(new Date(challenge.submission_deadline)) : false

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Back */}
      <button
        onClick={() => router.push('/challenges')}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        All Challenges
      </button>

      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={`text-xs capitalize ${STATUS_COLORS[challenge.status] || ''}`}>
            {challenge.status}
          </Badge>
          <Badge variant="outline" className={`text-xs capitalize ${DIFFICULTY_COLORS[challenge.difficulty] || ''}`}>
            {challenge.difficulty}
          </Badge>
          {challenge.featured_in_showcase && (
            <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-400 border-amber-500/20">
              <Star className="w-3 h-3 mr-1" /> Featured
            </Badge>
          )}
        </div>
        <h1 className="text-2xl font-bold font-heading">{challenge.title}</h1>

        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-primary font-semibold">+{challenge.akili_reward}</span> Akili on submission
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            {challenge.submission_count} submissions
          </span>
          {isTeamChallenge && (
            <span className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-blue-400" />
              Teams of {challenge.min_team_size}–{challenge.max_team_size}
            </span>
          )}
          {challenge.submission_deadline && (
            <span className={`flex items-center gap-1.5 ${deadlinePast ? 'text-red-400' : ''}`}>
              <Calendar className="w-4 h-4" />
              Deadline: {format(new Date(challenge.submission_deadline), 'MMM d, yyyy')}
            </span>
          )}
        </div>

        {challenge.research_areas && challenge.research_areas.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {challenge.research_areas.map(area => (
              <span key={area} className="text-xs bg-muted/50 text-muted-foreground px-2.5 py-1 rounded-full">{area}</span>
            ))}
          </div>
        )}
      </div>

      {/* Prize */}
      {challenge.prize_description && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-primary/30 bg-primary/5">
          <Trophy className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm mb-0.5">Prize</p>
            <p className="text-sm text-muted-foreground">{challenge.prize_description}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {(['overview', 'teams', 'submissions'] as Tab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab}
            {tab === 'teams' && teams.length > 0 && (
              <span className="ml-1.5 text-xs bg-muted px-1.5 py-0.5 rounded-full">{teams.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {(challenge.full_description || challenge.description) && (
            <Card>
              <CardHeader><CardTitle className="text-base">About This Challenge</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {challenge.full_description || challenge.description}
                </p>
              </CardContent>
            </Card>
          )}

          {challenge.evaluation_criteria && (
            <Card>
              <CardHeader><CardTitle className="text-base">Evaluation Criteria</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{challenge.evaluation_criteria}</p>
              </CardContent>
            </Card>
          )}

          {/* Submission form */}
          <Card>
            <CardHeader><CardTitle className="text-base">Your Submission</CardTitle></CardHeader>
            <CardContent>
              {hasSubmitted ? (
                <div className="text-center py-6 space-y-2">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                  <p className="font-semibold">Submission received!</p>
                  <p className="text-sm text-muted-foreground">
                    You&apos;ve earned <span className="text-primary font-medium">+{challenge.akili_reward} Akili points</span>. Good luck!
                  </p>
                </div>
              ) : !isOpen ? (
                <div className="text-center py-6 text-muted-foreground">
                  <p className="text-sm">Submissions are {challenge.status === 'judging' ? 'under review' : 'closed'}.</p>
                </div>
              ) : !currentUserId ? (
                <div className="text-center py-6 text-muted-foreground">
                  <p className="text-sm">Please log in to submit.</p>
                </div>
              ) : isTeamChallenge && !myTeam ? (
                <div className="text-center py-6 space-y-3 text-muted-foreground">
                  <Users className="w-8 h-8 mx-auto opacity-40" />
                  <p className="text-sm">This is a team challenge. Join or create a team in the <strong>Teams</strong> tab first.</p>
                  <Button variant="outline" size="sm" onClick={() => setActiveTab('teams')}>
                    Browse Teams
                  </Button>
                </div>
              ) : (
                <>
                  {myTeam && (
                    <div className="mb-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm text-blue-400">
                      Submitting as team: <strong>{myTeam.name}</strong>
                    </div>
                  )}
                  {submitError && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertDescription>{submitError}</AlertDescription>
                    </Alert>
                  )}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Submission Title *</label>
                      <input
                        className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="e.g., Novel Framework for Adaptive Climate Modeling"
                        value={submitTitle}
                        onChange={e => setSubmitTitle(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">
                        Abstract * <span className="text-muted-foreground text-xs">(min 100 chars)</span>
                      </label>
                      <textarea
                        className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y min-h-[120px]"
                        placeholder="Describe your research approach, methodology, and expected impact..."
                        value={submitAbstract}
                        onChange={e => setSubmitAbstract(e.target.value)}
                        maxLength={5000}
                      />
                      <p className="text-xs text-muted-foreground text-right">{submitAbstract.length}/5000</p>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Submission URL <span className="text-muted-foreground text-xs">(optional)</span></label>
                      <input
                        className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="https://drive.google.com/... or https://github.com/..."
                        type="url"
                        value={submitUrl}
                        onChange={e => setSubmitUrl(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Additional Notes <span className="text-muted-foreground text-xs">(optional)</span></label>
                      <textarea
                        className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y min-h-[72px]"
                        placeholder="Any additional context..."
                        value={submitNotes}
                        onChange={e => setSubmitNotes(e.target.value)}
                        maxLength={1000}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        Earn <span className="text-primary font-medium">+{challenge.akili_reward} Akili points</span> on submission
                      </p>
                      <Button type="submit" disabled={submitting}>
                        {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</> : 'Submit Entry'}
                      </Button>
                    </div>
                  </form>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TEAMS TAB */}
      {activeTab === 'teams' && (
        <div className="space-y-4">
          {loadingTeams ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <>
              {teamError && (
                <Alert variant="destructive">
                  <AlertDescription>{teamError}</AlertDescription>
                </Alert>
              )}

              {myTeam && (
                <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/5">
                  <p className="text-xs text-blue-400 font-semibold mb-2 uppercase tracking-wide">Your Team</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{myTeam.name}</p>
                      <p className="text-sm text-muted-foreground">{myTeam.member_count} member{myTeam.member_count !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="flex gap-1">
                      {myTeam.members?.map(m => (
                        <Avatar key={m.user_id} className="h-7 w-7">
                          <AvatarImage src={m.profile.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">{m.profile.full_name?.charAt(0) || '?'}</AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {!myTeam && isOpen && currentUserId && (
                <div>
                  {showCreateTeam ? (
                    <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
                      <p className="text-sm font-medium">Create a New Team</p>
                      <input
                        className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="Team name, e.g. Climate Warriors"
                        value={newTeamName}
                        onChange={e => setNewTeamName(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => { setShowCreateTeam(false); setNewTeamName('') }}>Cancel</Button>
                        <Button size="sm" disabled={!newTeamName.trim() || creatingTeam} onClick={handleCreateTeam}>
                          {creatingTeam ? 'Creating...' : 'Create'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button size="sm" onClick={() => setShowCreateTeam(true)}>
                      <Users className="w-4 h-4 mr-1.5" /> Create Team
                    </Button>
                  )}
                </div>
              )}

              {teams.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No teams yet. Be the first to form one!</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {teams.map(team => {
                    const isMyTeam = myTeam?.id === team.id
                    const isFull = challenge.max_team_size ? (team.member_count || 0) >= challenge.max_team_size : false
                    return (
                      <div key={team.id} className={`p-4 rounded-xl border ${isMyTeam ? 'border-blue-500/30 bg-blue-500/5' : 'border-border'}`}>
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium truncate">{team.name}</p>
                              {!team.is_open && <span className="text-xs text-muted-foreground">(closed)</span>}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {team.member_count}/{challenge.max_team_size || '?'} members
                            </p>
                            <div className="flex gap-1 mt-2">
                              {team.members?.map(m => (
                                <Avatar key={m.user_id} className="h-6 w-6">
                                  <AvatarImage src={m.profile.avatar_url || undefined} />
                                  <AvatarFallback className="text-xs">{m.profile.full_name?.charAt(0) || '?'}</AvatarFallback>
                                </Avatar>
                              ))}
                            </div>
                          </div>
                          {!myTeam && isOpen && currentUserId && team.is_open && !isFull && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={joiningTeamId === team.id}
                              onClick={() => handleJoinTeam(team.id)}
                            >
                              {joiningTeamId === team.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Join'}
                            </Button>
                          )}
                          {isFull && !isMyTeam && (
                            <span className="text-xs text-muted-foreground">Full</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* SUBMISSIONS TAB */}
      {activeTab === 'submissions' && (
        <div className="space-y-4">
          {loadingSubmissions ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No submissions yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {submissions.map((sub, idx) => (
                <div
                  key={sub.id}
                  className={`p-4 rounded-xl border ${sub.is_winner ? 'border-amber-500/40 bg-amber-500/5' : 'border-border'}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-sm font-bold text-muted-foreground w-6 flex-shrink-0 pt-0.5">#{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          {sub.is_winner && (
                            <div className="mb-1">
                              <WinnerBadge status="winner" size="sm" />
                            </div>
                          )}
                          <p className="font-medium text-sm">{sub.title || 'Untitled Submission'}</p>
                          {sub.team && <p className="text-xs text-blue-400 mt-0.5">Team: {sub.team.name}</p>}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {sub.total_score !== null && (
                            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-full">
                              {sub.total_score.toFixed(1)} pts
                            </span>
                          )}
                          {sub.submission_url && (
                            <a href={sub.submission_url} target="_blank" rel="noopener noreferrer">
                              <Button size="sm" variant="outline" className="h-7 px-2">
                                <ExternalLink className="w-3 h-3" />
                              </Button>
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={sub.author?.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">{sub.author?.full_name?.charAt(0) || '?'}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground">{sub.author?.full_name || 'Anonymous'}</span>
                        {sub.author?.university_name && (
                          <span className="text-xs text-muted-foreground">· {sub.author.university_name}</span>
                        )}
                      </div>
                      {sub.abstract && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{sub.abstract}</p>
                      )}
                      {sub.judge_notes && (
                        <div className="mt-2 p-2 rounded bg-muted/30 border border-border">
                          <p className="text-xs text-muted-foreground italic">&quot;{sub.judge_notes}&quot;</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
