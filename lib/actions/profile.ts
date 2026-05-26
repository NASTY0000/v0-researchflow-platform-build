'use server'
import { createServiceRoleClient } from '@/lib/supabase/admin'

export async function getEarnedBadges(userId: string, akiliScore: number, connectionsCount: number) {
  const admin = createServiceRoleClient()
  const badges: string[] = []

  const [mentorRes, showcaseRes, teamRes] = await Promise.all([
    admin.from('mentor_profiles').select('id').eq('user_id', userId).eq('is_verified', true).maybeSingle(),
    admin.from('showcase_submissions').select('id', { count: 'exact', head: true }).eq('submitted_by', userId).eq('status', 'approved'),
    admin.from('team_members').select('team_id').eq('user_id', userId),
  ])

  if (mentorRes.data) badges.push('Verified Mentor')
  if (akiliScore >= 1000) badges.push('Active Contributor')
  if ((showcaseRes.count ?? 0) > 0) badges.push('Research Publisher')
  if (connectionsCount >= 10) badges.push('Connector')

  // Team builder: find if any team they lead has 3+ members
  if (teamRes.data && teamRes.data.length > 0) {
    const teamIds = teamRes.data.map(t => t.team_id)
    for (const teamId of teamIds) {
      const { count } = await admin.from('team_members').select('id', { count: 'exact', head: true }).eq('team_id', teamId)
      if ((count ?? 0) >= 3) { badges.push('Team Builder'); break }
    }
  }

  return badges
}
