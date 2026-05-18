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
} from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ProfileNeuralBg } from '@/components/ui/profile-neural-bg'

export default function PublicProfilePage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string
  const [profile, setProfile] = useState<any>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionSent, setConnectionSent] = useState(false)
  const supabase = createClient()

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
        <div className="w-10 h-10 rounded-full animate-spin border-4 border-primary border-t-transparent" />
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
      <Card className="overflow-hidden relative border-primary/20 shadow-[0_0_40px_rgba(124,58,237,0.15),0_0_80px_rgba(124,58,237,0.05)]">
        <div className="absolute inset-0" style={{ zIndex: 0 }}>
          <ProfileNeuralBg />
        </div>
        <div className="absolute inset-0 rounded-xl" style={{
          background: 'linear-gradient(135deg, rgba(5,1,15,0.85) 0%, rgba(18,8,31,0.75) 50%, rgba(5,1,15,0.85) 100%)',
          zIndex: 1,
        }} />
        <CardContent className="relative p-6" style={{ zIndex: 2 }}>
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <Avatar className="w-20 h-20 border-2 border-primary/20">
              <AvatarImage src={profile.avatar_url} />
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                {profile.full_name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-3">
              <div>
                <h1 className="text-2xl font-bold">{profile.full_name}</h1>
                <p className="text-muted-foreground flex items-center gap-2 mt-1">
                  <GraduationCap className="w-4 h-4" />
                  {profile.academic_level?.replace(/_/g, ' ')}
                  {profile.department && ` · ${profile.department}`}
                </p>
                {profile.universityName && (
                  <p className="text-muted-foreground flex items-center gap-2 mt-1">
                    <Building2 className="w-4 h-4" />
                    {profile.universityName}
                  </p>
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

              {/* Action buttons */}
              {!isOwnProfile && currentUserId && (
                <div className="flex gap-3 flex-wrap pt-2">
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
                </div>
              )}

              {isOwnProfile && (
                <Button size="sm" variant="outline" asChild>
                  <Link href="/profile">Edit Profile</Link>
                </Button>
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
            <h3 className="font-semibold mb-3">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((s: string) => (
                <Badge key={s} variant="secondary">{s}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Research Interests */}
      {profile.research_interests?.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-3">Research Interests</h3>
            <div className="flex flex-wrap gap-2">
              {profile.research_interests.map((r: string) => (
                <Badge key={r} variant="outline" className="bg-primary/5">{r}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Looking For */}
      {profile.looking_for?.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-3">Looking For</h3>
            <div className="flex flex-wrap gap-2">
              {profile.looking_for.map((item: string) => (
                <Badge key={item} variant="outline" className="bg-green-500/5 text-green-500 border-green-500/20">
                  {item}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
