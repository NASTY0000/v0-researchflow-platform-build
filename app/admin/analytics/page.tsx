'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts'
import { TrendingUp, Users, Lightbulb, Award, BookOpen } from 'lucide-react'

interface MonthlyPoint { month: string; count: number }
interface UniversityCount { name: string; count: number }
interface AkiliBucket { range: string; count: number }

interface AnalyticsData {
  userGrowth: MonthlyPoint[]
  researchActivity: MonthlyPoint[]
  usersByUniversity: UniversityCount[]
  akiliDistribution: AkiliBucket[]
  showcaseActivity: MonthlyPoint[]
}

const PURPLE = '#A855F7'
const CYAN = '#22D3EE'
const GREEN = '#4ADE80'
const ORANGE = '#FB923C'
const PINK = '#F472B6'

function tooltipStyle() {
  return {
    contentStyle: { background: '#0F0A1E', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 8 },
    labelStyle: { color: '#C4B5D8', fontSize: 12 },
    itemStyle: { color: '#A855F7', fontSize: 12 },
  }
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    async function load() {
      setIsLoading(true)

      // Build last 6 months labels
      const months: { label: string; start: string; end: string }[] = []
      for (let i = 5; i >= 0; i--) {
        const d = new Date()
        d.setDate(1)
        d.setMonth(d.getMonth() - i)
        const start = d.toISOString().slice(0, 10)
        const endD = new Date(d)
        endD.setMonth(endD.getMonth() + 1)
        const end = endD.toISOString().slice(0, 10)
        months.push({ label: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }), start, end })
      }

      // Fetch raw data in parallel
      const [profilesRes, ideasRes, showcaseRes, uniRes, akiliRes] = await Promise.all([
        supabase.from('profiles').select('created_at').gte('created_at', months[0].start),
        supabase.from('research_ideas').select('created_at').gte('created_at', months[0].start),
        supabase.from('showcase_submissions').select('submitted_at').gte('submitted_at', months[0].start),
        supabase.from('profiles').select('university_id').not('university_id', 'is', null),
        supabase.from('profiles').select('akili_score').not('akili_score', 'is', null),
      ])

      // User growth per month
      const userGrowth = months.map(m => ({
        month: m.label,
        count: (profilesRes.data || []).filter((p: { created_at: string }) =>
          p.created_at >= m.start && p.created_at < m.end
        ).length,
      }))

      // Research activity (ideas) per month
      const researchActivity = months.map(m => ({
        month: m.label,
        count: (ideasRes.data || []).filter((p: { created_at: string }) =>
          p.created_at >= m.start && p.created_at < m.end
        ).length,
      }))

      // Showcase submissions per month
      const showcaseActivity = months.map(m => ({
        month: m.label,
        count: (showcaseRes.data || []).filter((p: { submitted_at: string }) =>
          p.submitted_at >= m.start && p.submitted_at < m.end
        ).length,
      }))

      // Users by university (top 8)
      const uniMap: Record<string, number> = {}
      ;(uniRes.data || []).forEach((p: { university_id: string }) => {
        if (p.university_id) uniMap[p.university_id] = (uniMap[p.university_id] || 0) + 1
      })
      const usersByUniversity = Object.entries(uniMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([name, count]) => ({ name: name.length > 20 ? name.slice(0, 20) + '…' : name, count }))

      // Akili score distribution
      const buckets = [
        { range: '0–500', min: 0, max: 500 },
        { range: '501–1000', min: 501, max: 1000 },
        { range: '1001–2000', min: 1001, max: 2000 },
        { range: '2001–5000', min: 2001, max: 5000 },
        { range: '5000+', min: 5001, max: Infinity },
      ]
      const akiliDistribution = buckets.map(b => ({
        range: b.range,
        count: (akiliRes.data || []).filter((p: { akili_score: number }) =>
          p.akili_score >= b.min && p.akili_score <= b.max
        ).length,
      }))

      setData({ userGrowth, researchActivity, usersByUniversity, akiliDistribution, showcaseActivity })
      setIsLoading(false)
    }

    load()
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-heading">Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">Platform growth and activity metrics</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-64 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">Platform growth and activity metrics (last 6 months)</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* User Growth */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />User Growth
            </CardTitle>
            <CardDescription>New user registrations per month</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.1)" />
                <XAxis dataKey="month" tick={{ fill: '#7C6A9C', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#7C6A9C', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip {...tooltipStyle()} />
                <Line type="monotone" dataKey="count" stroke={PURPLE} strokeWidth={2} dot={{ fill: PURPLE, r: 4 }} name="Users" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Research Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-cyan-400" />Research Activity
            </CardTitle>
            <CardDescription>New research ideas posted per month</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.researchActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.1)" />
                <XAxis dataKey="month" tick={{ fill: '#7C6A9C', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#7C6A9C', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip {...tooltipStyle()} />
                <Bar dataKey="count" fill={CYAN} radius={[4, 4, 0, 0]} name="Ideas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Users by University */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" />Users by University
            </CardTitle>
            <CardDescription>Top 8 universities by user count</CardDescription>
          </CardHeader>
          <CardContent>
            {data.usersByUniversity.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
                No university data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.usersByUniversity} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.1)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#7C6A9C', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" tick={{ fill: '#7C6A9C', fontSize: 10 }} axisLine={false} tickLine={false} width={90} />
                  <Tooltip {...tooltipStyle()} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} name="Users">
                    {data.usersByUniversity.map((_, i) => (
                      <Cell key={i} fill={`hsl(${260 + i * 12}, 70%, ${55 + i * 2}%)`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Akili Score Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-orange-400" />Akili Score Distribution
            </CardTitle>
            <CardDescription>Number of users in each score range</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.akiliDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.1)" />
                <XAxis dataKey="range" tick={{ fill: '#7C6A9C', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#7C6A9C', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip {...tooltipStyle()} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Users">
                  {data.akiliDistribution.map((_, i) => (
                    <Cell key={i} fill={[PURPLE, CYAN, GREEN, ORANGE, PINK][i % 5]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Showcase Activity */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="w-4 h-4 text-pink-400" />Showcase Activity
            </CardTitle>
            <CardDescription>Showcase submissions per month</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.showcaseActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.1)" />
                <XAxis dataKey="month" tick={{ fill: '#7C6A9C', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#7C6A9C', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip {...tooltipStyle()} />
                <Bar dataKey="count" fill={PINK} radius={[4, 4, 0, 0]} name="Submissions" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
