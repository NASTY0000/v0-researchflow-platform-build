/**
 * Client-safe constants for the AI Research Assistant.
 *
 * Only labels and mode identifiers live here so they can be imported by the
 * browser bundle. The system instructions themselves stay in
 * ./assistant-prompts, which is server-only.
 */

export const ASSISTANT_MODES = [
  'question_development',
  'literature_discovery',
  'methodology',
  'abstract_writing',
  'grant_writing',
  'challenge_matching',
] as const

export type AssistantMode = (typeof ASSISTANT_MODES)[number]

export function isAssistantMode(value: unknown): value is AssistantMode {
  return typeof value === 'string' && (ASSISTANT_MODES as readonly string[]).includes(value)
}

export const MODE_LABELS: Record<
  AssistantMode,
  { label: string; icon: string; blurb: string; opener: string }
> = {
  question_development: {
    label: 'Sharpen my question',
    icon: '💡',
    blurb: 'Narrow a broad topic into a focused, researchable question',
    opener: 'Help me narrow my research topic into a focused, researchable question.',
  },
  literature_discovery: {
    label: 'Find the literature',
    icon: '📚',
    blurb: 'Work out what exists and how to search for it',
    opener: 'What existing research relates to my idea, and how should I search for it?',
  },
  methodology: {
    label: 'Choose a method',
    icon: '🔬',
    blurb: 'Study designs that fit your question and resources',
    opener: 'What study design and methods would suit my research question?',
  },
  abstract_writing: {
    label: 'Draft an abstract',
    icon: '✍️',
    blurb: 'Turn your idea into a structured academic abstract',
    opener: 'Help me draft an academic abstract for my research.',
  },
  grant_writing: {
    label: 'Frame for a grant',
    icon: '💰',
    blurb: 'Significance, aims, and impact for an application',
    opener: 'Help me frame my research for a grant application.',
  },
  challenge_matching: {
    label: 'Match to challenges',
    icon: '🎯',
    blurb: 'Which calls and challenges your idea could fit',
    opener: 'What kinds of challenges or funding calls could my research idea fit?',
  },
}
