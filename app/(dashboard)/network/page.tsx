'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BackToHub } from '@/components/ui/back-to-hub'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  MessageSquare,
  CheckCircle,
  XCircle,
  Loader2,
  UserPlus,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types/database'
import { EmptyState } from '@/components/ui/EmptyState'
import { connectionAccepted } from '@/lib/actions/akili'
import { ResearcherCardSkeleton } from '@/components/ui/SkeletonLayouts'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'
import { PullToRefreshIndicator } from '@/components/ui/PullToRefreshIndicator'
import { notifyConnectionAccepted } from '@/lib/actions/email'
import { toast } from 'sonner'
import { celebrateConnection } from '@/lib/utils/confetti'

interface Connection {
  id: string
  requester_id: string
  recipient_id: string
  status: string
  message: string | null
  created_at: string
  requester?: Profile
  recipient?: Profile
}

interface MatchSuggestion {
  id: string
  matched_user_id: string
  match_score: number
  matching_skills: string[]
  matching_tags: string[]
  matched_user: Profile
}

const cardStyle = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(139,92,246,0.15)',
  borderRadius: '16px',
}

function getInitials(name: string | null) {
  if (!name) return 'U'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

interface FollowedUser {
  id: string
  following_id: string
  followed_user: Profile
}

export default function NetworkPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [myNetwork, setMyNetwork] = useState<Connection[]>([])
  const [incoming, setIncoming] = useState<Connection[]>([])
  const [outgoing, setOutgoing] = useState<Connection[]>([])
  const [suggestions, setSuggestions] = useState<MatchSuggestion[]>([])
  const [following, setFollowing] = useState<FollowedUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [connectTarget, setConnectTarget] = useState<MatchSuggestion | null>(null)
  const [connectMessage, setConnectMessage] = useState('')

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    setIsLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const [networkRes, incomingRes, outgoingRes, suggestionsRes] = await Promise.all([
      supabase
        .from('connections')
        .select('*, requester:profiles!connections_requester_id_fkey(*), recipient:profiles!connections_recipient_id_fkey(*)')
        .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false }),
      supabase
        .from('connections')
        .select('*, requester:profiles!connections_requester_id_fkey(*)')
        .eq('recipient_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false }),
      supabase
        .from('connections')
        .select('*, recipient:profiles!connections_recipient_id_fkey(*)')
        .eq('requester_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false }),
      supabase
        .from('matches')
        .select('*, matched_user:profiles!matches_matched_user_id_fkey(*)')
        .eq('user_id', user.id)
        .eq('status', 'suggested')
        .order('match_score', { ascending: false })
        .limit(10),
    ])

    if (networkRes.data) setMyNetwork(networkRes.data)
    if (incomingRes.data) setIncoming(incomingRes.data)
    if (outgoingRes.data) setOutgoing(outgoingRes.data)
    if (suggestionsRes.data) setSuggestions(suggestionsRes.data as MatchSuggestion[])

    // Load following
    const { data: followingData } = await supabase
      .from('follows')
      .select('id, following_id, followed_user:profiles!follows_following_id_fkey(*)')
      .eq('follower_id', user.id)
      .order('created_at', { ascending: false })
    if (followingData) setFollowing(followingData as unknown as FollowedUser[])

    setIsLoading(false)
  }

  async function unfollowUser(followingId: string) {
    if (!userId) return
    const supabase = createClient()
    await supabase.from('follows').delete().eq('follower_id', userId).eq('following_id', followingId)
    supabase.rpc('decrement_follow_counts', { follower: userId, followed: followingId }).then(() => {})
    setFollowing(prev => prev.filter(f => f.following_id !== followingId))
  }

  async function acceptConnection(connectionId: string, requesterId: string) {
    setActionLoading(connectionId)
    const supabase = createClient()
    const { error } = await supabase
      .from('connections')
      .update({ status: 'accepted' })
      .eq('id', connectionId)

    if (!error) {
      await supabase.from('notifications').insert({
        user_id: requesterId,
        type: 'connection_accepted',
        title: 'Connection accepted',
        message: 'Your connection request was accepted.',
        link: '/network',
        is_read: false,
      })
      connectionAccepted(requesterId, userId!).catch(() => {})
      notifyConnectionAccepted(requesterId, userId!).catch(() => {})
      toast.success('Connection accepted!')
      celebrateConnection()
      loadAll()
    } else {
      toast.error('Failed to accept connection')
    }
    setActionLoading(null)
  }

  async function rejectConnection(connectionId: string) {
    setActionLoading(connectionId)
    const supabase = createClient()
    await supabase.from('connections').update({ status: 'rejected' }).eq('id', connectionId)
    toast.success('Connection declined')
    setIncoming(prev => prev.filter(c => c.id !== connectionId))
    setActionLoading(null)
  }

  async function cancelRequest(connectionId: string) {
    setActionLoading(connectionId)
    const supabase = createClient()
    await supabase.from('connections').delete().eq('id', connectionId)
    toast.success('Request cancelled')
    setOutgoing(prev => prev.filter(c => c.id !== connectionId))
    setActionLoading(null)
  }

  async function sendConnectionRequest() {
    if (!connectTarget || !userId) return
    setActionLoading('sending')
    const supabase = createClient()

    const { error } = await supabase.from('connections').insert({
      requester_id: userId,
      recipient_id: connectTarget.matched_user_id,
      status: 'pending',
      message: connectMessage.trim() || null,
      connection_type: 'collaboration',
    })

    if (!error) {
      await supabase.from('notifications').insert({
        user_id: connectTarget.matched_user_id,
        type: 'connection_request',
        title: 'New connection request',
        message: connectMessage.trim() || 'Someone wants to connect with you.',
        link: '/network',
        is_read: false,
      })

      await supabase.from('matches').update({ status: 'connected' }).eq('id', connectTarget.id)

      toast.success('Connection request sent!')
      setSuggestions(prev => prev.filter(s => s.id !== connectTarget.id))
      setConnectTarget(null)
      setConnectMessage('')
    } else {
      toast.error('Failed to send request')
    }
    setActionLoading(null)
  }

  const { pullDistance, isRefreshing, threshold } = usePullToRefresh(async () => { await loadAll() })

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-3">
        {Array.from({ length: 5 }).map((_, i) => <ResearcherCardSkeleton key={i} />)}
      </div>
    )
  }

  const pendingTotal = incoming.length + outgoing.length

  return (
    <>
    <PullToRefreshIndicator pullDistance={pullDistance} threshold={threshold} isRefreshing={isRefreshing} />
    <div className="max-w-4xl mx-auto space-y-6">
      <BackToHub href="/collaborate" label="Back to Collaborate" />
      <div>
        <h1 className="text-2xl font-bold font-heading" style={{ color: '#E2D9F3' }}>My Network</h1>
        <p className="text-sm mt-1" style={{ color: '#7C6A9C' }}>Manage your connections and discover collaborators</p>
      </div>

      <Tabs defaultValue="network">
        <TabsList style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.15)' }}>
          <TabsTrigger value="network">
            My Network <Badge className="ml-2 text-xs">{myNetwork.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="requests">
            Requests
            {pendingTotal > 0 && <Badge variant="destructive" className="ml-2 text-xs">{pendingTotal}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="suggestions">
            Suggestions <Badge className="ml-2 text-xs">{suggestions.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="following">
            Following <Badge className="ml-2 text-xs">{following.length}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* My Network */}
        <TabsContent value="network" className="mt-4 space-y-4">
          {myNetwork.length === 0 ? (
            <EmptyState
              icon={
                <svg viewBox="0 0 24 24" width="28" height="28">
                  <circle cx="5" cy="12" r="3" fill="#8B5CF6"/>
                  <circle cx="19" cy="12" r="3" fill="#A855F7"/>
                  <path d="M8 12Q12 5 16 12" stroke="#FBBF24" strokeWidth="2" fill="none" strokeLinecap="round"/>
                  <circle cx="12" cy="6" r="2" fill="#FBBF24"/>
                </svg>
              }
              title="Your research network starts with one connection"
              description="Smart Matching has already found researchers who share your interests. Say hello."
              ctaLabel="See Your Matches"
              ctaHref="/matches"
              stat="Researchers matched to your profile"
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {myNetwork.map(conn => {
                const other = conn.requester_id === userId ? conn.recipient : conn.requester
                if (!other) return null
                return (
                  <Card key={conn.id} style={cardStyle}>
                    <CardContent className="p-4 flex items-center gap-3">
                      <Link href={`/profile/${other.id}`}>
                        <Avatar className="h-12 w-12 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all">
                          <AvatarImage src={other.avatar_url || undefined} />
                          <AvatarFallback>{getInitials(other.full_name)}</AvatarFallback>
                        </Avatar>
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link href={`/profile/${other.id}`} className="hover:text-primary transition-colors">
                          <p className="font-medium truncate" style={{ color: '#E2D9F3' }}>{other.full_name}</p>
                        </Link>
                        <p className="text-xs truncate" style={{ color: '#7C6A9C' }}>{other.department || other.bio?.slice(0, 60) || 'Researcher'}</p>
                      </div>
                      <Link href={`/profile/${other.id}`}>
                        <Button variant="outline" size="sm" style={{ border: '1px solid rgba(139,92,246,0.3)', color: '#A78BFA', background: 'transparent' }}>
                          View
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* Requests */}
        <TabsContent value="requests" className="mt-4 space-y-6">
          {/* Incoming */}
          <div>
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: '#A78BFA' }}>
              <UserCheck className="h-4 w-4" />
              Incoming Requests ({incoming.length})
            </h2>
            {incoming.length === 0 ? (
              <p className="text-sm py-4" style={{ color: '#7C6A9C' }}>No pending incoming requests</p>
            ) : (
              <div className="space-y-3">
                {incoming.map(conn => {
                  const requester = conn.requester
                  if (!requester) return null
                  return (
                    <Card key={conn.id} style={cardStyle}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Link href={`/profile/${requester.id}`}>
                            <Avatar className="h-10 w-10 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all">
                              <AvatarImage src={requester.avatar_url || undefined} />
                              <AvatarFallback>{getInitials(requester.full_name)}</AvatarFallback>
                            </Avatar>
                          </Link>
                          <div className="flex-1 min-w-0">
                            <Link href={`/profile/${requester.id}`} className="hover:text-primary transition-colors">
                              <p className="font-medium" style={{ color: '#E2D9F3' }}>{requester.full_name}</p>
                            </Link>
                            <p className="text-xs" style={{ color: '#7C6A9C' }}>{requester.department || 'Researcher'}</p>
                            {conn.message && (
                              <p className="text-sm mt-2 p-2 rounded-lg" style={{ background: 'rgba(124,58,237,0.1)', color: '#C4B5FD', fontSize: '13px' }}>
                                "{conn.message}"
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            className="flex-1 gap-1"
                            style={{ background: 'linear-gradient(135deg,#7C3AED,#A855F7)', border: 'none' }}
                            disabled={actionLoading === conn.id}
                            onClick={() => acceptConnection(conn.id, conn.requester_id)}
                          >
                            {actionLoading === conn.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 gap-1"
                            style={{ border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', background: 'transparent' }}
                            disabled={actionLoading === conn.id}
                            onClick={() => rejectConnection(conn.id)}
                          >
                            <XCircle className="h-3 w-3" />
                            Decline
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>

          {/* Outgoing */}
          <div>
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: '#A78BFA' }}>
              <Clock className="h-4 w-4" />
              Sent Requests ({outgoing.length})
            </h2>
            {outgoing.length === 0 ? (
              <p className="text-sm py-4" style={{ color: '#7C6A9C' }}>No outgoing requests</p>
            ) : (
              <div className="space-y-3">
                {outgoing.map(conn => {
                  const recipient = conn.recipient
                  if (!recipient) return null
                  return (
                    <Card key={conn.id} style={cardStyle}>
                      <CardContent className="p-4 flex items-center gap-3">
                        <Link href={`/profile/${recipient.id}`}>
                          <Avatar className="h-10 w-10 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all">
                            <AvatarImage src={recipient.avatar_url || undefined} />
                            <AvatarFallback>{getInitials(recipient.full_name)}</AvatarFallback>
                          </Avatar>
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link href={`/profile/${recipient.id}`} className="hover:text-primary transition-colors">
                            <p className="font-medium" style={{ color: '#E2D9F3' }}>{recipient.full_name}</p>
                          </Link>
                          <p className="text-xs" style={{ color: '#7C6A9C' }}>Awaiting response</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          style={{ border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', background: 'transparent' }}
                          disabled={actionLoading === conn.id}
                          onClick={() => cancelRequest(conn.id)}
                        >
                          Cancel
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Suggestions */}
        <TabsContent value="suggestions" className="mt-4 space-y-4">
          {suggestions.length === 0 ? (
            <Card style={cardStyle}>
              <CardContent className="py-16 text-center">
                <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-30" style={{ color: '#7C6A9C' }} />
                <p className="font-medium" style={{ color: '#E2D9F3' }}>No suggestions yet</p>
                <p className="text-sm mt-1" style={{ color: '#7C6A9C' }}>Post a research idea or complete your profile to get matched</p>
                <div className="flex gap-3 justify-center mt-4">
                  <Link href="/ideas/new">
                    <Button size="sm" style={{ background: 'linear-gradient(135deg,#7C3AED,#A855F7)', border: 'none' }}>
                      Post an Idea
                    </Button>
                  </Link>
                  <Link href="/matches">
                    <Button size="sm" variant="outline" style={{ border: '1px solid rgba(139,92,246,0.3)', color: '#A78BFA', background: 'transparent' }}>
                      View Matches
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {suggestions.map(suggestion => {
                const person = suggestion.matched_user
                return (
                  <Card key={suggestion.id} style={cardStyle}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <Link href={`/profile/${person.id}`}>
                          <Avatar className="h-12 w-12 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all">
                            <AvatarImage src={person.avatar_url || undefined} />
                            <AvatarFallback>{getInitials(person.full_name)}</AvatarFallback>
                          </Avatar>
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link href={`/profile/${person.id}`} className="hover:text-primary transition-colors">
                            <p className="font-medium" style={{ color: '#E2D9F3' }}>{person.full_name}</p>
                          </Link>
                          <p className="text-xs" style={{ color: '#7C6A9C' }}>{person.department || 'Researcher'}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <div className="h-1.5 w-1.5 rounded-full" style={{ background: '#10B981' }} />
                            <span className="text-xs" style={{ color: '#10B981' }}>{suggestion.match_score}% match</span>
                          </div>
                        </div>
                      </div>
                      {suggestion.matching_skills?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {suggestion.matching_skills.slice(0, 4).map(skill => (
                            <Badge key={skill} className="text-xs" style={{ background: 'rgba(124,58,237,0.15)', color: '#C4B5FD', border: '1px solid rgba(124,58,237,0.25)' }}>
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1 gap-1"
                          style={{ background: 'linear-gradient(135deg,#7C3AED,#A855F7)', border: 'none', fontSize: '12px' }}
                          onClick={() => setConnectTarget(suggestion)}
                        >
                          <UserPlus className="h-3 w-3" />
                          Connect
                        </Button>
                        <Link href={`/profile/${person.id}`} className="flex-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full gap-1"
                            style={{ border: '1px solid rgba(139,92,246,0.3)', color: '#A78BFA', background: 'transparent', fontSize: '12px' }}
                          >
                            View Profile
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* Following */}
        <TabsContent value="following" className="mt-4 space-y-4">
          {following.length === 0 ? (
            <Card style={cardStyle}>
              <CardContent className="py-16 text-center">
                <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-30" style={{ color: '#7C6A9C' }} />
                <p className="font-medium" style={{ color: '#E2D9F3' }}>Not following anyone yet</p>
                <p className="text-sm mt-1" style={{ color: '#7C6A9C' }}>Visit a researcher&apos;s profile and click Follow</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {following.map(f => {
                const person = f.followed_user
                if (!person) return null
                return (
                  <Card key={f.id} style={cardStyle}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Link href={`/profile/${person.id}`}>
                          <Avatar className="h-12 w-12 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all">
                            <AvatarImage src={person.avatar_url || undefined} />
                            <AvatarFallback>{getInitials(person.full_name)}</AvatarFallback>
                          </Avatar>
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link href={`/profile/${person.id}`} className="font-medium text-sm hover:text-primary transition-colors" style={{ color: '#E2D9F3' }}>
                            {person.full_name}
                          </Link>
                          {person.department && (
                            <p className="text-xs truncate" style={{ color: '#7C6A9C' }}>{person.department}</p>
                          )}
                        </div>
                      </div>
                      {person.research_interests && person.research_interests.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {person.research_interests.slice(0, 3).map((r: string) => (
                            <Badge key={r} variant="outline" className="text-xs">{r}</Badge>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Link href={`/profile/${person.id}`} className="flex-1">
                          <Button size="sm" variant="outline" className="w-full" style={{ border: '1px solid rgba(139,92,246,0.3)', color: '#A78BFA', background: 'transparent', fontSize: '12px' }}>
                            View Profile
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => unfollowUser(f.following_id)}
                          className="text-muted-foreground hover:text-destructive text-xs"
                        >
                          Unfollow
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Connect Dialog */}
      <Dialog open={!!connectTarget} onOpenChange={(open) => { if (!open) { setConnectTarget(null); setConnectMessage('') } }}>
        <DialogContent style={{ background: 'rgba(10,5,25,0.97)', border: '1px solid rgba(139,92,246,0.2)' }}>
          <DialogHeader>
            <DialogTitle style={{ color: '#E2D9F3' }}>
              Connect with {connectTarget?.matched_user.full_name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm" style={{ color: '#7C6A9C' }}>Add a personal message (optional)</p>
            <Textarea
              placeholder="Hi! I'd love to collaborate on research..."
              value={connectMessage}
              onChange={e => setConnectMessage(e.target.value)}
              rows={3}
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.2)', color: '#E2D9F3' }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setConnectTarget(null); setConnectMessage('') }}
              style={{ border: '1px solid rgba(139,92,246,0.3)', color: '#A78BFA', background: 'transparent' }}>
              Cancel
            </Button>
            <Button
              onClick={sendConnectionRequest}
              disabled={actionLoading === 'sending'}
              style={{ background: 'linear-gradient(135deg,#7C3AED,#A855F7)', border: 'none' }}
            >
              {actionLoading === 'sending' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </>
  )
}
