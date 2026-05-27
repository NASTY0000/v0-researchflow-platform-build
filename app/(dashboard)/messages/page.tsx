'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Send, MessageSquare, Search, ArrowLeft, Sparkles } from 'lucide-react'
import Link from 'next/link'
import type { Profile } from '@/lib/types/database'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDistanceToNow } from 'date-fns'
import { generateIcebreaker } from '@/lib/utils/icebreakers'

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
  const [isMobile, setIsMobile] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null)
  const [icebreaker, setIcebreaker] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Load current user + profile
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      setCurrentUserId(user.id)
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (profile) setCurrentUserProfile(profile as Profile)
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

      const autoId = targetUserId ?? convos[0]?.user.id
      if (autoId && !selectedUserId) {
        const autoProfile = profiles.find(p => p.id === autoId)
        if (autoProfile) {
          setSelectedUserId(autoId)
          setSelectedUser(autoProfile as Profile)
          if (targetUserId) setShowChat(true)
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

          setMessages(prev => {
            const isDup = prev.some(m =>
              m.id === msg.id ||
              (m.id.startsWith('tmp-') && m.content === msg.content && m.sender_id === msg.sender_id)
            )
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

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Generate icebreaker for new conversations
  useEffect(() => {
    if (currentUserProfile && selectedUser && messages.length === 0) {
      setIcebreaker(generateIcebreaker(currentUserProfile, selectedUser))
    } else {
      setIcebreaker(null)
    }
  }, [currentUserProfile, selectedUser, messages.length])

  function handleSelectUser(user: Profile) {
    setSelectedUserId(user.id)
    setSelectedUser(user)
    setMessages([])
    if (isMobile) setShowChat(true)
  }

  async function sendMessage() {
    if (!newMessage.trim() || !currentUserId || !selectedUserId) return

    const content = newMessage.trim()
    setNewMessage('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

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

    // In-app notification for recipient
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', currentUserId)
      .single()

    const preview = content.length > 60 ? content.slice(0, 57) + '…' : content
    supabase.from('notifications').insert({
      user_id: selectedUserId,
      type: 'new_message',
      title: `Message from ${senderProfile?.full_name || 'a researcher'}`,
      message: `"${preview}"`,
      link: `/messages?user=${currentUserId}`,
      is_read: false,
    }).then(() => {})

    loadConversations()
  }

  const filteredConversations = conversations.filter(c =>
    !searchQuery || c.user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const showLeftPanel = !isMobile || !showChat
  const showRightPanel = !isMobile || showChat

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden rounded-xl border border-border">

      {/* LEFT PANEL — Conversation list */}
      <div className={`${showLeftPanel ? 'flex' : 'hidden'} w-full md:w-80 lg:w-96 flex-col border-r border-border bg-card`}>
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-lg mb-3">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-border bg-background outline-none focus:ring-2 focus:ring-primary/30"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-4 animate-pulse border-b border-border/50">
                <div className="w-11 h-11 rounded-full bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))
          ) : filteredConversations.length === 0 ? (
            <EmptyState
              icon="💬"
              title="No conversations yet"
              description="Start by reaching out to one of your matches. They're already interested in similar research."
              ctaLabel="View Your Matches"
              ctaHref="/matches"
            />
          ) : (
            filteredConversations.map(conv => (
              <button
                key={conv.user.id}
                onClick={() => handleSelectUser(conv.user)}
                className={`w-full flex items-center gap-3 p-4 hover:bg-muted/40 transition-colors text-left border-b border-border/50 ${
                  selectedUserId === conv.user.id && !isMobile
                    ? 'bg-primary/5 border-l-2 border-l-primary'
                    : ''
                }`}
              >
                <div className="relative shrink-0">
                  <Avatar className="w-11 h-11">
                    <AvatarImage src={conv.user.avatar_url || undefined} />
                    <AvatarFallback className="text-sm">
                      {conv.user.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  {conv.unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-primary text-primary-foreground rounded-full text-[10px] flex items-center justify-center font-bold">
                      {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'font-semibold' : 'font-medium'}`}>
                      {conv.user.full_name || 'Researcher'}
                    </p>
                    {conv.lastMessage && (
                      <p className="text-xs text-muted-foreground shrink-0">
                        {formatDistanceToNow(new Date(conv.lastMessage.created_at), { addSuffix: false })}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <p className="text-xs text-muted-foreground truncate">
                      {conv.lastMessage
                        ? `${conv.lastMessage.sender_id === currentUserId ? 'You: ' : ''}${conv.lastMessage.content}`
                        : 'Start a conversation'
                      }
                    </p>
                    {conv.unreadCount > 0 && (
                      <span className="shrink-0 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* RIGHT PANEL — Active chat */}
      <div className={`${showRightPanel ? 'flex' : 'hidden'} flex-1 flex-col bg-background`}>
        {selectedUser ? (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 p-4 border-b border-border bg-card shrink-0">
              {isMobile && (
                <button
                  onClick={() => setShowChat(false)}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors shrink-0"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <Link
                href={`/profile/${selectedUserId}`}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity flex-1 min-w-0"
              >
                <Avatar className="w-9 h-9 shrink-0">
                  <AvatarImage src={selectedUser.avatar_url || undefined} />
                  <AvatarFallback>{selectedUser.full_name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{selectedUser.full_name || 'Researcher'}</p>
                  <p className="text-xs text-muted-foreground">Tap to view profile</p>
                </div>
              </Link>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <EmptyState
                  icon="💬"
                  title="No messages yet"
                  description={`Say hello to ${selectedUser.full_name?.split(' ')[0] || 'them'}! Start the conversation.`}
                  ctaLabel="View Your Matches"
                  ctaHref="/matches"
                />
              ) : (
                messages.map((msg, i) => {
                  const isOwn = msg.sender_id === currentUserId
                  const isLast = i === messages.length - 1
                  const showTime = isLast || messages[i + 1]?.sender_id !== msg.sender_id
                  return (
                    <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] flex flex-col gap-1 ${isOwn ? 'items-end' : 'items-start'}`}>
                        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          isOwn
                            ? 'bg-primary text-primary-foreground rounded-br-sm'
                            : 'bg-muted text-foreground rounded-bl-sm'
                        }`}>
                          {msg.content}
                        </div>
                        {showTime && (
                          <p className={`text-[10px] text-muted-foreground px-1 ${isOwn ? 'text-right' : ''}`}>
                            {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border bg-card shrink-0">
              {icebreaker && (
                <button
                  onClick={() => { setNewMessage(icebreaker); setIcebreaker(null); textareaRef.current?.focus() }}
                  className="w-full mb-2 p-3 rounded-xl text-left transition-all group"
                  style={{ background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(139,92,246,0.2)' }}
                  onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(168,85,247,0.45)' }}
                  onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(139,92,246,0.2)' }}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Sparkles className="w-3 h-3" style={{ color: '#A855F7' }} />
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#A855F7' }}>
                      Ice-breaker suggestion — click to use
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    {icebreaker}
                  </p>
                </button>
              )}
              <div className="flex items-end gap-2">
                <textarea
                  ref={textareaRef}
                  value={newMessage}
                  onChange={e => {
                    setNewMessage(e.target.value)
                    e.target.style.height = 'auto'
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                  placeholder={`Message ${selectedUser.full_name?.split(' ')[0] || 'researcher'}…`}
                  rows={1}
                  className="flex-1 resize-none rounded-2xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 min-h-[44px] max-h-[120px]"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 disabled:opacity-40 hover:opacity-90 transition-opacity"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 ml-1">
                Enter to send · Shift+Enter for newline
              </p>
            </div>
          </>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center text-center p-8">
            <div className="space-y-3">
              <MessageSquare className="w-12 h-12 text-muted-foreground/30 mx-auto" />
              <p className="font-medium">Select a conversation</p>
              <p className="text-sm text-muted-foreground max-w-xs">
                Choose from your conversations or visit a profile to message someone new
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
