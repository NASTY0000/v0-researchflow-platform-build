'use client'

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

export type AnalyticsBundle = {
  weeklySignups: { week: string; count: number }[]
  monthlyActivity: { month: string; ideas: number; teams: number; tasksDone: number }[]
  uniUsers: { name: string; count: number }[]
  akiliBuckets: { bucket: string; count: number }[]
  showcaseMonthly: { month: string; submissions: number; approvals: number }[]
  stats: {
    avgIdeaToTeamDays: number | null
    avgAkili: number | null
    topTags: { tag: string; count: number }[]
    topUniOutput: { name: string; ideas: number }[]
  }
}

export function AdminAnalyticsClient({ data }: { data: AnalyticsBundle }) {
  return (
    <div className="space-y-10 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold font-heading">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Platform trends and distributions</p>
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">User growth (new signups per week, last 12 weeks)</h2>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.weeklySignups}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="week" tick={{ fill: '#888', fontSize: 11 }} />
              <YAxis tick={{ fill: '#888', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#12081f', border: '1px solid #444' }} />
              <Legend />
              <Line type="monotone" dataKey="count" name="Signups" stroke="#a855f7" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Research activity (per month)</h2>
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.monthlyActivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="month" tick={{ fill: '#888', fontSize: 11 }} />
              <YAxis tick={{ fill: '#888', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#12081f', border: '1px solid #444' }} />
              <Legend />
              <Bar dataKey="ideas" name="Ideas posted" fill="#7c3aed" />
              <Bar dataKey="teams" name="Teams formed" fill="#06b6d4" />
              <Bar dataKey="tasksDone" name="Tasks completed" fill="#22c55e" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Top 10 universities by users</h2>
        <div className="h-[360px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={data.uniUsers} margin={{ left: 24, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis type="number" tick={{ fill: '#888', fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={140} tick={{ fill: '#888', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#12081f', border: '1px solid #444' }} />
              <Bar dataKey="count" name="Users" fill="#c084fc" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Akili score distribution</h2>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.akiliBuckets}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="bucket" tick={{ fill: '#888', fontSize: 11 }} />
              <YAxis tick={{ fill: '#888', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#12081f', border: '1px solid #444' }} />
              <Bar dataKey="count" name="Users" fill="#f97316" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Showcase: submissions vs approvals</h2>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.showcaseMonthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="month" tick={{ fill: '#888', fontSize: 11 }} />
              <YAxis tick={{ fill: '#888', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#12081f', border: '1px solid #444' }} />
              <Legend />
              <Bar dataKey="submissions" name="Submissions" fill="#6366f1" />
              <Bar dataKey="approvals" name="Approvals" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border p-4 bg-card/30">
          <h3 className="text-sm font-medium text-muted-foreground">Avg. idea → team (days)</h3>
          <p className="text-2xl font-bold mt-1">
            {data.stats.avgIdeaToTeamDays != null ? data.stats.avgIdeaToTeamDays.toFixed(1) : '—'}
          </p>
        </div>
        <div className="rounded-lg border p-4 bg-card/30">
          <h3 className="text-sm font-medium text-muted-foreground">Avg. Akili score</h3>
          <p className="text-2xl font-bold mt-1">
            {data.stats.avgAkili != null ? data.stats.avgAkili.toFixed(1) : '—'}
          </p>
        </div>
        <div className="rounded-lg border p-4 bg-card/30 sm:col-span-2">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Most active research tags</h3>
          <ul className="text-sm space-y-1">
            {data.stats.topTags.map((t) => (
              <li key={t.tag} className="flex justify-between gap-2">
                <span>{t.tag}</span>
                <span className="text-muted-foreground">{t.count}</span>
              </li>
            ))}
            {data.stats.topTags.length === 0 && (
              <li className="text-muted-foreground">No tag data</li>
            )}
          </ul>
        </div>
        <div className="rounded-lg border p-4 bg-card/30 sm:col-span-2">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Top 5 universities by research output (ideas)</h3>
          <ul className="text-sm space-y-1">
            {data.stats.topUniOutput.map((u) => (
              <li key={u.name} className="flex justify-between gap-2">
                <span>{u.name}</span>
                <span className="text-muted-foreground">{u.ideas}</span>
              </li>
            ))}
            {data.stats.topUniOutput.length === 0 && (
              <li className="text-muted-foreground">No data</li>
            )}
          </ul>
        </div>
      </section>
    </div>
  )
}
