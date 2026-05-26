export const AKILI_TIERS = [
  { name: 'Emerging Researcher', min: 0,    max: 299  },
  { name: 'Scholar Researcher',  min: 300,  max: 699  },
  { name: 'Research Fellow',     min: 700,  max: 1499 },
  { name: 'Senior Researcher',   min: 1500, max: 2499 },
  { name: 'Research Leader',     min: 2500, max: Infinity },
]

export function getCurrentTier(score: number) {
  return AKILI_TIERS.find(t => score >= t.min && score <= t.max) ?? AKILI_TIERS[0]
}

export function getNextTier(score: number) {
  const idx = AKILI_TIERS.findIndex(t => score >= t.min && score <= t.max)
  return AKILI_TIERS[idx + 1] ?? null
}

export function getPointsToNextTier(score: number): number {
  const next = getNextTier(score)
  if (!next) return 0
  return next.min - score
}

export const AKILI_ACTIONS = {
  knowledge: [
    { action: 'Post a research idea',    points: 20, href: '/ideas/new' },
    { action: 'Publish to Showcase',     points: 50, href: '/showcase'  },
    { action: 'Complete your bio',       points: 15, href: '/profile'   },
  ],
  collaboration: [
    { action: 'Connect with a researcher', points: 10, href: '/matches'  },
    { action: 'Join a research project',   points: 25, href: '/projects' },
    { action: 'Accept a collaboration',    points: 20, href: '/network'  },
  ],
  mentorship: [
    { action: 'Request a mentor session',  points: 20, href: '/mentors' },
    { action: 'Complete a mentor session', points: 40, href: '/mentors' },
    { action: 'Mentor another researcher', points: 30, href: '/mentors' },
  ],
  technical: [
    { action: 'Complete skills profile',       points: 20, href: '/profile'     },
    { action: 'Complete a marketplace task',   points: 30, href: '/marketplace' },
    { action: 'Add project to portfolio',      points: 25, href: '/projects'    },
  ],
}

export function getTopActions(
  dimensions: { knowledge: number; collaboration: number; mentorship: number; technical: number },
  count = 3
) {
  const allActions = [
    ...AKILI_ACTIONS.knowledge.map(a     => ({ ...a, dimension: 'Knowledge'     })),
    ...AKILI_ACTIONS.collaboration.map(a => ({ ...a, dimension: 'Collaboration' })),
    ...AKILI_ACTIONS.mentorship.map(a    => ({ ...a, dimension: 'Mentorship'    })),
    ...AKILI_ACTIONS.technical.map(a     => ({ ...a, dimension: 'Technical'     })),
  ]

  const dimScores: Record<string, number> = {
    'Knowledge':     dimensions.knowledge,
    'Collaboration': dimensions.collaboration,
    'Mentorship':    dimensions.mentorship,
    'Technical':     dimensions.technical,
  }

  return allActions
    .sort((a, b) => (dimScores[a.dimension] ?? 0) - (dimScores[b.dimension] ?? 0))
    .slice(0, count)
}
