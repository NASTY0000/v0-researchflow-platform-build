'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { createClient } from '@/lib/supabase/client'

interface UserHoverCardProps {
  userId: string
  name: string | null
  avatarUrl?: string | null
  children: React.ReactNode
}

export function UserHoverCard({ userId, name, avatarUrl, children }: UserHoverCardProps) {
  const [profile, setProfile] = useState<any>(null)
  const [loaded, setLoaded] = useState(false)

  async function loadProfile() {
    if (loaded) return
    setLoaded(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('profiles')
      .select('full_name, avatar_url, department, university_id, akili_score, skills, bio')
      .eq('id', userId)
      .single()
    setProfile(data)
  }

  return (
    <HoverCard openDelay={300} closeDelay={100}>
      <HoverCardTrigger asChild onMouseEnter={loadProfile}>
        {children}
      </HoverCardTrigger>
      <HoverCardContent className="w-72" side="top" align="start">
        {profile ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-lg">
                  {profile.full_name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-semibold text-sm leading-tight truncate">{profile.full_name}</p>
                {profile.department && (
                  <p className="text-xs text-muted-foreground truncate">{profile.department}</p>
                )}
                {profile.akili_score > 0 && (
                  <p className="text-xs text-primary font-medium mt-0.5">
                    {profile.akili_score.toLocaleString()} Akili
                  </p>
                )}
              </div>
            </div>

            {profile.bio && (
              <p className="text-xs text-muted-foreground line-clamp-2">{profile.bio}</p>
            )}

            {profile.skills?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {profile.skills.slice(0, 3).map((s: string) => (
                  <Badge key={s} variant="secondary" className="text-xs">
                    {s}
                  </Badge>
                ))}
              </div>
            )}

            <Link href={`/profile/${userId}`} className="block w-full">
              <Button size="sm" variant="outline" className="w-full">
                View Profile
              </Button>
            </Link>
          </div>
        ) : (
          <div className="flex justify-center py-4">
            <div className="w-6 h-6 rounded-full animate-spin border-2 border-primary border-t-transparent" />
          </div>
        )}
      </HoverCardContent>
    </HoverCard>
  )
}
