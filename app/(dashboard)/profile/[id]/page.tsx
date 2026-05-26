'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  ArrowLeft,
  MessageSquare,
  UserPlus,
  GraduationCap,
  Building2,
  Shield,
  Code,
  Share2,
  Check,
} from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { shareContent } from '@/lib/utils/share'
import { ProfileBackground } from '@/components/profile/ProfileBackground'
import { BookmarkButton } from '@/components/ui/bookmark-button'
import { FollowButton } from '@/components/ui/follow-button'
import { BaobabLoader } from '@/components/ui/baobab-loader'

export default function PublicProfilePage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string
  const [profile, setProfile] = useState<any>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionSent, setConnectionSent] = useState(false)
  const [mentorVerified, setMentorVerified] = useState(false)
  const [profileShareCopied, setProfileShareCopied] = useState(false)
  const supabase = createClient()

  const ACADEMIC_LEVEL_LABELS: Record<string, string> = {
    undergraduate: 'Undergraduate', masters: 'Masters Student',
    phd: 'PhD Candidate', postdoc: 'Postdoctoral', faculty: 'Faculty',
  }
  const STATUS_ROLES = ['student_researcher', 'collaborator']
  const PERMISSION_ROLES = ['admin', 'mentor', 'technical_expert']

  useEffect(() => {
    loadProfile()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  async function loadProfile() {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (user) setCurrentUserId(user.id)

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (!data) {
      router.push('/dashboard')
      return
    }

    // Resolve university UUID to name
    let universityName = data.university_id || ''
    if (data.university_id?.includes('-') && data.university_id?.length === 36) {
      const { data: uni } = await supabase
        .from('universities')
        .select('name')
        .eq('id', data.university_id)
        .single()
      universityName = uni?.name || ''
    }

    setProfile({ ...data, universityName })

    // Check mentor verified status
    const { data: mentorProfile } = await supabase
      .from('mentor_profiles')
      .select('is_verified')
      .eq('user_id', userId)
      .maybeSingle()
    setMentorVerified(mentorProfile?.is_verified === true)

    // Increment profile views
    supabase
      .from('profiles')
      .update({ portfolio_views: (data.portfolio_views || 0) + 1 })
      .eq('id', userId)
      .then(() => {})

    // Check connection status
    if (user) {
      const { data: conn } = await supabase
        .from('connections')
        .select('id, status')
        .or(
          `and(requester_id.eq.${user.id},recipient_id.eq.${userId}),` +
          `and(requester_id.eq.${userId},recipient_id.eq.${user.id})`
        )
        .maybeSingle()

      if (conn?.status === 'accepted') setIsConnected(true)
      else if (conn?.status === 'pending') setConnectionSent(true)
    }

    setLoading(false)
  }

  async function handleConnect() {
    if (!currentUserId) return
    const { error } = await supabase.from('connections').insert({
      requester_id: currentUserId,
      recipient_id: userId,
      status: 'pending',
      connection_type: 'collaboration',
    })
    if (!error) {
      setConnectionSent(true)
      // Notify recipient
      supabase.from('notifications').insert({
        user_id: userId,
        type: 'connection_request',
        title: 'New connection request',
        message: 'Someone wants to connect with you.',
        link: '/network',
        is_read: false,
      }).then(() => {})
    }
  }

  function getAkiliTitle(score: number) {
    if (score >= 20000) return 'Research Champion'
    if (score >= 12000) return 'Research Expert'
    if (score >= 8000) return 'Research Leader'
    if (score >= 5000) return 'Research Builder'
    if (score >= 2500) return 'Collaborative Researcher'
    if (score >= 1000) return 'Active Contributor'
    return 'Emerging Researcher'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <BaobabLoader size="md" />
      </div>
    )
  }

  if (!profile) return null

  const isOwnProfile = currentUserId === userId

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      {/* Back button */}
      <Button variant="ghost" size="icon" onClick={() => router.back()}>
        <ArrowLeft className="h-5 w-5" />
      </Button>

      {/* Profile Header */}
      <Card className="overflow-hidden border-primary/20 shadow-[0_0_40px_rgba(124,58,237,0.15),0_0_80px_rgba(124,58,237,0.05)]">
        {/* Animated canvas banner */}
        <div className="relative h-52 overflow-hidden" style={{ background: '#05010F' }}>
          <ProfileBackground
            backgroundStyle={profile.profile_background ?? 'baobab'}
            interests={profile.research_interests?.length > 0
              ? (profile.research_interests as string[]).map((n: string, _: number, a: string[]) => ({ name: n, weight: 1 / a.length }))
              : [{ name: 'Research', weight: 1 }]}
            akiliScore={profile.akili_score ?? 0}
            dimensions={{
              knowledge:     profile.akili_dimension_knowledge     ?? 0,
              collaboration: profile.akili_dimension_collaboration ?? 0,
              mentorship:    profile.akili_dimension_mentorship    ?? 0,
              technical:     profile.akili_dimension_technical     ?? 0,
            }}
            collaborationCount={profile.connections_count ?? 0}
          />
          {/* Gradient fade at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none z-10"
            style={{ background: 'linear-gradient(to bottom, transparent, rgba(9,6,19,0.95))' }} />
        </div>
        <CardContent className="relative p-6">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <Avatar className="w-20 h-20 border-2 border-primary/20">
              <AvatarImage src={profile.avatar_url} />
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                {profile.full_name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold">{profile.full_name}</h1>
                  <div className="flex items-center gap-1">
                    {profile.is_admin && (
                      <div title="Platform Admin" className="w-5 h-5 rounded-full bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center">
                        <Shield className="w-3 h-3 text-yellow-500" />
                      </div>
                    )}
                    {profile.roles?.includes('mentor') && mentorVerified && (
                      <div title="Verified Mentor" className="w-5 h-5 rounded-full bg-teal-500/20 border border-teal-500/40 flex items-center justify-center">
                        <GraduationCap className="w-3 h-3 text-teal-400" />
                      </div>
                    )}
                    {profile.roles?.includes('technical_expert') && (
                      <div title="Technical Expert" className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center">
                        <Code className="w-3 h-3 text-blue-400" />
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-muted-foreground flex items-center gap-2 mt-1">
                  <GraduationCap className="w-4 h-4" />
                  {ACADEMIC_LEVEL_LABELS[profile.academic_level] || profile.academic_level?.replace(/_/g, ' ')}
                  {profile.department && ` · ${profile.department}`}
                </p>
                {profile.universityName && (
                  <p className="text-muted-foreground flex items-center gap-2 mt-1">
                    <Building2 className="w-4 h-4" />
                    {profile.universityName}
                  </p>
                )}
                {/* Status badge pills */}
                {(profile.academic_level || profile.roles?.some((r: string) => STATUS_ROLES.includes(r))) && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {profile.academic_level && (
                      <span className="bg-primary/15 text-primary border border-primary/20 rounded-full px-3 py-1 text-xs font-medium">
                        {ACADEMIC_LEVEL_LABELS[profile.academic_level] || profile.academic_level}
                      </span>
                    )}
                    {profile.roles?.filter((r: string) => STATUS_ROLES.includes(r)).map((role: string) => (
                      <span key={role} className="bg-primary/15 text-primary border border-primary/20 rounded-full px-3 py-1 text-xs font-medium">
                        {role === 'student_researcher' ? 'Student Researcher' : role.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Trajectory block */}
              <div className="flex flex-wrap gap-2">
                {(profile.current_focus || profile.research_interests?.[0]) && (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-primary/80">Investigating:</span>
                    <span className="font-semibold text-foreground">
                      {profile.current_focus || profile.research_interests[0]}
                    </span>
                  </div>
                )}
                {profile.updated_at && (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted border border-border text-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <span className="text-muted-foreground">
                      Active {formatDistanceToNow(new Date(profile.updated_at), { addSuffix: true })}
                    </span>
                  </div>
                )}
              </div>

              {profile.bio && (
                <p className="text-muted-foreground text-sm leading-relaxed">{profile.bio}</p>
              )}

              {/* Akili Score */}
              {(profile.akili_score || 0) > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-primary">{profile.akili_score}</span>
                  <div>
                    <p className="text-xs font-bold text-primary">AKILI</p>
                    <p className="text-xs text-muted-foreground">{getAkiliTitle(profile.akili_score)}</p>
                  </div>
                </div>
              )}

              {/* Follower / following counts */}
              <div className="flex gap-4 text-sm">
                <button className="hover:text-primary transition-colors">
                  <span className="font-bold">{profile.followers_count || 0}</span>
                  <span className="text-muted-foreground ml-1">Followers</span>
                </button>
                <button className="hover:text-primary transition-colors">
                  <span className="font-bold">{profile.following_count || 0}</span>
                  <span className="text-muted-foreground ml-1">Following</span>
                </button>
              </div>

              {/* Action buttons */}
              {!isOwnProfile && currentUserId && (
                <div className="flex gap-2 flex-wrap pt-2 items-center">
                  {isConnected ? (
                    <Badge variant="secondary">✓ Connected</Badge>
                  ) : connectionSent ? (
                    <Badge variant="outline">Request Sent</Badge>
                  ) : (
                    <Button size="sm" onClick={handleConnect}>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Connect
                    </Button>
                  )}
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/messages?user=${userId}`}>
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Message
                    </Link>
                  </Button>
                  <FollowButton targetUserId={userId} />
                  <BookmarkButton contentType="profile" contentId={userId} />
                </div>
              )}

              {isOwnProfile && (
                <div className="flex gap-2 pt-2 flex-wrap">
                  <Button size="sm" variant="outline" asChild>
                    <Link href="/profile">Edit Profile</Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      const result = await shareContent({
                        title: `${profile?.full_name} on ResearchFlow`,
                        text: `Check out ${profile?.full_name}'s research profile on ResearchFlow.`,
                        url: `https://researchflowafrica.com/researcher/${userId}`,
                      })
                      if (result.method === 'clipboard' && result.success) {
                        setProfileShareCopied(true)
                        setTimeout(() => setProfileShareCopied(false), 2000)
                      }
                    }}
                    className="gap-2"
                  >
                    {profileShareCopied ? <Check className="w-4 h-4 text-green-400" /> : <Share2 className="w-4 h-4" />}
                    {profileShareCopied ? 'Link Copied!' : 'Share Profile'}
                  </Button>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="flex sm:flex-col gap-4 text-center">
              <div>
                <p className="text-xl font-bold text-primary">{profile.projects_completed || 0}</p>
                <p className="text-xs text-muted-foreground">Projects</p>
              </div>
              <div>
                <p className="text-xl font-bold">{profile.connections_count || 0}</p>
                <p className="text-xs text-muted-foreground">Connections</p>
              </div>
              <div>
                <p className="text-xl font-bold">{profile.portfolio_views || 0}</p>
                <p className="text-xs text-muted-foreground">Views</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skills */}
      {profile.skills?.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Skills</p>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((s: string) => (
                  <span key={s} className="bg-primary/10 text-primary border border-primary/20 rounded-full px-3 py-1 text-xs font-medium">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Research Interests */}
      {profile.research_interests?.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Research Interests</p>
              <div className="flex flex-wrap gap-2">
                {profile.research_interests.map((r: string) => (
                  <span key={r} className="border border-violet-500 bg-transparent text-violet-400 rounded-full px-3 py-1 text-xs font-medium hover:bg-violet-500/10 transition-colors">
                    {r}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Looking For */}
      {profile.looking_for?.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Looking For</p>
              <div className="flex flex-wrap gap-2">
                {profile.looking_for.map((item: string) => (
                  <span key={item} className="border border-teal-500/50 bg-transparent text-teal-400 rounded-full px-3 py-1 text-xs font-medium hover:bg-teal-500/10 transition-colors">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
