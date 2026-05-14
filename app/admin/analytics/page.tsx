import { redirect } from 'next/navigation'
import { assertAdmin, createServiceRoleClient } from '@/lib/supabase/admin'
import { AdminAnalyticsClient } from '@/components/admin/admin-analytics-client'
import type { AnalyticsBundle } from '@/components/admin/admin-analytics-client'

function weekKey(d: Date) {
  const y = d.getFullYear()
  const oneJan = new Date(y, 0, 1)
  const week = Math.ceil(((d.getTime() - oneJan.getTime()) / 86400000 + oneJan.getDay() + 1) / 7)
  return `${y}-W${String(week).padStart(2, '0')}`
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default async function AdminAnalyticsPage() {
  const gate = await assertAdmin()
  if (!gate.ok) redirect('/dashboard')

  const admin = createServiceRoleClient()
  const now = new Date()
  const twelveWeeksAgo = new Date(now)
  twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 12 * 7)

  const [
    { data: profiles },
    { data: ideas },
    { data: teams },
    { data: tasks },
    { data: showcase },
  ] = await Promise.all([
    admin.from('profiles').select('id, created_at, akili_score, university_id, university:universities(name)'),
    admin.from('research_ideas').select('id, created_at, tags, author_id'),
    admin.from('teams').select('created_at, idea_id'),
    admin.from('tasks').select('created_at, status'),
    admin.from('showcase_entries').select('created_at, status, published_at'),
  ])

  const ideaCreated = new Map<string, Date>()
  ;(ideas || []).forEach((row: { id: string; created_at: string }) => {
    ideaCreated.set(row.id, new Date(row.created_at))
  })
  const diffs: number[] = []
  ;(teams || []).forEach((row: { created_at: string; idea_id: string | null }) => {
    if (!row.idea_id) return
    const ic = ideaCreated.get(row.idea_id)
    if (!ic) return
    const days = (new Date(row.created_at).getTime() - ic.getTime()) / 86400000
    if (days >= 0 && days < 365 * 5) diffs.push(days)
  })
  const avgIdeaToTeamDays = diffs.length ? diffs.reduce((a, b) => a + b, 0) / diffs.length : null

  const weeklyMap = new Map<string, number>()
  for (let i = 0; i < 12; i++) {
    const w = new Date(now)
    w.setDate(w.getDate() - (11 - i) * 7)
    weeklyMap.set(weekKey(w), 0)
  }
  ;(profiles || []).forEach((p: { created_at: string }) => {
    const d = new Date(p.created_at)
    if (d < twelveWeeksAgo) return
    const k = weekKey(d)
    weeklyMap.set(k, (weeklyMap.get(k) || 0) + 1)
  })
  const weeklySignups = Array.from(weeklyMap.entries()).map(([week, count]) => ({ week, count }))

  const months: string[] = []
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1)
    months.push(monthKey(d))
  }
  const monthlyActivity = months.map((m) => ({ month: m, ideas: 0, teams: 0, tasksDone: 0 }))
  const idx = (m: string) => monthlyActivity.findIndex((x) => x.month === m)
  ;(ideas || []).forEach((row: { created_at: string }) => {
    const mk = monthKey(new Date(row.created_at))
    const i = idx(mk)
    if (i >= 0) monthlyActivity[i].ideas += 1
  })
  ;(teams || []).forEach((row: { created_at: string }) => {
    const mk = monthKey(new Date(row.created_at))
    const i = idx(mk)
    if (i >= 0) monthlyActivity[i].teams += 1
  })
  ;(tasks || []).forEach((row: { created_at: string; status: string }) => {
    if (row.status !== 'done') return
    const mk = monthKey(new Date(row.created_at))
    const i = idx(mk)
    if (i >= 0) monthlyActivity[i].tasksDone += 1
  })

  const uniCount = new Map<string, number>()
  ;(profiles || []).forEach(
    (p: { university?: { name?: string } | null; university_id?: string | null }) => {
      const name = p.university?.name || 'Unknown'
      uniCount.set(name, (uniCount.get(name) || 0) + 1)
    },
  )
  const uniUsers = Array.from(uniCount.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  const buckets = ['0', '1–20', '21–40', '41–60', '61–80', '81–100', '100+']
  const akiliBuckets = buckets.map((bucket) => ({ bucket, count: 0 }))
  const bump = (s: number) => {
    if (s <= 0) akiliBuckets[0].count += 1
    else if (s <= 20) akiliBuckets[1].count += 1
    else if (s <= 40) akiliBuckets[2].count += 1
    else if (s <= 60) akiliBuckets[3].count += 1
    else if (s <= 80) akiliBuckets[4].count += 1
    else if (s <= 100) akiliBuckets[5].count += 1
    else akiliBuckets[6].count += 1
  }
  ;(profiles || []).forEach((p: { akili_score?: number }) => bump(Number(p.akili_score ?? 0)))

  const showcaseMonthly = months.map((m) => ({ month: m, submissions: 0, approvals: 0 }))
  const sIdx = (m: string) => showcaseMonthly.findIndex((x) => x.month === m)
  ;(showcase || []).forEach(
    (s: { created_at: string; status: string; published_at: string | null }) => {
      const c = sIdx(monthKey(new Date(s.created_at)))
      if (c >= 0) showcaseMonthly[c].submissions += 1
      if (s.published_at && ['published', 'featured'].includes(s.status)) {
        const p = sIdx(monthKey(new Date(s.published_at)))
        if (p >= 0) showcaseMonthly[p].approvals += 1
      }
    },
  )

  const scores = (profiles || []).map((p: { akili_score?: number }) => Number(p.akili_score ?? 0))
  const avgAkili = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null

  const tagCount = new Map<string, number>()
  ;(ideas || []).forEach((row: { tags?: string[] }) => {
    ;(row.tags || []).forEach((t) => tagCount.set(t, (tagCount.get(t) || 0) + 1))
  })
  const topTags = Array.from(tagCount.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12)

  const ideasByAuthor = new Map<string, number>()
  ;(ideas || []).forEach((row: { author_id: string }) => {
    ideasByAuthor.set(row.author_id, (ideasByAuthor.get(row.author_id) || 0) + 1)
  })
  const authorUni = new Map<string, string>()
  ;(profiles || []).forEach(
    (p: { id: string; university?: { name?: string } | null }) => {
      authorUni.set(p.id, p.university?.name || 'Unknown')
    },
  )
  const uniIdeas = new Map<string, number>()
  ideasByAuthor.forEach((cnt, authorId) => {
    const u = authorUni.get(authorId) || 'Unknown'
    uniIdeas.set(u, (uniIdeas.get(u) || 0) + cnt)
  })
  const topUniOutput = Array.from(uniIdeas.entries())
    .map(([name, ideas]) => ({ name, ideas }))
    .sort((a, b) => b.ideas - a.ideas)
    .slice(0, 5)

  const bundle: AnalyticsBundle = {
    weeklySignups,
    monthlyActivity,
    uniUsers,
    akiliBuckets,
    showcaseMonthly,
    stats: {
      avgIdeaToTeamDays,
      avgAkili,
      topTags,
      topUniOutput,
    },
  }

  return <AdminAnalyticsClient data={bundle} />
}
