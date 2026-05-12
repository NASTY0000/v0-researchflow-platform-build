'use client'

import { useRouter } from 'next/navigation'
import { MentorVerification } from '@/components/onboarding/mentor-verification'

export default function MentorVerificationPage() {
  const router = useRouter()

  const handleComplete = () => {
    router.push('/dashboard')
  }

  const handleSkip = () => {
    router.push('/dashboard')
  }

  return (
    <MentorVerification
      userId=""
      onComplete={handleComplete}
      onSkip={handleSkip}
    />
  )
}
