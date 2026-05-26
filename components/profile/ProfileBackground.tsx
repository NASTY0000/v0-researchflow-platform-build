'use client'

import { BaobabCanvas } from './BaobabCanvas'
import { ConstellationCanvas } from './ConstellationCanvas'

export interface ProfileBackgroundProps {
  backgroundStyle: 'baobab' | 'constellation'
  interests: Array<{ name: string; weight: number }>
  akiliScore: number
  dimensions: {
    knowledge: number
    collaboration: number
    mentorship: number
    technical: number
  }
  collaborationCount: number
}

export function ProfileBackground({ backgroundStyle, ...data }: ProfileBackgroundProps) {
  if (backgroundStyle === 'constellation') {
    return <ConstellationCanvas {...data} />
  }
  return <BaobabCanvas {...data} />
}
