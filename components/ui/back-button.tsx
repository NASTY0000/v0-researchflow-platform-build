'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BackButtonProps {
  label?: string
  className?: string
  variant?: 'default' | 'ghost' | 'outline' | 'link'
}

export function BackButton({ label = 'Back', className, variant = 'ghost' }: BackButtonProps) {
  const router = useRouter()
  return (
    <Button
      variant={variant}
      onClick={() => router.back()}
      className={cn('gap-2', className)}
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Button>
  )
}
