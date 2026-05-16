'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, Medal, Award } from 'lucide-react'

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
      {top3.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[top3[1], top3[0], top3[2]].map((user, idx) => {
            if (!user) return <div key={idx} />
            const realRank = idx === 0 ? 2 : idx === 1 ? 1 : 3
            const icons = [
              <Medal key="2" className="w-6 h-6 text-gray-400" />,
              <Trophy key="1" className="w-8 h-8 text-yellow-500" />,
              <Award key="3" className="w-6 h-6 text-amber-600" />
            ]
            return (
              <Card
                key={user.id}
                className={`text-center ${realRank === 1 ? 'border-yellow-500/50 scale-105' : ''} ${user.id === currentUserId ? 'border-primary' : ''}`}
              >
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-center">
                    {icons[idx]}
                  </div>
                  <Avatar className="mx-auto w-12 h-12">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback>
                      {user.full_name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <p className="font-semibold text-sm truncate">
                    {user.full_name || 'Anonymous'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {getUniversity(user.university_id)}
                  </p>
                  <p className="text-xl font-bold text-primary">
                    {user.akili_score}
                  </p>
                  <Badge variant="secondary" className="text-xs">
                    {getTitle(user.akili_score)}
                  </Badge>
                </CardContent>
              </Card>
            )
          })}
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
