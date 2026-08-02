'use client'

import { useEffect, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import { Eye, Heart, Users, Handshake, BarChart2, Crown, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { getMyAnalytics } from '@/lib/actions/analytics'
import { formatDistanceToNow, format, parseISO, eachDayOfInterval, subDays } from 'date-fns'

type AnalyticsData = Awaited<ReturnType<typeof getMyAnalytics>>

// ── helpers ────────────────────────────────────────────────────────────────

function cardStyle(accent = false) {
  return {
    background: accent ? 'rgba(124,58,237,0.08)' : 'rgba(255,255,255,0.03)',
    border: `1px solid ${accent ? 'rgba(139,92,246,0.35)' : 'rgba(139,92,246,0.18)'}`,
    borderRadius: '16px',
    padding: '20px',
  } as React.CSSProperties
}

function StatCard({
  label, value, icon: Icon, color = '#A855F7',
}: {
  label: string
  value: number | string
  icon: React.ElementType
  color?: string
}) {
  return (
    <div style={cardStyle()}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span style={{ fontSize: '13px', color: 'var(--muted-foreground)' }}>{label}</span>
        <Icon size={18} style={{ color }} />
      </div>
      <p style={{ fontSize: '32px', fontWeight: 800, color: '#F3F0FF', lineHeight: 1 }}>
        {value}
      </p>
    </div>
  )
}

// ── skeleton ───────────────────────────────────────────────────────────────

function Skeleton({ h = 24, w = '100%', rounded = '8px' }: { h?: number; w?: string | number; rounded?: string }) {
  return (
    <div
      style={{
        height: h, width: w, borderRadius: rounded,
        background: 'rgba(139,92,246,0.1)',
        animation: 'pulse 1.5s ease-in-out infinite',
      }}
    />
  )
}

// ── chart tooltip ──────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { value: number; payload: { description?: string; delta?: number } }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  const p = payload[0]
  return (
    <div style={{
      background: '#0F0520', border: '1px solid rgba(139,92,246,0.35)',
      borderRadius: '10px', padding: '10px 14px', fontSize: '13px',
    }}>
      <p style={{ color: '#C4B5FD', marginBottom: 4 }}>{label}</p>
      <p style={{ color: '#F3F0FF', fontWeight: 700 }}>{p.value}</p>
      {p.payload.delta !== undefined && (
        <p style={{ color: '#FBBF24', fontSize: '12px' }}>+{p.payload.delta} pts</p>
      )}
      {p.payload.description && (
        <p style={{ color: 'var(--muted-foreground)', fontSize: '12px', maxWidth: 200 }}>{p.payload.description}</p>
      )}
    </div>
  )
}

// ── main page ──────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMyAnalytics().then((d) => {
      setData(d)
      setLoading(false)
    })
  }, [])

  // Build 30-day view chart: one point per day
  const viewChartData = (() => {
    const days = eachDayOfInterval({ start: subDays(new Date(), 29), end: new Date() })
    const countByDay: Record<string, number> = {}
    if (data?.viewsByDay) {
      for (const v of data.viewsByDay) {
        const day = format(parseISO(v.viewed_at), 'MMM d')
        countByDay[day] = (countByDay[day] || 0) + 1
      }
    }
    return days.map((d) => {
      const label = format(d, 'MMM d')
      return { date: label, views: countByDay[label] || 0 }
    })
  })()

  // Build Akili chart: events → cumulative points
  const akiliChartData = (() => {
    if (!data?.akiliHistory?.length) return []
    return data.akiliHistory.map((e) => ({
      date: format(parseISO(e.recorded_at), 'MMM d'),
      score: e.score,
      delta: e.delta,
      description: e.description,
    }))
  })()

  const s = data?.summary
  const rankPct = data?.universityRank && data?.universityTotal
    ? Math.round((1 - (data.universityRank - 1) / data.universityTotal) * 100)
    : null

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <BarChart2 size={22} style={{ color: '#A855F7' }} />
          <h1 className="text-2xl font-bold font-heading" style={{ letterSpacing: '-0.02em' }}>
            Research Impact
          </h1>
        </div>
        <p style={{ color: 'var(--muted-foreground)', fontSize: '14px' }}>
          Your visibility, engagement, and Akili velocity
        </p>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }
      `}</style>

      {/* ── SECTION 1: STAT CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}
           className="md:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={cardStyle()}>
              <Skeleton h={14} w="60%" rounded="6px" />
              <div style={{ marginTop: 12 }} />
              <Skeleton h={32} w="50%" rounded="6px" />
            </div>
          ))
        ) : (
          <>
            <StatCard
              label="Profile Views (30d)"
              value={Number(s?.profile_views_30d ?? 0)}
              icon={Eye}
              color="#A855F7"
            />
            <StatCard
              label="Total Reactions"
              value={Number(s?.total_reactions ?? 0)}
              icon={Heart}
              color="#F43F5E"
            />
            <StatCard
              label="Network Size"
              value={Number(s?.network_size ?? 0)}
              icon={Users}
              color="#22D3EE"
            />
            <StatCard
              label="Collab Interests"
              value={Number(s?.collab_interests_received ?? 0)}
              icon={Handshake}
              color="#FBBF24"
            />
          </>
        )}
      </div>

      {/* ── SECTION 2: CHARTS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}
           className="lg:grid-cols-2">

        {/* Chart A, Profile Views */}
        <div style={cardStyle()}>
          <p style={{ fontWeight: 600, color: '#C4B5FD', marginBottom: '16px', fontSize: '14px' }}>
            Profile Views (last 30 days)
          </p>
          {loading ? (
            <Skeleton h={180} rounded="10px" />
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={viewChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.12)" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  interval={6}
                />
                <YAxis
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  width={24}
                />
                <Tooltip content={<ChartTooltip />} />
                <Line
                  type="monotone"
                  dataKey="views"
                  stroke="#A855F7"
                  strokeWidth={2}
                  dot={{ fill: '#FBBF24', r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#FBBF24' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Chart B, Akili Score Growth */}
        <div style={cardStyle()}>
          <p style={{ fontWeight: 600, color: '#FBBF24', marginBottom: '16px', fontSize: '14px' }}>
            Akili Score Growth (last 60 days)
          </p>
          {loading ? (
            <Skeleton h={180} rounded="10px" />
          ) : akiliChartData.length === 0 ? (
            <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ color: 'rgba(139,92,246,0.4)', fontSize: '14px' }}>No activity yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={akiliChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.12)" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  interval={Math.floor(akiliChartData.length / 5)}
                />
                <YAxis
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  width={36}
                />
                <Tooltip content={<ChartTooltip />} />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#FBBF24"
                  strokeWidth={2}
                  dot={{ fill: '#FBBF24', r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#A855F7' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── SECTION 3: UNIVERSITY RANK ── */}
      {!loading && (
        <div style={cardStyle(true)}>
          <p style={{ fontWeight: 600, color: '#C4B5FD', marginBottom: '12px', fontSize: '14px' }}>
            University Standing
          </p>
          {data?.universityRank && data.universityTotal ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                {data.universityRank === 1 && (
                  <Crown size={20} style={{ color: '#FBBF24' }} />
                )}
                <p style={{ fontSize: '18px', fontWeight: 700, color: '#F3F0FF' }}>
                  #{data.universityRank} out of {data.universityTotal} researchers
                  {data.universityName ? ` at ${data.universityName}` : ''}
                </p>
              </div>
              {rankPct !== null && (
                <p style={{ fontSize: '13px', color: '#A855F7', marginBottom: '10px' }}>
                  {data.universityRank === 1
                    ? '👑 Top researcher at your university'
                    : rankPct >= 90
                    ? `Top 10% at your university`
                    : rankPct >= 75
                    ? `Top 25% at your university`
                    : `Top ${100 - rankPct + 1}% at your university`}
                </p>
              )}
              {/* Progress bar */}
              <div style={{
                height: '8px', borderRadius: '100px',
                background: 'rgba(139,92,246,0.15)',
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${rankPct ?? 0}%`,
                  borderRadius: '100px',
                  background: 'linear-gradient(90deg, #7C3AED, #FBBF24)',
                  transition: 'width 1s ease',
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                <span style={{ fontSize: '11px', color: 'rgba(139,92,246,0.5)' }}>Lowest</span>
                <span style={{ fontSize: '11px', color: 'rgba(139,92,246,0.5)' }}>Highest</span>
              </div>
            </>
          ) : (
            <p style={{ color: 'rgba(139,92,246,0.5)', fontSize: '14px' }}>
              Add your university to your profile to see your ranking.
            </p>
          )}
        </div>
      )}

      {/* ── SECTION 4: TOP IDEAS ── */}
      <div style={cardStyle()}>
        <p style={{ fontWeight: 600, color: '#C4B5FD', marginBottom: '16px', fontSize: '14px' }}>
          Your Ideas
        </p>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} h={44} rounded="10px" />)}
          </div>
        ) : !data?.topIdeas?.length ? (
          <p style={{ color: 'rgba(139,92,246,0.4)', fontSize: '14px' }}>
            No ideas posted yet.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {data.topIdeas.map((idea) => (
              <a
                key={idea.id}
                href={`/ideas/${idea.id}`}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  gap: '12px', padding: '10px 12px', borderRadius: '10px',
                  textDecoration: 'none',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(124,58,237,0.1)' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent' }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: '#F3F0FF', fontSize: '14px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {idea.title}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                    {idea.research_area && (
                      <span style={{
                        fontSize: '11px', color: '#A855F7',
                        background: 'rgba(168,85,247,0.12)',
                        padding: '1px 8px', borderRadius: '100px',
                      }}>
                        {idea.research_area}
                      </span>
                    )}
                    {idea.review_badge && (
                      <Badge style={{
                        fontSize: '10px', padding: '1px 8px',
                        background: idea.review_badge === 'highly_rated'
                          ? 'rgba(251,191,36,0.15)'
                          : 'rgba(34,197,94,0.15)',
                        color: idea.review_badge === 'highly_rated' ? '#FBBF24' : '#4ADE80',
                        border: 'none',
                      }}>
                        {idea.review_badge === 'highly_rated' ? '★ Highly Rated' : '✓ Peer Reviewed'}
                      </Badge>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                  <Heart size={14} style={{ color: '#F43F5E' }} />
                  <span style={{ fontSize: '13px', color: 'var(--muted-foreground)' }}>{idea.review_count ?? 0}</span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* ── SECTION 5: RECENT AKILI ACTIVITY ── */}
      <div style={cardStyle()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <TrendingUp size={16} style={{ color: '#FBBF24' }} />
          <p style={{ fontWeight: 600, color: '#FBBF24', fontSize: '14px' }}>
            Recent Akili Activity
          </p>
        </div>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} h={36} rounded="8px" />)}
          </div>
        ) : !data?.recentAkiliEvents?.length ? (
          <p style={{ color: 'rgba(139,92,246,0.4)', fontSize: '14px' }}>
            No Akili activity yet. Start collaborating to earn points!
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {data.recentAkiliEvents.map((event, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '9px 12px', borderRadius: '8px',
                borderBottom: i < data.recentAkiliEvents.length - 1
                  ? '1px solid rgba(139,92,246,0.08)' : 'none',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '13px', color: '#D4C8F0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {event.description || event.event_type}
                  </p>
                  <p style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginTop: '2px' }}>
                    {formatDistanceToNow(parseISO(event.created_at), { addSuffix: true })}
                  </p>
                </div>
                <span style={{
                  fontSize: '13px', fontWeight: 700, color: '#FBBF24',
                  flexShrink: 0, marginLeft: '12px',
                }}>
                  +{event.points_earned}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
