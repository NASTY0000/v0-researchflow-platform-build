'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BackToHub } from '@/components/ui/back-to-hub'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Crown, Medal, Award } from 'lucide-react'
import Link from 'next/link'
import { ListPageSkeleton } from '@/components/ui/skeleton-screens'
import { getAkiliTitle } from '@/lib/constants/akili'
import { useReducedMotion } from 'framer-motion'

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

// One config per medal. Gold is warm yellow, silver cool gray, bronze copper —
// three clearly distinct metals (bronze previously shared gold's stops).
const PODIUM = [
  {
    rank: 1,
    label: 'Champion',
    icon: Crown,
    gradient: 'linear-gradient(135deg, #FCD34D, #F59E0B, #D97706, #92400E)',
    border: 'border-yellow-400',
    accentText: 'text-yellow-100',
    numberChip: 'bg-yellow-300 text-yellow-900',
    avatarRing: 'border-yellow-200/70',
    avatarFallback: 'bg-yellow-600',
    glow: '0 0 30px rgba(245,158,11,0.6), 0 0 60px rgba(245,158,11,0.3)',
    shine: 'goldDiagonalGlow 3s ease-in-out 0.8s infinite',
    order: 'sm:order-2',
    height: 'sm:min-h-[310px]',
    scale: true,
  },
  {
    rank: 2,
    label: 'Runner Up',
    icon: Medal,
    gradient: 'linear-gradient(135deg, #8A919E, #5B6472, #394252)',
    border: 'border-gray-400 dark:border-gray-500',
    accentText: 'text-gray-200',
    numberChip: 'bg-gray-300 text-gray-700',
    avatarRing: 'border-white/50',
    avatarFallback: 'bg-gray-500',
    glow: undefined,
    shine: 'silverDiagonalGlow 4s ease-in-out 1s infinite',
    order: 'sm:order-1',
    height: 'sm:min-h-[260px]',
    scale: false,
  },
  {
    rank: 3,
    label: 'Third Place',
    icon: Award,
    gradient: 'linear-gradient(135deg, #C2723A, #A05A2C, #78350F, #57250B)',
    border: 'border-amber-700',
    accentText: 'text-amber-100',
    numberChip: 'bg-amber-600 text-white',
    avatarRing: 'border-white/50',
    avatarFallback: 'bg-amber-700',
    glow: undefined,
    shine: 'bronzeDiagonalGlow 4.5s ease-in-out 1.2s infinite',
    order: 'sm:order-3',
    height: 'sm:min-h-[240px]',
    scale: false,
  },
] as const

function PodiumCard({
  user,
  config,
  reduceMotion,
}: {
  user: LeaderboardUser
  config: (typeof PODIUM)[number]
  reduceMotion: boolean
}) {
  const Icon = config.icon
  const first = config.rank === 1
  const university = getUniversity(user.university_id)

  return (
    <div
      className={`relative rounded-2xl overflow-hidden border-2 ${config.border} ${config.order} ${config.height} ${first ? 'z-10' : 'sm:self-end'}`}
      style={{ background: config.gradient, boxShadow: config.glow }}
    >
      {/* Diagonal shine sweep — ambient only, skipped for reduced motion */}
      {!reduceMotion && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.25) 50%, transparent 70%)',
            backgroundSize: '250% 250%',
            animation: config.shine,
          }}
        />
      )}

      <div className="relative z-10 p-4 flex flex-col items-center gap-2">
        <div className={`${first ? 'w-9 h-9 text-base font-black' : 'w-8 h-8 text-sm font-bold'} rounded-full border-2 border-white flex items-center justify-center shadow-md ${config.numberChip}`}>
          {config.rank}
        </div>
        <div style={!reduceMotion && first ? { animation: 'crownFloat 2.5s ease-in-out infinite' } : undefined}>
          <Icon className={`${first ? 'w-10 h-10 text-yellow-200' : `w-7 h-7 ${config.accentText}`} drop-shadow-lg`} />
        </div>
        <Link href={`/profile/${user.id}`} className="hover:opacity-90 transition-opacity">
          <Avatar className={`${first ? 'w-20 h-20 border-4' : 'w-14 h-14 border-2'} ${config.avatarRing} shadow-lg hover:ring-2 hover:ring-white/50 transition-all`}>
            <AvatarImage src={user.avatar_url || undefined} />
            <AvatarFallback className={`${config.avatarFallback} text-white font-bold ${first ? 'text-2xl' : ''}`}>
              {user.full_name?.charAt(0) || '?'}
            </AvatarFallback>
          </Avatar>
        </Link>
        <Link href={`/profile/${user.id}`} className="hover:underline">
          <p className={`${first ? 'font-black text-base' : 'font-bold text-sm'} text-white text-center leading-tight drop-shadow-md`}>
            {user.full_name || 'Anonymous'}
          </p>
        </Link>
        {university && (
          <p className={`text-xs ${config.accentText} text-center truncate w-full drop-shadow-sm`}>{university}</p>
        )}
        <p className={`${first ? 'text-3xl' : 'text-2xl'} font-bold font-heading tabular-nums text-white drop-shadow-lg text-center`}>
          {(user.akili_score || 0).toLocaleString()}
        </p>
        <span className={`text-xs ${config.accentText} font-medium drop-shadow-sm`}>{config.label}</span>
        <Badge className="text-xs bg-white/20 text-white border-white/30">
          {getAkiliTitle(user.akili_score || 0)}
        </Badge>
      </div>
    </div>
  )
}

export default function LeaderboardPage() {
  const [users, setUsers] = useState<LeaderboardUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const reduceMotion = useReducedMotion() ?? false

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
    return <div className="max-w-4xl mx-auto px-4 py-8"><ListPageSkeleton type="profile" count={6} /></div>
  }

  if (error) {
    return (
      <div className="p-8 text-center text-destructive">
        Error loading leaderboard: {error}
      </div>
    )
  }

  const top3 = users.slice(0, 3)
  const currentUserRank = users.findIndex(u => u.id === currentUserId) + 1

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
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

      {/* Top 3 podium — DOM order 1-2-3 for assistive tech; visual 2-1-3 on
          larger screens via CSS order. Stacks champion-first on mobile. */}
      {top3.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:items-end">
          {top3.map((user, i) => (
            <PodiumCard key={user.id} user={user} config={PODIUM[i]} reduceMotion={reduceMotion} />
          ))}
        </div>
      )}

      {/* Rest of the field */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-heading">
            {users.length > 3 ? `Rankings 4–${users.length}` : 'All Researchers'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No researchers found.
            </p>
          ) : users.length <= 3 ? (
            <p className="text-center text-muted-foreground py-8">
              Everyone is on the podium. Invite more researchers to grow the field.
            </p>
          ) : (
            <div className="space-y-1">
              {users.slice(3).map((user, index) => (
                <div
                  key={user.id}
                  className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
                    user.id === currentUserId
                      ? 'bg-primary/10 border border-primary/30'
                      : 'hover:bg-muted/40'
                  }`}
                >
                  <span className={`w-8 text-center shrink-0 font-bold text-sm tabular-nums ${
                    user.id === currentUserId ? 'text-primary' : 'text-muted-foreground'
                  }`}>
                    {index + 4}
                  </span>
                  <Link href={`/profile/${user.id}`}>
                    <Avatar className="w-9 h-9 hover:ring-2 hover:ring-primary/50 transition-all">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback>
                        {user.full_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/profile/${user.id}`} className="hover:text-primary transition-colors">
                      <p className="font-medium text-sm truncate">
                        {user.full_name || 'Anonymous'}
                        {user.id === currentUserId && (
                          <span className="ml-2 text-xs text-primary font-semibold">(you)</span>
                        )}
                      </p>
                    </Link>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.department}
                      {user.department && getUniversity(user.university_id) && ' · '}
                      {getUniversity(user.university_id)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-primary tabular-nums">
                      {user.akili_score.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {getAkiliTitle(user.akili_score)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
