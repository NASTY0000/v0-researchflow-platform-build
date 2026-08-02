import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'
import {
  buildSystemPrompt,
  isAssistantMode,
  type AssistantMode,
} from '@/lib/ai/assistant-prompts'

// Server-only. GEMINI_API_KEY must never be exposed to the client or moved
// into a NEXT_PUBLIC_ variable.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MODEL = 'gemini-2.0-flash'
const MAX_MESSAGE_CHARS = 8000
const MAX_HISTORY_TURNS = 20

interface HistoryTurn {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(request: NextRequest) {
  // 1. Authenticate first — before touching Gemini — so anonymous traffic
  //    can never run up the API bill.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error('ai-assistant: GEMINI_API_KEY is not set')
    return NextResponse.json(
      { error: 'The assistant is not configured yet. Please try again later.' },
      { status: 503 },
    )
  }

  // 2. Parse and validate input.
  let body: {
    message?: unknown
    mode?: unknown
    context?: unknown
    history?: unknown
    conversationId?: unknown
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const message = typeof body.message === 'string' ? body.message.trim() : ''
  if (!message) {
    return NextResponse.json({ error: 'A message is required.' }, { status: 400 })
  }
  if (message.length > MAX_MESSAGE_CHARS) {
    return NextResponse.json(
      { error: `Message is too long (limit ${MAX_MESSAGE_CHARS} characters).` },
      { status: 400 },
    )
  }

  const mode: AssistantMode = isAssistantMode(body.mode) ? body.mode : 'question_development'

  const ctx = (body.context ?? {}) as Record<string, unknown>
  const ideaText = typeof ctx.ideaText === 'string' ? ctx.ideaText : null
  const extraContext = typeof ctx.extraContext === 'string' ? ctx.extraContext : null

  const history: HistoryTurn[] = Array.isArray(body.history)
    ? (body.history as unknown[])
        .filter(
          (t): t is HistoryTurn =>
            !!t &&
            typeof t === 'object' &&
            typeof (t as HistoryTurn).content === 'string' &&
            ((t as HistoryTurn).role === 'user' || (t as HistoryTurn).role === 'assistant'),
        )
        .slice(-MAX_HISTORY_TURNS)
    : []

  // 3. Ground the prompt in the researcher's own profile.
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, department, research_interests')
    .eq('id', user.id)
    .maybeSingle()

  const systemInstruction = buildSystemPrompt(mode, {
    fullName: profile?.full_name ?? null,
    department: profile?.department ?? null,
    researchInterests: profile?.research_interests ?? null,
    ideaText,
    extraContext,
  })

  // 4. Call Gemini.
  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: MODEL,
      systemInstruction,
      generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
    })

    // Gemini requires the first turn to be from the user; drop any leading
    // assistant messages so a resumed conversation cannot break the call.
    const trimmed = [...history]
    while (trimmed.length && trimmed[0].role !== 'user') trimmed.shift()

    const chat = model.startChat({
      history: trimmed.map(t => ({
        role: t.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: t.content }],
      })),
    })

    const result = await chat.sendMessage(message)
    const text = result.response.text()

    if (!text?.trim()) {
      return NextResponse.json(
        { error: 'The assistant returned an empty response. Please rephrase and try again.' },
        { status: 502 },
      )
    }

    // 5. Persist the exchange when the client is tracking a conversation.
    //    Never fail the response over a logging error.
    const conversationId = typeof body.conversationId === 'string' ? body.conversationId : null
    if (conversationId) {
      try {
        await supabase.from('ai_messages').insert([
          { conversation_id: conversationId, role: 'user', content: message },
          { conversation_id: conversationId, role: 'assistant', content: text },
        ])
        await supabase
          .from('ai_conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', conversationId)
      } catch (persistError) {
        console.error('ai-assistant: failed to persist conversation', persistError)
      }
    }

    return NextResponse.json({ message: text, mode })
  } catch (error: unknown) {
    console.error('ai-assistant: Gemini call failed', error)

    const raw = error instanceof Error ? error.message : String(error)
    // Map the failures a user can act on; keep everything else generic so no
    // provider internals or key material can leak into the client.
    if (/quota|rate.?limit|429|RESOURCE_EXHAUSTED/i.test(raw)) {
      return NextResponse.json(
        { error: 'The assistant is busy right now. Please wait a moment and try again.' },
        { status: 429 },
      )
    }
    if (/SAFETY|blocked/i.test(raw)) {
      return NextResponse.json(
        { error: 'That request was blocked by the model’s safety filters. Try rephrasing it.' },
        { status: 400 },
      )
    }
    if (/API key|API_KEY_INVALID|PERMISSION_DENIED|401|403/i.test(raw)) {
      return NextResponse.json(
        { error: 'The assistant is not configured correctly. Please contact support.' },
        { status: 503 },
      )
    }
    return NextResponse.json(
      { error: 'The assistant could not respond just now. Please try again.' },
      { status: 500 },
    )
  }
}
