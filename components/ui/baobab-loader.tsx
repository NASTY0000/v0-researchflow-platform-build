'use client'

interface BaobabLoaderProps {
  size?: 'sm' | 'md' | 'lg'
  fullscreen?: boolean
}

export function BaobabLoader({ size = 'md' }: BaobabLoaderProps) {
  return (
    <div className="w-8 h-8 rounded-full animate-spin border-4 border-primary border-t-transparent" />
  )
}
