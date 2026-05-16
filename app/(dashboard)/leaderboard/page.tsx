'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Crown, Medal, Award } from 'lucide-react'

interface LeaderboardUser {
  id: string
  full_name: string | null
  avatar_url: string | null
  department: string | null
  university_id: string | null
  akili_score: number
  akili_dimension_knowledge: number
  akili_dimension_collaboration: number
  akili_dimension_mentorship: number
  akili_dimension_technical: number
}

function getTitle(score: number): string {
  if (score >= 20000) return 'Research Champion'
  if (score >= 12000) return 'Research Expert'
  if (score >= 8000) return 'Research Leader'
  if (score >= 5000) return 'Research Builder'
  if (score >= 2500) return 'Collaborative Researcher'
  if (score >= 1000) return 'Active Contributor'
  return 'Emerging Researcher'
}

function getUniversity(uid: string | null): string {
  if (!uid) return ''
  if (uid.length === 36 && uid.includes('-')) return ''
  return uid
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
          .select('id, full_name, avatar_url, department, university_id, akili_score, akili_dimension_knowledge, akili_dimension_collaboration, akili_dimension_mentorship, akili_dimension_technical')
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
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 rounded-full animate-spin border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center text-destructive">
        Error loading leaderboard: {error}
      </div>
    )
  }

  const top3 = users.slice(0, 3)
  const rest = users.slice(3)
  const currentUserRank = users.findIndex(u => u.id === currentUserId) + 1

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Akili Leaderboard</h1>
        <p className="text-muted-foreground mt-1">
          Top researchers on ResearchFlow
        </p>
        {currentUserRank > 0 && (
          <p className="text-sm text-primary mt-1">
            Your rank: #{currentUserRank}
          </p>
        )}
      </div>

      {/* Top 3 Podium */}
      {top3.length > 0 && (() => {
        const podiumOrder = [top3[1], top3[0], top3[2]]
        const configs = [
          {
            rank: 2,
            icon: <Medal className="w-8 h-8 text-gray-200" />,
            cardCls: 'bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 dark:from-gray-600 dark:via-gray-700 dark:to-gray-800',
            border: '2px solid #9CA3AF',
            rankBg: 'bg-white',
            rankTxt: 'text-gray-600',
            avatarCls: 'w-16 h-16',
            label: '🥈 Runner Up',
            cardStyle: {
              animation: 'slideInLeft 0.6s ease-out 0.2s forwards, pulseGlowSilver 3s ease-in-out 1.5s infinite',
              opacity: 0 as const,
            },
            scoreDelay: '0.9s',
          },
          {
            rank: 1,
            icon: <Crown className="w-10 h-10 text-yellow-200" />,
            cardCls: 'bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-700',
            border: '2px solid #F59E0B',
            rankBg: 'bg-white',
            rankTxt: 'text-yellow-600',
            avatarCls: 'w-20 h-20',
            label: '🥇 Champion',
            cardStyle: {
              animation: 'dropInBounce 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0s forwards, pulseGlow 3s ease-in-out 1s infinite',
              opacity: 0 as const,
            },
            scoreDelay: '0.8s',
            shimmer: true,
          },
          {
            rank: 3,
            icon: <Award className="w-8 h-8 text-yellow-200" />,
            cardCls: 'bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900 dark:from-amber-800 dark:via-amber-900 dark:to-stone-900',
            border: '2px solid #D97706',
            rankBg: 'bg-white',
            rankTxt: 'text-amber-700',
            avatarCls: 'w-16 h-16',
            label: '🥉 Third Place',
            cardStyle: {
              animation: 'slideInRight 0.6s ease-out 0.4s forwards, pulseGlowBronze 3s ease-in-out 2s infinite',
              opacity: 0 as const,
            },
            scoreDelay: '1s',
          },
        ]

        return (
          <div className="grid grid-cols-3 gap-4 items-end">
            {podiumOrder.map((user, idx) => {
              if (!user) return <div key={idx} />
              const cfg = configs[idx]
              const isFirst = cfg.rank === 1
              const hoverCls = isFirst
                ? 'transition-transform duration-300 hover:scale-[1.15] cursor-pointer'
                : 'transition-transform duration-300 hover:scale-105 cursor-pointer'
              return (
                <div
                  key={user.id}
                  className={`relative overflow-hidden rounded-2xl text-center ${cfg.cardCls} ${isFirst ? 'pt-8 pb-6' : 'pt-5 pb-5'} px-3 space-y-2.5 ${hoverCls} ${user.id === currentUserId ? 'ring-2 ring-white/60' : ''}`}
                  style={{ border: cfg.border, ...cfg.cardStyle }}
                >
                  {/* Shimmer overlay — gold only */}
                  {cfg.shimmer && (
                    <div className="absolute inset-0 rounded-xl pointer-events-none overflow-hidden">
                      <div style={{
                        position: 'absolute', inset: 0,
                        background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)',
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 3s linear infinite',
                      }} />
                    </div>
                  )}

                  {/* Icon */}
                  <div className="flex justify-center">
                    {isFirst ? (
                      <span style={{ animation: 'crownFloat 2s ease-in-out infinite', display: 'inline-block' }}>
                        {cfg.icon}
                      </span>
                    ) : cfg.icon}
                  </div>

                  {/* Rank badge */}
                  <div className="flex justify-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${cfg.rankBg} ${cfg.rankTxt}`}>
                      {cfg.rank}
                    </div>
                  </div>

                  {/* Avatar */}
                  <Avatar className={`mx-auto ${cfg.avatarCls} border-2 border-white/40`}>
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback className="bg-white/20 text-white font-bold text-lg">
                      {user.full_name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>

                  {/* Name */}
                  <p className={`font-bold truncate text-white ${isFirst ? 'text-base' : 'text-sm'}`}>
                    {user.full_name || 'Anonymous'}
                  </p>

                  {/* University */}
                  {getUniversity(user.university_id) && (
                    <p className="text-xs text-white/70 truncate">
                      {getUniversity(user.university_id)}
                    </p>
                  )}

                  {/* Score — pops in */}
                  <p className={`font-black ${isFirst ? 'text-3xl' : 'text-2xl'}`}>
                    <span style={{
                      display: 'inline-block',
                      animation: 'scoreCountUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                      animationDelay: cfg.scoreDelay,
                      opacity: 0,
                      color: 'white',
                    }}>
                      {user.akili_score.toLocaleString()}
                    </span>
                  </p>

                  {/* Title */}
                  <div className="flex justify-center">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 text-white font-medium">
                      {getTitle(user.akili_score)}
                    </span>
                  </div>

                  {/* Place label */}
                  <p className="text-xs font-semibold text-white/90">{cfg.label}</p>
                </div>
              )
            })}
          </div>
        )
      })()}

      {/* Full Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Researchers</CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No researchers found.
            </p>
          ) : (
            <div className="space-y-2">
              {users.map((user, index) => (
                <div
                  key={user.id}
                  className={`flex items-center gap-4 p-3 rounded-lg transition-colors
                    ${user.id === currentUserId
                      ? 'bg-primary/10 border border-primary/30'
                      : 'hover:bg-muted/40'
                    }`}
                >
                  <span className="w-8 text-center font-bold text-muted-foreground">
                    #{index + 1}
                  </span>
                  <Avatar className="w-9 h-9">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback>
                      {user.full_name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {user.full_name || 'Anonymous'}
                      {user.id === currentUserId && (
                        <span className="ml-2 text-xs text-primary">(you)</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.department}
                      {user.department && getUniversity(user.university_id) && ' · '}
                      {getUniversity(user.university_id)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">
                      {user.akili_score}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {getTitle(user.akili_score)}
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
