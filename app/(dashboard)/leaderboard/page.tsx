'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BackToHub } from '@/components/ui/back-to-hub'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Crown } from 'lucide-react'
import Link from 'next/link'
import { ListPageSkeleton } from '@/components/ui/skeleton-screens'
import { getAkiliTitle } from '@/lib/constants/akili'

interface LeaderboardUser {
  id: string
  full_name: string | null
  avatar_url: string | null
  department: string | null
  university_id: string | null
  akili_score: number
}

function getUniversity(uid: string | null | undefined): string {
  if (!uid) return ''
  if (uid.length === 36 && uid.includes('-')) return ''
  return uid
}

// Medal treatment for the top three ranks; everyone else gets a plain numeral.
const MEDALS: Record<number, { color: string; ring: string }> = {
  1: { color: 'text-yellow-400', ring: 'border-yellow-400/50 bg-yellow-400/10' },
  2: { color: 'text-slate-300', ring: 'border-slate-300/40 bg-slate-300/10' },
  3: { color: 'text-amber-600', ring: 'border-amber-600/50 bg-amber-600/10' },
}

export default function LeaderboardPage() {
  const [users, setUsers] = useState<LeaderboardUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (user) setCurrentUserId(user.id)

        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, department, university_id, akili_score')
          .eq('onboarding_completed', true)
          .order('akili_score', { ascending: false })
          .limit(50)

        if (fetchError) {
          setError(fetchError.message)
          setLoading(false)
          return
        }

        setUsers(data || [])
        setLoading(false)
      } catch (err) {
        setError(String(err))
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return <div className="max-w-3xl mx-auto px-4 py-8"><ListPageSkeleton type="profile" count={6} /></div>
  }

  if (error) {
    return (
      <div className="p-8 text-center text-destructive">
        Error loading leaderboard: {error}
      </div>
    )
  }

  const currentUserRank = users.findIndex(u => u.id === currentUserId) + 1

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <BackToHub href="/community" label="Back to Community" />

      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold font-heading">Akili Leaderboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Top researchers on ResearchFlow</p>
        </div>
        {currentUserRank > 0 && (
          <span className="text-sm font-semibold text-primary border border-primary/40 bg-primary/10 rounded-full px-3.5 py-1.5">
            Your rank: #{currentUserRank}
          </span>
        )}
      </div>

      {users.length === 0 ? (
        <p className="text-center text-muted-foreground py-16">No researchers found.</p>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border/60">
          {users.map((user, index) => {
            const rank = index + 1
            const medal = MEDALS[rank]
            const isMe = user.id === currentUserId
            const university = getUniversity(user.university_id)

            return (
              <div
                key={user.id}
                className={`flex items-center gap-4 px-4 py-3 transition-colors ${
                  isMe ? 'bg-primary/10' : 'hover:bg-muted/40'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-full border flex items-center justify-center shrink-0 font-bold text-sm tabular-nums ${
                    medal ? `${medal.color} ${medal.ring}` : 'text-muted-foreground border-transparent'
                  }`}
                >
                  {rank === 1 ? <Crown className="w-4 h-4" /> : rank}
                </div>

                <Link href={`/profile/${user.id}`} className="shrink-0">
                  <Avatar className={`${medal ? 'w-11 h-11' : 'w-9 h-9'} hover:ring-2 hover:ring-primary/50 transition-all`}>
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback className={medal ? 'bg-primary text-primary-foreground font-bold' : ''}>
                      {user.full_name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                </Link>

                <div className="flex-1 min-w-0">
                  <Link href={`/profile/${user.id}`} className="hover:text-primary transition-colors">
                    <p className={`truncate text-sm ${medal ? 'font-bold' : 'font-medium'}`}>
                      {user.full_name || 'Anonymous'}
                      {isMe && <span className="ml-2 text-xs text-primary font-semibold">(you)</span>}
                    </p>
                  </Link>
                  {(user.department || university) && (
                    <p className="text-xs text-muted-foreground truncate">
                      {user.department}
                      {user.department && university && ' · '}
                      {university}
                    </p>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <p className={`font-bold tabular-nums ${medal ? `text-base ${medal.color}` : 'text-sm text-primary'}`}>
                    {user.akili_score.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">{getAkiliTitle(user.akili_score)}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
