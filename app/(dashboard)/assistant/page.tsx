'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BackToHub } from '@/components/ui/back-to-hub'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Send,
  User,
  Plus,
  Sparkles,
  ChevronRight,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import {
  ASSISTANT_MODES,
  MODE_LABELS,
  type AssistantMode,
} from '@/lib/ai/assistant-modes'

interface Message {
  id: string | number
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

interface Conversation {
  id: string
  title: string
  updated_at: string
}

export default function AssistantPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingConvs, setLoadingConvs] = useState(true)
  const [mode, setMode] = useState<AssistantMode>('question_development')
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const supabase = createClient()

  useEffect(() => {
    loadConversations()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadConversations() {
    const { data } = await supabase
      .from('ai_conversations')
      .select('*')
      .order('updated_at', { ascending: false })
    setConversations(data || [])
    setLoadingConvs(false)
  }

  async function loadMessages(convId: string) {
    const { data } = await supabase
      .from('ai_messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })
    setMessages(data || [])
  }

  async function selectConversation(convId: string) {
    setActiveConvId(convId)
    await loadMessages(convId)
  }

  async function newConversation() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('ai_conversations')
      .insert({ user_id: user.id, title: 'New Conversation' })
      .select()
      .single()

    if (data) {
      setConversations(prev => [data, ...prev])
      setActiveConvId(data.id)
      setMessages([])
    }
  }

  async function sendMessage(content: string, modeOverride?: AssistantMode) {
    if (!content.trim() || loading) return

    const activeMode = modeOverride ?? mode
    setError(null)
    let convId = activeConvId

    if (!convId) {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: conv } = await supabase
        .from('ai_conversations')
        .insert({ user_id: user.id, title: content.slice(0, 50) })
        .select()
        .single()

      if (conv) {
        convId = conv.id
        setActiveConvId(conv.id)
        setConversations(prev => [conv, ...prev])
      }
    }

    const userMsg: Message = {
      id: Date.now(),
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
    setLoading(true)

    // Prior turns only — the new message is sent separately.
    const history = messages.map(m => ({ role: m.role, content: m.content }))

    try {
      const res = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          mode: activeMode,
          history,
          conversationId: convId,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.message) {
        setError(
          (data.error || 'The assistant could not respond. Please try again.') +
            (data.code ? ` (${data.code})` : ''),
        )
        return
      }

      const assistantMsg: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.message,
        created_at: new Date().toISOString(),
      }
      setMessages(prev => [...prev, assistantMsg])

      if (messages.length === 0 && convId) {
        const title = content.slice(0, 50)
        await supabase
          .from('ai_conversations')
          .update({ title })
          .eq('id', convId)
        setConversations(prev =>
          prev.map(c => (c.id === convId ? { ...c, title } : c))
        )
      }
    } catch (err) {
      console.error('Assistant error:', err)
      setError('Could not reach the assistant. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">

      {/* Sidebar */}
      <div className="hidden md:flex w-64 flex-col border-r border-border bg-card">
        <div className="p-4 border-b border-border">
          <Button onClick={newConversation} className="w-full gap-2" size="sm">
            <Plus className="w-4 h-4" />
            New Conversation
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.map(conv => (
            <button
              key={conv.id}
              onClick={() => selectConversation(conv.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors truncate ${
                activeConvId === conv.id
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-muted'
              }`}
            >
              {conv.title}
            </button>
          ))}
          {conversations.length === 0 && !loadingConvs && (
            <p className="text-xs text-muted-foreground p-3 text-center">
              No conversations yet
            </p>
          )}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">

        <div className="px-4 pt-3">
          <BackToHub href="/discover" label="Back to Discover" />
        </div>

        {/* Header */}
        <div className="p-4 border-b border-border bg-card flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">AI Research Assistant</h2>
            <p className="text-xs text-muted-foreground">
              Powered by Gemini · Your personal research guide
            </p>
          </div>
          <Badge variant="secondary" className="ml-auto text-xs">Beta</Badge>
        </div>

        {/* Mode selector — sets which capability the assistant answers with */}
        <div className="px-4 py-2.5 border-b border-border bg-card shrink-0 overflow-x-auto">
          <div
            role="tablist"
            aria-label="Assistant capability"
            className="flex gap-1.5 min-w-max"
          >
            {ASSISTANT_MODES.map(m => {
              const meta = MODE_LABELS[m]
              const active = mode === m
              return (
                <button
                  key={m}
                  role="tab"
                  aria-selected={active}
                  title={meta.blurb}
                  onClick={() => setMode(m)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors ${
                    active
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-transparent text-muted-foreground border-border hover:text-foreground hover:border-primary/40'
                  }`}
                >
                  <span aria-hidden="true">{meta.icon}</span>
                  {meta.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Messages or welcome */}
        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="max-w-2xl mx-auto space-y-8 py-8">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">How can I help your research?</h2>
                <p className="text-muted-foreground">
                  I can help you refine ideas, plan methodology, find funding, and guide your research journey.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ASSISTANT_MODES.map(m => {
                  const meta = MODE_LABELS[m]
                  return (
                    <button
                      key={m}
                      onClick={() => {
                        setMode(m)
                        sendMessage(meta.opener, m)
                      }}
                      className="flex items-center gap-3 p-4 rounded-xl border border-border hover:border-primary/30 hover:bg-primary/5 transition-all text-left group"
                    >
                      <span className="text-2xl" aria-hidden="true">{meta.icon}</span>
                      <div className="min-w-0">
                        <p className="font-medium text-sm">{meta.label}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {meta.blurb}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-1">
                      <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-sm'
                        : 'bg-muted text-foreground rounded-bl-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-1">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3">
                    <div className="flex gap-1 items-center h-4">
                      <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" />
                      <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce [animation-delay:0.1s]" />
                      <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce [animation-delay:0.2s]" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border bg-card shrink-0">
          <div className="max-w-3xl mx-auto">
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 mb-3 px-3 py-2 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
                <span className="flex-1">{error}</span>
                <button
                  onClick={() => setError(null)}
                  className="font-medium underline underline-offset-2 shrink-0"
                >
                  Dismiss
                </button>
              </div>
            )}
            <div className="flex gap-2 items-end">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => {
                  setInput(e.target.value)
                  e.target.style.height = 'auto'
                  e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px'
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage(input)
                  }
                }}
                placeholder="Ask anything about your research..."
                rows={1}
                className="flex-1 resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 min-h-[48px] max-h-[150px]"
              />
              <Button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                size="icon"
                className="rounded-xl w-12 h-12 shrink-0"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 text-center">
              AI can make mistakes. Always verify important research information.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
