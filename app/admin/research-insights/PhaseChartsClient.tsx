'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, FunnelChart, Funnel, LabelList,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { TrendingDown, FileCheck2, MessageSquare, RotateCcw } from 'lucide-react'

const PURPLE = '#A855F7'
const CYAN   = '#22D3EE'
const GREEN  = '#4ADE80'
const AMBER  = '#FBBF24'

function tooltipStyle() {
  return {
    contentStyle: { background: '#0F0A1E', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 8 },
    labelStyle: { color: '#C4B5D8', fontSize: 12 },
    itemStyle: { color: '#A855F7', fontSize: 12 },
  }
}

interface PhaseRow {
  phase_number: number
  phase_name: string
  completed_count: number
  in_progress_count: number
  with_evidence: number
  avg_summary_length: number | null
}

interface KeywordRow {
  word: string
  freq: number
}

interface Props {
  byPhase: PhaseRow[]
  totalCompletions: number
  totalWithEvidence: number
  keywords: KeywordRow[]
  reopenByPhase: Record<number, number>
  totalReopened: number
}

export function PhaseChartsClient({ byPhase, totalCompletions, totalWithEvidence, keywords, reopenByPhase, totalReopened }: Props) {
  // Funnel: reachCount is cumulative, how many phases ever reached this phase
  // We approximate by summing completedCount from this phase onward
  const funnelData = byPhase.map(row => ({
    name: `Ph ${row.phase_number}: ${row.phase_name.split(' ')[0]}`,
    value: row.completed_count + row.in_progress_count,
  }))

  // Evidence coverage per phase
  const coverageData = byPhase.map(row => ({
    name: `Ph ${row.phase_number}`,
    with_evidence: row.with_evidence,
    without: Math.max(0, row.completed_count - row.with_evidence),
  }))

  // Avg summary length per phase (indicates answer depth)
  const depthData = byPhase.map(row => ({
    name: `Ph ${row.phase_number}`,
    avg_chars: row.avg_summary_length ?? 0,
  }))

  // Top 20 keywords
  const topKeywords = keywords.slice(0, 20)

  // Per-phase reopen data (aligned to PHASE_DEFS order 1–7)
  const reopenData = byPhase.map(row => ({
    name:   `Ph ${row.phase_number}`,
    reopened: reopenByPhase[row.phase_number] ?? 0,
  }))

  return (
    <div className="space-y-6">
      {/* Stat row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Completions',   value: totalCompletions,                         color: PURPLE },
          { label: 'With Evidence',        value: totalWithEvidence,                        color: GREEN  },
          { label: 'Legacy (no evidence)', value: totalCompletions - totalWithEvidence,     color: AMBER  },
          { label: 'Phases Reopened',      value: totalReopened,                            color: '#F97316' },
        ].map(s => (
          <div
            key={s.label}
            className="rounded-xl border p-4"
            style={{ background: `${s.color}08`, borderColor: `${s.color}30` }}
          >
            <p className="text-2xl font-bold tabular-nums" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Phase funnel, drop-off */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-purple-400" />Phase Funnel
            </CardTitle>
            <CardDescription>Phases reached (completed + in-progress): reveals where teams stall</CardDescription>
          </CardHeader>
          <CardContent>
            {funnelData.every(d => d.value === 0) ? (
              <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">No completions yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={funnelData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.1)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip {...tooltipStyle()} />
                  <Bar dataKey="value" name="Reached" radius={[0, 4, 4, 0]}>
                    {funnelData.map((_, i) => (
                      <Cell key={i} fill={`hsl(${270 - i * 15}, 70%, 60%)`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Evidence coverage */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-green-400" />Evidence Coverage
            </CardTitle>
            <CardDescription>Completions with vs without a submission: legacy phases will show no evidence</CardDescription>
          </CardHeader>
          <CardContent>
            {coverageData.every(d => d.with_evidence === 0 && d.without === 0) ? (
              <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">No completions yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={coverageData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.1)" />
                  <XAxis dataKey="name" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip {...tooltipStyle()} />
                  <Bar dataKey="with_evidence" name="With submission" fill={GREEN}  radius={[4, 4, 0, 0]} stackId="a" />
                  <Bar dataKey="without"       name="No submission"  fill={AMBER}  radius={[4, 4, 0, 0]} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Answer depth (avg summary length) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-cyan-400" />Answer Depth
            </CardTitle>
            <CardDescription>Avg submission length per phase: short bars indicate a poorly-worded question</CardDescription>
          </CardHeader>
          <CardContent>
            {depthData.every(d => d.avg_chars === 0) ? (
              <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">No submissions yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={depthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.1)" />
                  <XAxis dataKey="name" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip {...tooltipStyle()} formatter={(v: number) => [`${v} chars`, 'Avg length']} />
                  <Bar dataKey="avg_chars" name="Avg chars" fill={CYAN} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Challenge keyword frequency */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-orange-400" />Common Blockers
            </CardTitle>
            <CardDescription>Recurring words from challenge & feedback answers: common blockers surface here</CardDescription>
          </CardHeader>
          <CardContent>
            {topKeywords.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">Not enough submissions yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={topKeywords} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.1)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis dataKey="word" type="category" tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} axisLine={false} tickLine={false} width={70} />
                  <Tooltip {...tooltipStyle()} />
                  <Bar dataKey="freq" name="Frequency" radius={[0, 4, 4, 0]}>
                    {topKeywords.map((_, i) => (
                      <Cell key={i} fill={`hsl(${260 + i * 6}, 65%, 60%)`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reopen frequency: a phase frequently reopened signals a definition problem */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-orange-400" />Reopen Frequency
          </CardTitle>
          <CardDescription>
            Times each phase has been reopened: frequent reopens signal a poorly-defined phase or a genuinely difficult step
          </CardDescription>
        </CardHeader>
        <CardContent>
          {totalReopened === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">No phases reopened yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={reopenData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.1)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip {...tooltipStyle()} formatter={(v: number) => [v, 'Reopens']} />
                <Bar dataKey="reopened" name="Reopened" fill="#F97316" radius={[4, 4, 0, 0]}>
                  {reopenData.map((_, i) => (
                    <Cell key={i} fill={`hsl(${24 + i * 8}, 85%, 55%)`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
