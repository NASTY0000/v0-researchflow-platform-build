'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, MessageSquare, Search } from 'lucide-react'
import type { Profile } from '@/lib/types/database'
import { formatDistanceToNow } from 'date-fns'

type DirectMessage = {
  id: string
  sender_id: string
  recipient_id: string
  content: string
  is_read: boolean
  created_at: string
}

type ConversationSummary = {
  user: Profile
  lastMessage: DirectMessage | null
  unreadCount: number
}

const cardStyle = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(139,92,246,0.15)',
  borderRadius: '16px',
}

export default function MessagesPage() {
  const searchParams = useSearchParams()
  const targetUserId = searchParams.get('user')

  const supabase = useMemo(() => createClient(), [])

  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string | null>(targetUserId)
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  const [messages, setMessages] = useState<DirectMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id)
    })
  }, [supabase])

  const loadConversations = useCallback(async () => {
    if (!currentUserId) return
    setIsLoading(true)

    const { data: msgs } = await supabase
      .from('direct_messages')
      .select('*')
      .or(`sender_id.eq.${currentUserId},recipient_id.eq.${currentUserId}`)
      .order('created_at', { ascending: false })

    const allMessages: DirectMessage[] = msgs || []

    const convMap = new Map<string, { lastMessage: DirectMessage; unreadCount: number }>()
    for (const msg of allMessages) {
      const otherId = msg.sender_id === currentUserId ? msg.recipient_id : msg.sender_id
      if (!convMap.has(otherId)) {
        convMap.set(otherId, { lastMessage: msg, unreadCount: 0 })
      }
      if (msg.recipient_id === currentUserId && !msg.is_read) {
        convMap.get(otherId)!.unreadCount++
      }
    }

    // Include targetUserId even if no messages yet
    const idsToLoad = [...new Set([...Array.from(convMap.keys()), ...(targetUserId ? [targetUserId] : [])])]
    if (idsToLoad.length === 0) {
      setIsLoading(false)
      return
    }

    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', idsToLoad)

    if (profiles) {
      const convos: ConversationSummary[] = profiles
        .filter(p => convMap.has(p.id))
        .map(p => ({
          user: p as Profile,
          lastMessage: convMap.get(p.id)?.lastMessage ?? null,
          unreadCount: convMap.get(p.id)?.unreadCount ?? 0,
        }))
        .sort((a, b) =>
          (b.lastMessage?.created_at ?? '').localeCompare(a.lastMessage?.created_at ?? '')
        )
      setConversations(convos)

      // Auto-select: targetUserId takes precedence, then first conversation
      const autoId = targetUserId ?? convos[0]?.user.id
      if (autoId && !selectedUserId) {
        const autoProfile = profiles.find(p => p.id === autoId)
        if (autoProfile) {
          setSelectedUserId(autoId)
          setSelectedUser(autoProfile as Profile)
        }
      } else if (selectedUserId) {
        const existing = profiles.find(p => p.id === selectedUserId)
        if (existing) setSelectedUser(existing as Profile)
      }
    }

    setIsLoading(false)
  }, [currentUserId, supabase, targetUserId, selectedUserId])

  useEffect(() => {
    if (currentUserId) loadConversations()
  }, [currentUserId, loadConversations])

  // Load messages + realtime for active conversation
  useEffect(() => {
    if (!currentUserId || !selectedUserId) return

    let active = true

    async function loadMessages() {
      const { data } = await supabase
        .from('direct_messages')
        .select('*')
        .or(
          `and(sender_id.eq.${currentUserId},recipient_id.eq.${selectedUserId}),` +
          `and(sender_id.eq.${selectedUserId},recipient_id.eq.${currentUserId})`
        )
        .order('created_at', { ascending: true })
      if (active && data) setMessages(data)

      await supabase
        .from('direct_messages')
        .update({ is_read: true })
        .eq('sender_id', selectedUserId!)
        .eq('recipient_id', currentUserId!)
        .eq('is_read', false)
    }

    loadMessages()

    const channel = supabase
      .channel(`dm:${[currentUserId, selectedUserId].sort().join(':')}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_messages' },
        async (payload) => {
          const msg = payload.new as DirectMessage
          const relevant =
            (msg.sender_id === currentUserId && msg.recipient_id === selectedUserId) ||
            (msg.sender_id === selectedUserId && msg.recipient_id === currentUserId)
          if (!relevant || !active) return

          // Avoid duplicate if optimistic message already added
          setMessages(prev => {
            const isDup = prev.some(m => m.id === msg.id || (m.id.startsWith('tmp-') && m.content === msg.content && m.sender_id === msg.sender_id))
            if (isDup) return prev.map(m => (m.id.startsWith('tmp-') && m.content === msg.content ? msg : m))
            return [...prev, msg]
          })
          if (msg.recipient_id === currentUserId) {
            await supabase.from('direct_messages').update({ is_read: true }).eq('id', msg.id)
          }
        }
      )
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [currentUserId, selectedUserId, supabase])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleSelectUser(user: Profile) {
    setSelectedUserId(user.id)
    setSelectedUser(user)
    setMessages([])
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() || !currentUserId || !selectedUserId) return

    const content = newMessage.trim()
    setNewMessage('')

    const optimistic: DirectMessage = {
      id: `tmp-${Date.now()}`,
      sender_id: currentUserId,
      recipient_id: selectedUserId,
      content,
      is_read: false,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimistic])

    await supabase.from('direct_messages').insert({
      sender_id: currentUserId,
      recipient_id: selectedUserId,
      content,
    })

    loadConversations()
  }

  const filteredConversations = conversations.filter(c =>
    !searchQuery || c.user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4">
      {/* Conversations list */}
      <div className="w-80 flex flex-col shrink-0" style={cardStyle}>
        <div className="p-4 border-b" style={{ borderColor: 'rgba(139,92,246,0.15)' }}>
          <h2 className="font-semibold font-heading mb-3">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              className="pl-10"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              ))
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm text-muted-foreground">No messages yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Visit a researcher&apos;s profile to start a conversation
                </p>
              </div>
            ) : (
              filteredConversations.map(conv => (
                <button
                  key={conv.user.id}
                  onClick={() => handleSelectUser(conv.user)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${
                    selectedUserId === conv.user.id
                      ? 'bg-primary/10 border border-primary/20'
                      : 'hover:bg-muted/40'
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={conv.user.avatar_url || undefined} />
                      <AvatarFallback className="text-sm">
                        {conv.user.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    {conv.unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-primary-foreground rounded-full text-[10px] flex items-center justify-center font-bold">
                        {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'font-semibold' : 'font-medium'}`}>
                        {conv.user.full_name || 'Researcher'}
                      </p>
                      {conv.lastMessage && (
                        <span className="text-[10px] text-muted-foreground flex-shrink-0">
                          {formatDistanceToNow(new Date(conv.lastMessage.created_at), { addSuffix: false })}
                        </span>
                      )}
                    </div>
                    {conv.lastMessage && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {conv.lastMessage.sender_id === currentUserId ? 'You: ' : ''}
                        {conv.lastMessage.content}
                      </p>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col overflow-hidden" style={cardStyle}>
        {selectedUser ? (
          <>
            <div className="flex items-center gap-3 p-4 border-b flex-shrink-0" style={{ borderColor: 'rgba(139,92,246,0.15)' }}>
              <Avatar className="w-10 h-10">
                <AvatarImage src={selectedUser.avatar_url || undefined} />
                <AvatarFallback>{selectedUser.full_name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{selectedUser.full_name || 'Researcher'}</p>
                <p className="text-xs text-muted-foreground capitalize">{selectedUser.department || selectedUser.academic_level?.replace(/_/g, ' ') || ''}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center py-16">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm text-muted-foreground">No messages yet</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Say hello to {selectedUser.full_name?.split(' ')[0] || 'them'}!
                    </p>
                  </div>
                ) : (
                  messages.map((msg, i) => {
                    const isOwn = msg.sender_id === currentUserId
                    const isLast = i === messages.length - 1
                    const showTime = isLast || messages[i + 1].sender_id !== msg.sender_id
                    return (
                      <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] flex flex-col gap-1 ${isOwn ? 'items-end' : 'items-start'}`}>
                          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                            isOwn
                              ? 'bg-primary text-primary-foreground rounded-br-sm'
                              : 'bg-muted rounded-bl-sm'
                          }`}>
                            {msg.content}
                          </div>
                          {showTime && (
                            <p className="text-[10px] text-muted-foreground px-1">
                              {new Date(msg.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="p-4 border-t flex-shrink-0" style={{ borderColor: 'rgba(139,92,246,0.15)' }}>
              <form onSubmit={sendMessage} className="flex items-center gap-2">
                <Input
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder={`Message ${selectedUser.full_name?.split(' ')[0] || 'researcher'}…`}
                  className="flex-1"
                />
                <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <h3 className="text-lg font-medium">Your Messages</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-xs">
                Select a conversation or visit a researcher&apos;s profile to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
