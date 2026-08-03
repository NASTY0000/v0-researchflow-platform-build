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

// Each Gemini model has its own quota pool, so a key with no free-tier
// allocation for one model often still has room on another. Tried in order;
// a 429 or 404 falls through to the next. Override with a comma-separated
// GEMINI_MODEL to pin or reorder.
const MODELS = (process.env.GEMINI_MODEL || 'gemini-2.0-flash,gemini-2.0-flash-lite,gemini-1.5-flash')
  .split(',')
  .map(m => m.trim())
  .filter(Boolean)

/** Pulls the useful bits out of a Google API error for logging and display. */
function describeGeminiError(error: unknown) {
  const raw = error instanceof Error ? error.message : String(error)
  const status =
    typeof (error as { status?: unknown })?.status === 'number'
      ? (error as { status: number }).status
      : undefined

  // Google embeds a JSON body in the message; pull the quota details out of it
  // so the log says which limit was hit and what its value is. A limit of 0
  // means the key has no allocation for that model, which reads very
  // differently from having burned through a real allowance.
  let quotaMetric: string | undefined
  let quotaValue: string | undefined
  let retryDelay: string | undefined
  const metric = raw.match(/"quotaMetric"\s*:\s*"([^"]+)"/)
  const value = raw.match(/"quotaValue"\s*:\s*"?(\d+)"?/)
  const delay = raw.match(/"retryDelay"\s*:\s*"([^"]+)"/)
  if (metric) quotaMetric = metric[1]
  if (value) quotaValue = value[1]
  if (delay) retryDelay = delay[1]

  const retriable =
    status === 429 ||
    status === 404 ||
    /quota|RESOURCE_EXHAUSTED|not found|NOT_FOUND|is not supported/i.test(raw)

  return { raw, status, quotaMetric, quotaValue, retryDelay, retriable }
}
const MAX_MESSAGE_CHARS = 8000
const MAX_HISTORY_TURNS = 20

interface HistoryTurn {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(request: NextRequest) {
  // 1. Authenticate first (before touching Gemini) so anonymous traffic
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

  // Gemini requires the first turn to be from the user; drop any leading
  // assistant messages so a resumed conversation cannot break the call.
  const trimmed = [...history]
  while (trimmed.length && trimmed[0].role !== 'user') trimmed.shift()
  const chatHistory = trimmed.map(t => ({
    role: t.role === 'assistant' ? ('model' as const) : ('user' as const),
    parts: [{ text: t.content }],
  }))

  // 4. Call Gemini, falling through the model list on quota / availability
  //    errors. Anything else (safety, bad key) fails immediately: retrying a
  //    different model would not help and would waste the caller's time.
  const genAI = new GoogleGenerativeAI(apiKey)
  let lastError: ReturnType<typeof describeGeminiError> | null = null
  let lastModel = MODELS[0]

  for (const modelName of MODELS) {
    lastModel = modelName
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction,
        generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
      })

      const chat = model.startChat({ history: chatHistory })
      const text = (await chat.sendMessage(message)).response.text()

      if (!text?.trim()) {
        return NextResponse.json(
          { error: 'The assistant returned an empty response. Please rephrase and try again.' },
          { status: 502 },
        )
      }

      if (modelName !== MODELS[0]) {
        console.warn(`ai-assistant: served by fallback model ${modelName}`)
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

      return NextResponse.json({ message: text, mode, model: modelName })
    } catch (error: unknown) {
      const info = describeGeminiError(error)
      lastError = info

      console.error('ai-assistant: Gemini call failed', {
        model: modelName,
        status: info.status,
        quotaMetric: info.quotaMetric,
        quotaValue: info.quotaValue,
        retryDelay: info.retryDelay,
        message: info.raw.slice(0, 600),
      })

      if (info.retriable && modelName !== MODELS[MODELS.length - 1]) continue

      // `code` is a coarse classification, safe to show: it names the failure
      // class, never key material or provider internals.
      const fail = (status: number, code: string, msg: string) =>
        NextResponse.json({ error: msg, code }, { status })

      if (/API_KEY_INVALID|API key not valid|PERMISSION_DENIED/i.test(info.raw) || info.status === 403) {
        return fail(
          503,
          'KEY_REJECTED',
          'The Gemini API key was rejected. Check that GEMINI_API_KEY is valid and that the Generative Language API is enabled for its Google Cloud project.',
        )
      }
      if (/SAFETY|blocked/i.test(info.raw)) {
        return fail(400, 'SAFETY_BLOCK', 'That request was blocked by the model’s safety filters. Try rephrasing it.')
      }
      if (info.status === 401) {
        return fail(503, 'UNAUTHENTICATED', 'The assistant is not configured correctly.')
      }
      if (info.status === 429 || /quota|RESOURCE_EXHAUSTED/i.test(info.raw)) {
        // A limit of 0 is not "used up", it means this key has no allocation
        // at all, which needs a different fix from waiting.
        const noAllocation = info.quotaValue === '0'
        return fail(
          429,
          noAllocation ? 'NO_QUOTA_ALLOCATION' : 'QUOTA_EXCEEDED',
          noAllocation
            ? `This API key has no quota allocated for Gemini (limit is 0 on ${info.quotaMetric || 'the requested models'}). Free-tier access is not enabled for its Google Cloud project or billing country. Enable billing on the project, or create a key from a project that has free-tier access.`
            : `Gemini rate limit or quota reached on all configured models${info.retryDelay ? `; retry in ${info.retryDelay}` : ''}. Check the key’s quota in Google AI Studio.`,
        )
      }
      if (info.status === 404 || /not found|NOT_FOUND|is not supported/i.test(info.raw)) {
        return fail(
          503,
          'MODEL_NOT_FOUND',
          `None of the configured models (${MODELS.join(', ')}) are available to this API key. Set GEMINI_MODEL to one it can access.`,
        )
      }
      return fail(502, 'UPSTREAM_ERROR', 'The assistant could not respond just now. Please try again.')
    }
  }

  console.error('ai-assistant: exhausted all models', { lastModel, status: lastError?.status })
  return NextResponse.json(
    { error: 'The assistant could not respond just now. Please try again.', code: 'UPSTREAM_ERROR' },
    { status: 502 },
  )
}
