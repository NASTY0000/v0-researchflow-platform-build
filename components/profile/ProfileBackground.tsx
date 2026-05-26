'use client'

import { BaobabCanvas } from './BaobabCanvas'
import { ConstellationCanvas } from './ConstellationCanvas'

interface ProfileBackgroundProps {
  backgroundStyle?: string | null
  interests?: { name: string; weight: number }[]
  akiliScore?: number
  dimensions?: {
    knowledge: number
    collaboration: number
    mentorship: number
    technical: number
  }
  collaborationCount?: number
}

export function ProfileBackground({
  backgroundStyle,
  interests,
  akiliScore,
  dimensions,
  collaborationCount,
}: ProfileBackgroundProps) {
  const props = { interests, akiliScore, dimensions, collaborationCount }

  if (backgroundStyle === 'constellation') {
    return <ConstellationCanvas {...props} />
  }
  return <BaobabCanvas {...props} />
}
