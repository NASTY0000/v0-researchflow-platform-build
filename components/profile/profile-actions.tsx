'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { UserPlus, MessageSquare, Loader2, Check, FolderPlus, Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

interface ProfileActionsProps {
  targetUserId: string
  targetName: string | null
}

export function ProfileActions({ targetUserId, targetName }: ProfileActionsProps) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'pending' | 'accepted'>('none')
  const [isConnecting, setIsConnecting] = useState(false)
  const [showConnectDialog, setShowConnectDialog] = useState(false)
  const [message, setMessage] = useState('')

  // Invite to project
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [myProjects, setMyProjects] = useState<{ id: string; title: string }[]>([])
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [isInviting, setIsInviting] = useState(false)
  const [inviteSent, setInviteSent] = useState<string | null>(null) // project id that was invited to

  // Endorse
  const [isEndorsed, setIsEndorsed] = useState(false)
  const [endorsementCount, setEndorsementCount] = useState(0)
  const [isEndorsing, setIsEndorsing] = useState(false)

  useEffect(() => {
    async function init() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || user.id === targetUserId) return
      setCurrentUserId(user.id)

      // Check connection
      const { data: conn } = await supabase
        .from('connections')
        .select('status')
        .or(`and(requester_id.eq.${user.id},recipient_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},recipient_id.eq.${user.id})`)
        .limit(1)
        .maybeSingle()
      if (conn) setConnectionStatus(conn.status as 'pending' | 'accepted')

      // Check endorsement
      const { data: endorsement, error: endorseError } = await supabase
        .from('endorsements')
        .select('id')
        .eq('endorser_id', user.id)
        .eq('endorsed_id', targetUserId)
        .maybeSingle()
      if (!endorseError && endorsement) setIsEndorsed(true)

      // Count endorsements for this user
      const { count } = await supabase
        .from('endorsements')
        .select('id', { count: 'exact', head: true })
        .eq('endorsed_id', targetUserId)
      setEndorsementCount(count || 0)
    }
    init()
  }, [targetUserId])

  async function handleConnect() {
    if (!currentUserId) return
    setIsConnecting(true)
    const supabase = createClient()
    await supabase.from('connections').insert({
      requester_id: currentUserId,
      recipient_id: targetUserId,
      status: 'pending',
      message: message.trim() || null,
      connection_type: 'collaboration',
    })
    await supabase.from('notifications').insert({
      user_id: targetUserId,
      type: 'connection_request',
      title: 'New Connection Request',
      message: message.trim() || 'Someone wants to connect with you.',
      link: '/network',
      is_read: false,
    })
    setConnectionStatus('pending')
    setShowConnectDialog(false)
    setMessage('')
    setIsConnecting(false)
  }

  async function openInviteDialog() {
    setShowInviteDialog(true)
    if (myProjects.length > 0) return
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    // Get projects where current user is a team member/leader
    const { data } = await supabase
      .from('team_members')
      .select('projects!inner(id, title, status)')
      .eq('user_id', user.id)
    if (data) {
      const projects = data
        .flatMap((m: any) => Array.isArray(m.projects) ? m.projects : [m.projects])
        .filter((p: any) => p && p.status === 'active')
      setMyProjects(projects.map((p: any) => ({ id: p.id, title: p.title })))
    }
  }

  async function handleInvite() {
    if (!selectedProject || !currentUserId) return
    setIsInviting(true)
    const supabase = createClient()
    // Add directly to team
    const { data: project } = await supabase.from('projects').select('team_id, title').eq('id', selectedProject).single()
    if (project) {
      await supabase.from('team_members').upsert({
        team_id: project.team_id,
        user_id: targetUserId,
        role: 'collaborator',
      }, { onConflict: 'team_id,user_id' })
      await supabase.from('notifications').insert({
        user_id: targetUserId,
        type: 'system',
        title: 'Project Invitation',
        message: `You've been invited to join "${project.title}"`,
        link: `/projects/${selectedProject}`,
        is_read: false,
      })
    }
    setInviteSent(selectedProject)
    setIsInviting(false)
  }

  async function handleEndorse() {
    if (!currentUserId || isEndorsed) return
    setIsEndorsing(true)
    const supabase = createClient()
    const { error } = await supabase.from('endorsements').insert({
      endorser_id: currentUserId,
      endorsed_id: targetUserId,
    })
    if (!error) {
      setIsEndorsed(true)
      setEndorsementCount(c => c + 1)
    }
    setIsEndorsing(false)
  }

  if (!currentUserId) return null

  return (
    <div className="mt-4 space-y-3">
      <div className="flex gap-3 flex-wrap">
        {/* Invite to Project */}
        <Button className="flex-1 min-w-[140px]" onClick={openInviteDialog}>
          <FolderPlus className="w-4 h-4 mr-2" />
          Invite to Project
        </Button>

        {/* Endorse */}
        <Button
          variant={isEndorsed ? 'secondary' : 'outline'}
          className={`flex-1 min-w-[100px] ${isEndorsed ? 'text-yellow-600 border-yellow-500/30 bg-yellow-500/10' : ''}`}
          onClick={handleEndorse}
          disabled={isEndorsed || isEndorsing}
        >
          <Star className={`w-4 h-4 mr-2 ${isEndorsed ? 'fill-yellow-500 text-yellow-500' : ''}`} />
          {isEndorsed ? 'Endorsed ✓' : 'Endorse'}
        </Button>

        {/* Connect or Message */}
        {connectionStatus === 'accepted' ? (
          <Button variant="outline" asChild className="flex-1 min-w-[100px]">
            <Link href={`/messages?user=${targetUserId}`}>
              <MessageSquare className="w-4 h-4 mr-2" />
              Message
            </Link>
          </Button>
        ) : connectionStatus === 'pending' ? (
          <Button variant="outline" disabled className="flex-1 min-w-[100px]">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Request Sent
          </Button>
        ) : (
          <Button variant="outline" className="flex-1 min-w-[100px]" onClick={() => setShowConnectDialog(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Connect
          </Button>
        )}
      </div>

      {/* Endorsement count */}
      {endorsementCount > 0 && (
        <p className="text-xs text-muted-foreground">
          Endorsed by {endorsementCount} researcher{endorsementCount !== 1 ? 's' : ''}
        </p>
      )}

      {/* Connect Dialog */}
      <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect with {targetName}</DialogTitle>
            <DialogDescription>Send a message to introduce yourself.</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Hi! I'd love to connect and explore collaboration opportunities..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConnectDialog(false)}>Cancel</Button>
            <Button onClick={handleConnect} disabled={isConnecting}>
              {isConnecting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</> : <><UserPlus className="mr-2 h-4 w-4" />Send Request</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite to Project</DialogTitle>
            <DialogDescription>Select one of your active projects to invite {targetName} to.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {myProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No active projects found.</p>
            ) : (
              myProjects.map(project => (
                <button
                  key={project.id}
                  onClick={() => setSelectedProject(project.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedProject === project.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50 hover:bg-muted/40'
                  }`}
                >
                  <p className="text-sm font-medium">{project.title}</p>
                  {inviteSent === project.id && <p className="text-xs text-green-500 mt-0.5">✓ Invited!</p>}
                </button>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>Close</Button>
            <Button
              onClick={handleInvite}
              disabled={!selectedProject || isInviting || inviteSent === selectedProject}
            >
              {isInviting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Inviting...</> : inviteSent === selectedProject ? 'Invited!' : 'Send Invite'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
