'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SubmissionForm } from '@/components/challenges/SubmissionForm'
import { TeamFormModal } from '@/components/challenges/TeamFormModal'
import { WinnerBadge } from '@/components/challenges/WinnerBadge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Trophy, Users, Calendar, Clock, AlertCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Challenge {
  id: string
  title: string
  description: string
  research_area: string
  prize_description: string
  prize_type: string
  status: string
  max_team_size: number
  min_team_size: number
  submission_deadline: string
  judging_criteria: any
  total_submissions: number
}

interface Team {
  id: string
  name: string
  created_at: string
  challenge_team_members: any[]
}

interface Submission {
  id: string
  title: string
  status: string
  overall_score: number
  submitted_at: string
  profiles: any
}

export default function ChallengeDetailPage() {
  const params = useParams()
  const challengeId = params.challengeId as string
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [showTeamModal, setShowTeamModal] = useState(false)
  const [userTeamId, setUserTeamId] = useState<string | null>(null)
  const [userSubmitted, setUserSubmitted] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    loadChallenge()
  }, [])

  async function loadChallenge() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      const { data: challengeData } = await supabase
        .from('challenges')
        .select('*')
        .eq('id', challengeId)
        .single()

      const { data: teamsData } = await supabase
        .from('challenge_teams')
        .select(`
          id, name, created_at,
          challenge_team_members (
            user_id, role,
            profiles (id, full_name, avatar_url)
          )
        `)
        .eq('challenge_id', challengeId)

      const { data: winnersData } = await supabase
        .from('challenge_submissions')
        .select(`
          id, title, status, overall_score, submitted_at,
          profiles!challenge_submissions_submitter_id_fkey (
            id, full_name, avatar_url, university_id
          )
        `)
        .eq('challenge_id', challengeId)
        .in('status', ['winner', 'runner_up'])
        .order('overall_score', { ascending: false })

      setChallenge(challengeData)
      setTeams(teamsData || [])
      setSubmissions(winnersData || [])

      // Check if user is in a team
      if (user && teamsData) {
        const userTeam = teamsData.find(t =>
          t.challenge_team_members?.some((m: any) => m.user_id === user.id)
        )
        setUserTeamId(userTeam?.id || null)
      }

      // Check if user has submitted
      if (user) {
        const { data: submission } = await supabase
          .from('challenge_submissions')
          .select('id')
          .eq('challenge_id', challengeId)
          .eq('submitter_id', user.id)
          .maybeSingle()
        setUserSubmitted(!!submission)
      }
    } catch (error) {
      console.error('Error loading challenge:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>
  }

  if (!challenge) {
    return <div className="p-8 text-center text-red-400">Challenge not found</div>
  }

  const daysUntilDeadline = challenge.submission_deadline
    ? Math.ceil(
        (new Date(challenge.submission_deadline).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null
  const isDeadlineUrgent = daysUntilDeadline !== null && daysUntilDeadline <= 3 && daysUntilDeadline > 0

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-purple-400" />
              <h1 className="text-3xl font-bold">{challenge.title}</h1>
            </div>
            <p className="text-muted-foreground">{challenge.description}</p>
          </div>
          <Badge
            variant={
              challenge.status === 'open'
                ? 'default'
                : challenge.status === 'completed'
                ? 'secondary'
                : 'outline'
            }
            className="h-fit"
          >
            {challenge.status.charAt(0).toUpperCase() + challenge.status.slice(1)}
          </Badge>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-xs text-muted-foreground">Teams Formed</p>
                  <p className="text-2xl font-bold">{teams.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Trophy className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-xs text-muted-foreground">Submissions</p>
                  <p className="text-2xl font-bold">{challenge.total_submissions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          {challenge.submission_deadline && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Clock className={`w-5 h-5 ${isDeadlineUrgent ? 'text-red-400' : 'text-yellow-400'}`} />
                  <div>
                    <p className="text-xs text-muted-foreground">Closes In</p>
                    <p className={`text-2xl font-bold ${isDeadlineUrgent ? 'text-red-400' : ''}`}>
                      {daysUntilDeadline && daysUntilDeadline > 0 ? `${daysUntilDeadline}d` : 'Expired'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-purple-400" />
                <div>
                  <p className="text-xs text-muted-foreground">Posted</p>
                  <p className="text-sm font-semibold">
                    {formatDistanceToNow(new Date(challenge.submission_deadline), {
                      addSuffix: false,
                    })} ago
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="teams">Teams ({teams.length})</TabsTrigger>
          {challenge.status === 'judging' || challenge.status === 'completed' ? (
            <TabsTrigger value="winners">Winners</TabsTrigger>
          ) : (
            <TabsTrigger value="submit">Submit</TabsTrigger>
          )}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Prize</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg">{challenge.prize_description}</p>
            </CardContent>
          </Card>

          {challenge.judging_criteria && (
            <Card>
              <CardHeader>
                <CardTitle>Judging Criteria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {challenge.judging_criteria.criteria?.map((criterion: any) => (
                    <div key={criterion.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <span className="font-medium">{criterion.name}</span>
                      <Badge variant="outline">{criterion.weight}%</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Teams Tab */}
        <TabsContent value="teams" className="space-y-6">
          {challenge.status === 'open' && !userTeamId && (
            <Button
              onClick={() => setShowTeamModal(true)}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              <Users className="w-4 h-4 mr-2" />
              Form a Team
            </Button>
          )}

          <div className="grid gap-4">
            {teams.map(team => (
              <Card key={team.id}>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg">{team.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {team.challenge_team_members?.length || 0}/{challenge.max_team_size} members
                      </span>
                    </div>
                    <div className="flex -space-x-2">
                      {team.challenge_team_members?.map((member: any) => (
                        <Avatar key={member.user_id} className="border-2 border-background">
                          <AvatarImage src={member.profiles?.avatar_url} />
                          <AvatarFallback>{member.profiles?.full_name?.[0]}</AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Submit Tab */}
        {(challenge.status === 'open' && !userSubmitted) ? (
          <TabsContent value="submit" className="space-y-6">
            <SubmissionForm
              challengeId={challengeId}
              teamId={userTeamId || undefined}
              onSuccess={() => {
                setUserSubmitted(true)
                loadChallenge()
              }}
            />
          </TabsContent>
        ) : null}

        {/* Winners Tab */}
        {(challenge.status === 'judging' || challenge.status === 'completed') && (
          <TabsContent value="winners" className="space-y-6">
            {submissions.length > 0 ? (
              <div className="grid gap-6">
                {submissions.map((sub, idx) => (
                  <Card
                    key={sub.id}
                    className={idx === 0 ? 'border-2 border-amber-500/50 bg-amber-500/5' : ''}
                  >
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <WinnerBadge status={sub.status as any} />
                            <h3 className="text-lg font-semibold mt-2">{sub.title}</h3>
                          </div>
                          {sub.overall_score && (
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Score</p>
                              <p className="text-2xl font-bold text-purple-400">
                                {sub.overall_score}/10
                              </p>
                            </div>
                          )}
                        </div>

                        {sub.profiles && (
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                            <Avatar>
                              <AvatarImage src={sub.profiles.avatar_url} />
                              <AvatarFallback>{sub.profiles.full_name?.[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{sub.profiles.full_name}</p>
                              <p className="text-xs text-muted-foreground">
                                Submitted {formatDistanceToNow(new Date(sub.submitted_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No winners announced yet</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}
      </Tabs>

      <TeamFormModal
        isOpen={showTeamModal}
        onClose={() => setShowTeamModal(false)}
        challengeId={challengeId}
        onSuccess={() => {
          loadChallenge()
          setShowTeamModal(false)
        }}
      />
    </div>
  )
}
