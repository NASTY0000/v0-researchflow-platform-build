'use client'

export function GradientText({
  children,
  className = '',
  animate = false,
}: {
  children: React.ReactNode
  className?: string
  animate?: boolean
}) {
  return (
    <span
      className={`bg-gradient-to-r from-primary via-violet-400 to-teal-400 bg-clip-text text-transparent ${
        animate ? 'bg-[length:200%_auto] animate-gradient' : ''
      } ${className}`}
    >
      {children}
    </span>
  )
}
