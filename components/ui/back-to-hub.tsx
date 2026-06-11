'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

interface BackToHubProps {
  href: string
  label: string
}

export function BackToHub({ href, label }: BackToHubProps) {
  const router = useRouter()

  return (
    <button
      onClick={() => router.push(href)}
      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 group"
    >
      <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
      <span>{label}</span>
    </button>
  )
}
