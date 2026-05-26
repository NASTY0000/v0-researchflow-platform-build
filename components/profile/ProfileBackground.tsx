'use client'

interface ProfileBackgroundProps {
  backgroundStyle?: string
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

export function ProfileBackground(_props: ProfileBackgroundProps) {
  return (
    <div
      className="absolute inset-0"
      style={{
        background: 'linear-gradient(135deg, #0B0117 0%, #1a0a2e 50%, #0B0117 100%)',
        zIndex: 0,
      }}
    />
  )
}
