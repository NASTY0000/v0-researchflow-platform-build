import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface UserAvatarProps {
  userId: string
  name: string | null
  avatarUrl?: string | null
  size?: 'sm' | 'md' | 'lg'
  showName?: boolean
  clickable?: boolean
  className?: string
}

export function UserAvatar({
  userId,
  name,
  avatarUrl,
  size = 'md',
  showName = false,
  clickable = true,
  className,
}: UserAvatarProps) {
  const sizeClass = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  }[size]

  const avatar = (
    <Avatar className={cn(sizeClass, 'cursor-pointer ring-0 hover:ring-2 hover:ring-primary/50 transition-all duration-200', className)}>
      <AvatarImage src={avatarUrl || undefined} />
      <AvatarFallback>{name?.charAt(0) || '?'}</AvatarFallback>
    </Avatar>
  )

  if (!clickable) return avatar

  return (
    <Link
      href={`/profile/${userId}`}
      className="flex items-center gap-2 hover:opacity-80 transition-opacity"
    >
      {avatar}
      {showName && (
        <span className="text-sm font-medium hover:text-primary transition-colors">
          {name || 'Anonymous'}
        </span>
      )}
    </Link>
  )
}
