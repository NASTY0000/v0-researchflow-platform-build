"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Message, Profile } from "@/lib/types/database"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"

interface MessageWithSender extends Message {
  sender: Profile
}

interface ProjectChatProps {
  projectId: string
  teamId: string
  currentUserId: string | null
}

export function ProjectChat({ projectId, teamId, currentUserId }: ProjectChatProps) {
  const [messages, setMessages] = useState<MessageWithSender[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  async function loadMessages(convId: string) {
    const supabase = createClient()

    console.log("Loading messages for conversation:", convId)

    const { data, error: messagesError } = await supabase
      .from("messages")
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url)
      `)
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true })
      .limit(100)

    console.log("Messages found:", data?.length, data)

    if (messagesError) {
      console.error("Failed to load messages:", messagesError)
      toast.error(messagesError.message || "Failed to load messages")
    } else if (data) {
      setMessages(data)
    }
  }

  useEffect(() => {
    async function loadConversation() {
      const supabase = createClient()

      let { data: conversation, error } = await supabase
        .from("conversations")
        .select("id")
        .eq("project_id", projectId)
        .eq("conversation_type", "project")
        .maybeSingle()

      if (!conversation && !error) {
        const { data: created, error: createError } = await supabase
          .from("conversations")
          .insert({ conversation_type: "project", project_id: projectId, team_id: teamId })
          .select("id")
          .single()

        if (createError) {
          console.error("Failed to create conversation:", createError)
          toast.error(createError.message || "Failed to set up project chat")
          setIsLoading(false)
          return
        }
        conversation = created

        // Add all team members as conversation participants
        const { data: teamMembers } = await supabase
          .from("team_members")
          .select("user_id")
          .eq("team_id", teamId)

        if (teamMembers?.length) {
          await supabase.from("conversation_participants").insert(
            teamMembers.map((m) => ({
              conversation_id: created.id,
              user_id: m.user_id,
              joined_at: new Date().toISOString(),
            }))
          )
        }
      }

      if (error) {
        console.error("Failed to load conversation:", error)
        toast.error(error.message || "Failed to load project chat")
        setIsLoading(false)
        return
      }

      if (!conversation) {
        setIsLoading(false)
        return
      }

      setConversationId(conversation.id)
      await loadMessages(conversation.id)

      setIsLoading(false)
    }

    loadConversation()
  }, [projectId, teamId])

  useEffect(() => {
    if (!conversationId) return

    const supabase = createClient()
    const channel = supabase
      .channel(`project-chat-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const { data } = await supabase
            .from("messages")
            .select(`
              *,
              sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url)
            `)
            .eq("id", payload.new.id)
            .single()

          if (data) {
            setMessages((prev) => (prev.some((m) => m.id === data.id) ? prev : [...prev, data]))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId])

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() || !currentUserId || !conversationId) return

    setIsSending(true)
    const supabase = createClient()

    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: currentUserId,
        content: newMessage.trim(),
        message_type: "text",
      })
      .select()
      .single()

    if (error) {
      console.error("Chat send error:", JSON.stringify(error))
      toast.error(error.message || "Failed to send message")
      setIsSending(false)
      return
    }

    console.log("Message sent to conversation:", conversationId)
    console.log("Message data:", data)

    setNewMessage("")
    await loadMessages(conversationId)

    setIsSending(false)
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="border-b shrink-0">
        <CardTitle className="text-lg">Team Chat</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.length > 0 ? (
              messages.map((message) => {
                const isOwn = message.sender_id === currentUserId

                return (
                  <div
                    key={message.id}
                    className={`flex items-start gap-3 ${isOwn ? "flex-row-reverse" : ""}`}
                  >
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={message.sender?.avatar_url || undefined} />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {message.sender?.full_name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`flex flex-col ${isOwn ? "items-end" : ""}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">
                          {message.sender?.full_name || "Unknown"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <div
                        className={`px-4 py-2 rounded-2xl max-w-md ${
                          isOwn
                            ? "bg-primary text-primary-foreground rounded-tr-none"
                            : "bg-muted rounded-tl-none"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <form
          onSubmit={handleSendMessage}
          className="p-4 border-t flex items-center gap-2 shrink-0"
        >
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={isSending || !currentUserId || !conversationId}
            className="flex-1"
          />
          <Button
            type="submit"
            size="icon"
            disabled={isSending || !newMessage.trim() || !currentUserId || !conversationId}
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
