'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { UserPlus, MessageSquare, Loader2, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface ProfileActionsProps {
  targetUserId: string
  targetName: string | null
}

export function ProfileActions({ targetUserId, targetName }: ProfileActionsProps) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'pending' | 'accepted'>('none')
  const [isConnecting, setIsConnecting] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function init() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || user.id === targetUserId) return
      setCurrentUserId(user.id)

      const { data } = await supabase
        .from('connections')
        .select('status')
        .or(
          `and(requester_id.eq.${user.id},recipient_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},recipient_id.eq.${user.id})`
        )
        .limit(1)
        .single()

      if (data) setConnectionStatus(data.status as any)
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
    setShowDialog(false)
    setMessage('')
    setIsConnecting(false)
  }

  // Don't show actions for own profile or unauthenticated
  if (!currentUserId) return null

  return (
    <div className="flex gap-2 mt-4 flex-wrap">
      {connectionStatus === 'accepted' ? (
        <Button variant="secondary" disabled className="flex items-center gap-2">
          <Check className="w-4 h-4" />
          Connected
        </Button>
      ) : connectionStatus === 'pending' ? (
        <Button variant="outline" disabled className="flex items-center gap-2">
          <Loader2 className="w-4 h-4" />
          Request Sent
        </Button>
      ) : (
        <Button onClick={() => setShowDialog(true)} className="flex items-center gap-2">
          <UserPlus className="w-4 h-4" />
          Connect
        </Button>
      )}

      <Button variant="outline" asChild className="flex items-center gap-2">
        <Link href={`/messages?user=${targetUserId}`}>
          <MessageSquare className="w-4 h-4" />
          Message
        </Link>
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect with {targetName}</DialogTitle>
            <DialogDescription>
              Send a message to introduce yourself.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Hi! I'd love to connect and explore collaboration opportunities..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleConnect} disabled={isConnecting}>
              {isConnecting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</>
              ) : (
                <><UserPlus className="mr-2 h-4 w-4" />Send Request</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
