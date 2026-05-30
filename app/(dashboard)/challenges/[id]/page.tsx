'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  ArrowLeft, Trophy, Calendar, Users, Zap, CheckCircle, Loader2,
} from 'lucide-react'
import { format, isPast } from 'date-fns'
import { celebrateMilestone } from '@/lib/utils/confetti'
import { ListPageSkeleton } from '@/components/ui/skeleton-screens'

interface Challenge {
  id: string
  title: string
  description: string | null
  full_description: string | null
  difficulty: string
  status: string
  submission_deadline: string | null
  prize_description: string | null
  akili_reward: number
  submission_count: number
  evaluation_criteria: string | null
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

export default function ChallengeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [loading, setLoading] = useState(true)
  const [abstract, setAbstract] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const [{ data: { user } }, { data: challengeData }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from('challenges').select('*').eq('id', params.id).single(),
      ])

      setCurrentUserId(user?.id || null)
      setChallenge(challengeData)

      // Check if user already submitted
      if (user && challengeData) {
        const { data: existing } = await supabase
          .from('challenge_submissions')
          .select('id')
          .eq('challenge_id', params.id)
          .eq('author_id', user.id)
          .maybeSingle()
        setSubmitted(!!existing)
      }

      setLoading(false)
    }
    load()
  }, [params.id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (abstract.trim().length < 100) {
      setError('Abstract must be at least 100 characters.')
      return
    }
    if (!currentUserId || !challenge) return

    setSubmitting(true)
    setError(null)

    const { error: insertError } = await supabase
      .from('challenge_submissions')
      .insert({
        challenge_id: challenge.id,
        author_id: currentUserId,
        abstract: abstract.trim(),
        status: 'submitted',
      })

    if (insertError) {
      setError(insertError.message)
      setSubmitting(false)
      return
    }

    await supabase
      .from('challenges')
      .update({ submission_count: challenge.submission_count + 1 })
      .eq('id', challenge.id)

    await supabase.from('akili_score_events').insert({
      user_id: currentUserId,
      event_type: 'challenge_submitted',
      points_earned: challenge.akili_reward,
      dimension: 'impact',
      description: `Submitted to challenge: ${challenge.title.slice(0, 60)}`,
    })

    setSubmitted(true)
    setChallenge(c => c ? { ...c, submission_count: c.submission_count + 1 } : c)
    setSubmitting(false)
    celebrateMilestone()
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <ListPageSkeleton type="card" count={3} />
      </div>
    )
  }

  if (!challenge) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 text-center text-muted-foreground">
        Challenge not found.
      </div>
    )
  }

  const isOpen = challenge.status === 'open' &&
    (!challenge.submission_deadline || !isPast(new Date(challenge.submission_deadline)))

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
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
        </div>
        <h1 className="text-2xl font-bold font-heading">{challenge.title}</h1>

        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-primary font-semibold">+{challenge.akili_reward}</span> Akili points on submission
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            {challenge.submission_count} submissions
          </span>
          {challenge.submission_deadline && (
            <span className={`flex items-center gap-1.5 ${isPast(new Date(challenge.submission_deadline)) ? 'text-red-400' : ''}`}>
              <Calendar className="w-4 h-4" />
              Deadline: {format(new Date(challenge.submission_deadline), 'MMMM d, yyyy')}
            </span>
          )}
        </div>

        {challenge.research_areas && challenge.research_areas.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {challenge.research_areas.map(area => (
              <span key={area} className="text-xs bg-muted/50 text-muted-foreground px-2.5 py-1 rounded-full">
                {area}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Description */}
      {(challenge.full_description || challenge.description) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">About This Challenge</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {challenge.full_description || challenge.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Prize */}
      {challenge.prize_description && (
        <Card className="border-primary/30">
          <CardContent className="p-4 flex items-start gap-3">
            <Trophy className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm mb-1">Prize</p>
              <p className="text-sm text-muted-foreground">{challenge.prize_description}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Evaluation Criteria */}
      {challenge.evaluation_criteria && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Evaluation Criteria</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{challenge.evaluation_criteria}</p>
          </CardContent>
        </Card>
      )}

      {/* Submission form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your Submission</CardTitle>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="text-center py-6 space-y-2">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
              <p className="font-semibold">Submission received!</p>
              <p className="text-sm text-muted-foreground">
                You&apos;ve earned <span className="text-primary font-medium">+{challenge.akili_reward} Akili points</span>. Good luck!
              </p>
            </div>
          ) : !isOpen ? (
            <div className="text-center py-6 text-muted-foreground">
              <p className="text-sm">Submissions for this challenge are {challenge.status === 'judging' ? 'under review' : 'closed'}.</p>
            </div>
          ) : !currentUserId ? (
            <div className="text-center py-6 text-muted-foreground">
              <p className="text-sm">Please log in to submit.</p>
            </div>
          ) : (
            <>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="abstract">
                    Research Abstract <span className="text-muted-foreground text-xs">(min. 100 characters)</span>
                  </Label>
                  <Textarea
                    id="abstract"
                    value={abstract}
                    onChange={e => setAbstract(e.target.value)}
                    placeholder="Describe your research approach, methodology, and preliminary findings or proposal..."
                    rows={8}
                    maxLength={5000}
                  />
                  <p className="text-xs text-muted-foreground text-right">{abstract.length}/5000</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Earn <span className="text-primary font-medium">+{challenge.akili_reward} Akili points</span> upon submission
                  </p>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</>
                    ) : (
                      'Submit Entry'
                    )}
                  </Button>
                </div>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
