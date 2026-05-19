import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { messages, conversationId, projectContext } = await request.json()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, department, research_interests, skills, university_id')
    .eq('id', user.id)
    .single()

  const systemPrompt = `You are an AI Research Assistant for ResearchFlow, Africa's premier research collaboration platform. You help African university students and researchers with their academic work.

You are currently helping ${profile?.full_name || 'a researcher'} who studies ${profile?.department || 'research'} and is interested in: ${(profile?.research_interests || []).join(', ') || 'various research areas'}.

${projectContext ? `They are working on a project: ${projectContext}` : ''}

Your capabilities:
- Help refine and improve research ideas
- Suggest relevant literature and research directions
- Generate research outlines and methodologies
- Answer questions about research methods
- Help with academic writing and structure
- Suggest potential collaborators based on research areas
- Provide guidance on grants and funding opportunities for African researchers
- Help interpret data and suggest analysis approaches

Always:
- Be encouraging and supportive of African researchers
- Give practical, actionable advice
- Reference African research context when relevant
- Be concise but thorough
- Ask clarifying questions when needed

Never:
- Write entire papers or assignments for users
- Provide plagiarized content
- Give medical or legal advice beyond research context`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
    })

    const assistantMessage =
      response.content[0].type === 'text' ? response.content[0].text : ''

    if (conversationId) {
      await supabase.from('ai_messages').insert([
        {
          conversation_id: conversationId,
          role: 'user',
          content: messages[messages.length - 1].content,
        },
        {
          conversation_id: conversationId,
          role: 'assistant',
          content: assistantMessage,
        },
      ])

      await supabase
        .from('ai_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId)
    }

    return NextResponse.json({ message: assistantMessage })
  } catch (error: unknown) {
    console.error('AI error:', error)
    return NextResponse.json({ error: 'AI service error' }, { status: 500 })
  }
}
