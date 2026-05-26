'use client'

import dynamic from 'next/dynamic'

const BaobabCanvas = dynamic(() => import('./BaobabCanvas'), { ssr: false })
const ConstellationCanvas = dynamic(() => import('./ConstellationCanvas'), { ssr: false })

interface ProfileBackgroundProps {
  backgroundStyle?: 'baobab' | 'constellation' | null
  interests?: Array<{ name: string; weight: number }>
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
  backgroundStyle = 'baobab',
  interests = [
    { name: 'Research', weight: 0.5 },
    { name: 'Collaboration', weight: 0.3 },
    { name: 'Discovery', weight: 0.2 },
  ],
  akiliScore = 0,
  dimensions = { knowledge: 0, collaboration: 0, mentorship: 0, technical: 0 },
  collaborationCount = 0,
}: ProfileBackgroundProps) {
  const props = { interests, akiliScore, dimensions, collaborationCount }

  if (backgroundStyle === 'constellation') {
    return <ConstellationCanvas {...props} />
  }
  return <BaobabCanvas {...props} />
}
