'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Crown, Medal, Award } from 'lucide-react'
import { getAkiliTitle } from '@/lib/constants/akili'

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


function getUniversity(uid: string | null | undefined): string {
  if (!uid) return ''
  if (uid.length === 36 && uid.includes('-')) return ''
  return uid
}

export default function LeaderboardPage() {
  const [users, setUsers] = useState<LeaderboardUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (user) setCurrentUserId(user.id)

        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, department, university_id, akili_score, akili_dimension_knowledge, akili_dimension_collaboration, akili_dimension_mentorship, akili_dimension_technical')
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
  const currentUserRank = users.findIndex(u => u.id === currentUserId) + 1

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Akili Leaderboard</h1>
        <p className="text-muted-foreground mt-1">Top researchers on ResearchFlow</p>
        {currentUserRank > 0 && (
          <p className="text-sm text-primary mt-1">Your rank: #{currentUserRank}</p>
        )}
      </div>

      {/* Top 3 Podium */}
      {top3.length > 0 && (
        <div className="grid grid-cols-3 gap-3 items-end mb-8">

          {/* 2ND PLACE — SILVER */}
          <Link
            href={top3[1]?.id ? `/profile/${top3[1].id}` : '#'}
            className="relative rounded-2xl overflow-hidden border-2 border-gray-400 dark:border-gray-500 block cursor-pointer hover:scale-[1.06] transition-transform duration-300"
            style={{
              background: 'linear-gradient(135deg, #E5E7EB, #9CA3AF, #6B7280)',
              minHeight: '260px',
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateX(0)' : 'translateX(-50px)',
              transition: 'opacity 0.6s ease 0.3s, transform 0.6s ease 0.3s',
            }}
          >
            {/* Silver diagonal glow overlay */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.25) 50%, transparent 70%)',
                backgroundSize: '250% 250%',
                animation: mounted ? 'silverDiagonalGlow 4s ease-in-out 1s infinite' : 'none',
              }}
            />

            <div className="relative z-10 p-4 flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center font-bold text-gray-700 text-sm shadow-md">
                2
              </div>
              <Medal className="w-7 h-7 text-gray-200" />
              <Avatar className="w-14 h-14 border-2 border-white/50 shadow-lg">
                <AvatarImage src={top3[1]?.avatar_url || undefined} />
                <AvatarFallback className="bg-gray-500 text-white font-bold">
                  {top3[1]?.full_name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              <p className="font-bold text-sm text-white text-center leading-tight drop-shadow-md">
                {top3[1]?.full_name || 'Anonymous'}
              </p>
              {getUniversity(top3[1]?.university_id) && (
                <p className="text-xs text-gray-200 text-center truncate w-full drop-shadow-sm">
                  {getUniversity(top3[1]?.university_id)}
                </p>
              )}
              <div style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'scale(1)' : 'scale(0.6)',
                transition: 'opacity 0.4s ease 0.9s, transform 0.4s ease 0.9s',
              }}>
                <p className="text-2xl font-black text-white drop-shadow-lg text-center">
                  {(top3[1]?.akili_score || 0).toLocaleString()}
                </p>
              </div>
              <span className="text-xs text-gray-200 font-medium drop-shadow-sm text-center">🥈 Runner Up</span>
              <Badge className="text-xs bg-white/20 text-white border-white/30">
                {getAkiliTitle(top3[1]?.akili_score || 0)}
              </Badge>
            </div>
          </Link>

          {/* 1ST PLACE — GOLD (center, tallest) */}
          <Link
            href={top3[0]?.id ? `/profile/${top3[0].id}` : '#'}
            className="relative rounded-2xl overflow-hidden border-2 border-yellow-400 cursor-pointer z-10 hover:scale-[1.05] transition-transform duration-300 block"
            style={{
              background: 'linear-gradient(135deg, #FCD34D, #F59E0B, #D97706, #92400E)',
              minHeight: '310px',
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateY(0) scale(1)' : 'translateY(-60px) scale(0.85)',
              transition: 'opacity 0.7s ease 0s, transform 0.7s cubic-bezier(0.34,1.4,0.64,1) 0s',
              boxShadow: mounted
                ? '0 0 30px rgba(245,158,11,0.6), 0 0 60px rgba(245,158,11,0.3)'
                : 'none',
            }}
          >
            {/* Gold diagonal glow overlay */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(135deg, transparent 25%, rgba(255,255,255,0.35) 50%, transparent 75%)',
                backgroundSize: '250% 250%',
                animation: mounted ? 'goldDiagonalGlow 3s ease-in-out 0.8s infinite' : 'none',
              }}
            />

            <div className="relative z-10 p-4 flex flex-col items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-yellow-300 border-2 border-white flex items-center justify-center font-black text-yellow-900 text-base shadow-lg">
                1
              </div>
              <div style={{
                animation: mounted ? 'crownFloat 2.5s ease-in-out infinite' : 'none',
                display: 'inline-block',
              }}>
                <Crown className="w-10 h-10 text-yellow-200 drop-shadow-lg" />
              </div>
              <Avatar className="w-20 h-20 border-4 border-yellow-200/70 shadow-xl">
                <AvatarImage src={top3[0]?.avatar_url || undefined} />
                <AvatarFallback className="bg-yellow-600 text-white font-black text-2xl">
                  {top3[0]?.full_name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              <p className="font-black text-base text-white text-center leading-tight drop-shadow-lg">
                {top3[0]?.full_name || 'Anonymous'}
              </p>
              {getUniversity(top3[0]?.university_id) && (
                <p className="text-xs text-yellow-100 text-center truncate w-full drop-shadow-sm">
                  {getUniversity(top3[0]?.university_id)}
                </p>
              )}
              <div style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'scale(1)' : 'scale(0.6)',
                transition: 'opacity 0.4s ease 0.8s, transform 0.4s ease 0.8s',
              }}>
                <p className="text-4xl font-black text-white drop-shadow-xl text-center">
                  {(top3[0]?.akili_score || 0).toLocaleString()}
                </p>
              </div>
              <span className="text-sm text-yellow-100 font-bold drop-shadow-md text-center">🥇 Champion</span>
              <Badge className="text-xs bg-white/25 text-white border-white/40 font-medium">
                {getAkiliTitle(top3[0]?.akili_score || 0)}
              </Badge>
            </div>
          </Link>

          {/* 3RD PLACE — BRONZE */}
          <Link
            href={top3[2]?.id ? `/profile/${top3[2].id}` : '#'}
            className="relative rounded-2xl overflow-hidden border-2 border-amber-600 dark:border-amber-700 cursor-pointer hover:scale-105 transition-transform duration-300 block"
            style={{
              background: 'linear-gradient(135deg, #FCD34D, #D97706, #92400E, #78350F)',
              minHeight: '240px',
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateX(0)' : 'translateX(50px)',
              transition: 'opacity 0.6s ease 0.5s, transform 0.6s ease 0.5s',
            }}
          >
            {/* Bronze diagonal glow overlay */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.2) 50%, transparent 70%)',
                backgroundSize: '250% 250%',
                animation: mounted ? 'bronzeDiagonalGlow 4.5s ease-in-out 1.2s infinite' : 'none',
              }}
            />

            <div className="relative z-10 p-4 flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-600 border-2 border-white flex items-center justify-center font-bold text-white text-sm shadow-md">
                3
              </div>
              <Award className="w-7 h-7 text-amber-200" />
              <Avatar className="w-14 h-14 border-2 border-white/50 shadow-lg">
                <AvatarImage src={top3[2]?.avatar_url || undefined} />
                <AvatarFallback className="bg-amber-700 text-white font-bold">
                  {top3[2]?.full_name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              <p className="font-bold text-sm text-white text-center leading-tight drop-shadow-md">
                {top3[2]?.full_name || 'Anonymous'}
              </p>
              {getUniversity(top3[2]?.university_id) && (
                <p className="text-xs text-amber-100 text-center truncate w-full drop-shadow-sm">
                  {getUniversity(top3[2]?.university_id)}
                </p>
              )}
              <div style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'scale(1)' : 'scale(0.6)',
                transition: 'opacity 0.4s ease 1.1s, transform 0.4s ease 1.1s',
              }}>
                <p className="text-2xl font-black text-white drop-shadow-lg text-center">
                  {(top3[2]?.akili_score || 0).toLocaleString()}
                </p>
              </div>
              <span className="text-xs text-amber-100 font-medium drop-shadow-sm text-center">🥉 Third Place</span>
              <Badge className="text-xs bg-white/20 text-white border-white/30">
                {getAkiliTitle(top3[2]?.akili_score || 0)}
              </Badge>
            </div>
          </Link>

        </div>
      )}

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
              {users.slice(3).map((user, index) => (
                <div
                  key={user.id}
                  className={`flex items-center gap-4 p-3 rounded-lg transition-colors
                    ${user.id === currentUserId
                      ? 'bg-primary/10 border border-primary/30'
                      : 'hover:bg-muted/40'
                    }`}
                >
                  {user.id === currentUserId ? (
                    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm bg-gradient-to-br from-yellow-400/20 to-yellow-600/40 border border-yellow-500/40 text-yellow-400 shadow-inner">
                      {index + 4}
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm bg-gradient-to-br from-purple-500/20 to-purple-900/40 border border-purple-500/30 text-purple-300 shadow-inner">
                      {index + 4}
                    </div>
                  )}
                  <Link href={`/profile/${user.id}`} className="flex-shrink-0 group">
                    <Avatar className="w-9 h-9 cursor-pointer group-hover:ring-2 group-hover:ring-primary/50 transition-all duration-200">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback>
                        {user.full_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/profile/${user.id}`} className="hover:text-primary hover:underline transition-colors">
                      <p className="font-medium text-sm truncate">
                        {user.full_name || 'Anonymous'}
                        {user.id === currentUserId && (
                          <span className="ml-2 text-xs text-primary">(you)</span>
                        )}
                      </p>
                    </Link>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.department}
                      {user.department && getUniversity(user.university_id) && ' · '}
                      {getUniversity(user.university_id)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">
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
