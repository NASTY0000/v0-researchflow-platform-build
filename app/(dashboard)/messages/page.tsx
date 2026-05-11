'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Search, Send, MessageSquare, Users, User, 
  MoreVertical, Phone, Video, Paperclip, Smile
} from 'lucide-react'
import type { Conversation, Message, Profile } from '@/lib/types/database'

type ConversationWithDetails = Conversation & {
  participants: { user: Profile }[]
  last_message?: Message
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([])
  const [selectedConversation, setSelectedConversation] = useState<ConversationWithDetails | null>(null)
  const [messages, setMessages] = useState<(Message & { sender: Profile })[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    loadCurrentUser()
    loadConversations()
  }, [])

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id)
      subscribeToMessages(selectedConversation.id)
    }
  }, [selectedConversation])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  async function loadCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      setCurrentUser(profile)
    }
  }

  async function loadConversations() {
    setIsLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: participations } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', user.id)

    if (participations && participations.length > 0) {
      const conversationIds = participations.map(p => p.conversation_id)
      
      const { data: convos } = await supabase
        .from('conversations')
        .select(`
          *,
          participants:conversation_participants(
            user:profiles(*)
          )
        `)
        .in('id', conversationIds)
        .order('last_message_at', { ascending: false })

      if (convos) {
        setConversations(convos as ConversationWithDetails[])
        if (convos.length > 0 && !selectedConversation) {
          setSelectedConversation(convos[0] as ConversationWithDetails)
        }
      }
    }

    setIsLoading(false)
  }

  async function loadMessages(conversationId: string) {
    const { data } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!sender_id(*)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (data) {
      setMessages(data as (Message & { sender: Profile })[])
    }

    // Mark as read
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id)
    }
  }

  function subscribeToMessages(conversationId: string) {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const { data: newMsg } = await supabase
            .from('messages')
            .select(`*, sender:profiles!sender_id(*)`)
            .eq('id', payload.new.id)
            .single()
          
          if (newMsg) {
            setMessages(prev => [...prev, newMsg as Message & { sender: Profile }])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConversation || !currentUser) return

    const { error } = await supabase.from('messages').insert({
      conversation_id: selectedConversation.id,
      sender_id: currentUser.id,
      content: newMessage.trim(),
    })

    if (!error) {
      setNewMessage('')
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', selectedConversation.id)
    }
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  function getConversationName(conversation: ConversationWithDetails) {
    if (conversation.title) return conversation.title
    if (conversation.conversation_type === 'team') return 'Team Chat'
    
    const otherParticipants = conversation.participants
      ?.filter(p => p.user?.id !== currentUser?.id)
      .map(p => p.user?.full_name)
      .filter(Boolean)
    
    return otherParticipants?.join(', ') || 'Conversation'
  }

  function getOtherParticipant(conversation: ConversationWithDetails) {
    return conversation.participants?.find(p => p.user?.id !== currentUser?.id)?.user
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4">
      {/* Conversations List */}
      <Card className="w-80 flex flex-col shrink-0">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Messages</CardTitle>
            <Button size="icon" variant="ghost">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search conversations..." className="pl-10" />
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-2 space-y-1">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                    <div className="w-10 h-10 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                ))
              ) : conversations.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No conversations yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Start a conversation from a profile or project
                  </p>
                </div>
              ) : (
                conversations.map(conversation => {
                  const otherUser = getOtherParticipant(conversation)
                  const isSelected = selectedConversation?.id === conversation.id
                  
                  return (
                    <button
                      key={conversation.id}
                      onClick={() => setSelectedConversation(conversation)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                        isSelected 
                          ? 'bg-primary/10 border border-primary/20' 
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      {conversation.conversation_type === 'team' ? (
                        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                          <Users className="w-5 h-5 text-accent" />
                        </div>
                      ) : (
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={otherUser?.avatar_url || undefined} />
                          <AvatarFallback>
                            {otherUser?.full_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm truncate">
                            {getConversationName(conversation)}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {conversation.last_message_at && 
                              new Date(conversation.last_message_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                              })
                            }
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {conversation.conversation_type === 'team' && (
                            <Badge variant="outline" className="text-[10px] mr-1">Team</Badge>
                          )}
                          Click to view messages
                        </p>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {selectedConversation.conversation_type === 'team' ? (
                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-accent" />
                    </div>
                  ) : (
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={getOtherParticipant(selectedConversation)?.avatar_url || undefined} />
                      <AvatarFallback>
                        {getOtherParticipant(selectedConversation)?.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div>
                    <h3 className="font-medium">{getConversationName(selectedConversation)}</h3>
                    <p className="text-xs text-muted-foreground">
                      {selectedConversation.participants?.length || 0} participants
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="ghost">
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost">
                    <Video className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            {/* Messages */}
            <CardContent className="flex-1 p-4 overflow-hidden">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-4">
                  {messages.map((message, index) => {
                    const isOwn = message.sender_id === currentUser?.id
                    const showAvatar = index === 0 || 
                      messages[index - 1].sender_id !== message.sender_id

                    return (
                      <div
                        key={message.id}
                        className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}
                      >
                        {showAvatar && !isOwn && (
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={message.sender?.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">
                              {message.sender?.full_name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        {!showAvatar && !isOwn && <div className="w-8" />}
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                            isOwn
                              ? 'bg-primary text-primary-foreground rounded-br-sm'
                              : 'bg-muted rounded-bl-sm'
                          }`}
                        >
                          {showAvatar && !isOwn && (
                            <p className="text-xs font-medium mb-1 opacity-70">
                              {message.sender?.full_name}
                            </p>
                          )}
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <p className={`text-[10px] mt-1 ${
                            isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                          }`}>
                            {new Date(message.created_at).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </CardContent>

            {/* Message Input */}
            <div className="p-4 border-t">
              <form onSubmit={sendMessage} className="flex items-center gap-2">
                <Button type="button" size="icon" variant="ghost">
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1"
                />
                <Button type="button" size="icon" variant="ghost">
                  <Smile className="w-4 h-4" />
                </Button>
                <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-medium">Select a conversation</h3>
              <p className="text-sm text-muted-foreground">
                Choose a conversation from the list to start messaging
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
