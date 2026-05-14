'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertTriangle, Check, X, Eye, Clock } from 'lucide-react'
import type { ContentReport } from '@/lib/types/database'

type FilterStatus = 'pending' | 'resolved' | 'dismissed' | 'all'

export default function AdminModerationPage() {
  const [reports, setReports] = useState<ContentReport[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('pending')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const supabase = createClient()

  const load = useCallback(async () => {
    setIsLoading(true)
    let query = supabase
      .from('content_reports')
      .select('*, reporter:profiles!reporter_id(id,full_name,email,avatar_url)')
      .order('created_at', { ascending: false })
      .limit(100)

    if (filterStatus !== 'all') {
      query = query.eq('status', filterStatus)
    }

    const { data } = await query
    if (data) setReports(data as ContentReport[])
    setIsLoading(false)
  }, [supabase, filterStatus])

  useEffect(() => { load() }, [load])

  async function handleAction(report: ContentReport, action: 'resolve' | 'dismiss') {
    setActionLoading(report.id)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setActionLoading(null); return }

    await supabase
      .from('content_reports')
      .update({
        status: action === 'resolve' ? 'resolved' : 'dismissed',
        resolved_by: user.id,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', report.id)

    // If resolving (removing content), optionally notify the reporter
    if (action === 'resolve' && report.reporter_id) {
      await supabase.from('notifications').insert({
        user_id: report.reporter_id,
        type: 'system',
        title: 'Report Resolved',
        message: 'Your content report has been reviewed and action has been taken.',
        link: null,
      })
    }

    setReports(prev => prev.filter(r => r.id !== report.id))
    setActionLoading(null)
  }

  const getContentTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      idea: 'bg-blue-500/15 text-blue-600 border-blue-500/20',
      task: 'bg-purple-500/15 text-purple-600 border-purple-500/20',
      message: 'bg-green-500/15 text-green-600 border-green-500/20',
      showcase: 'bg-orange-500/15 text-orange-600 border-orange-500/20',
      comment: 'bg-cyan-500/15 text-cyan-600 border-cyan-500/20',
      profile: 'bg-red-500/15 text-red-600 border-red-500/20',
    }
    return (
      <Badge className={`text-xs ${colors[type] || 'bg-muted text-muted-foreground'}`}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved': return <Badge className="bg-green-500/15 text-green-600 border-green-500/20 text-xs">Resolved</Badge>
      case 'dismissed': return <Badge className="bg-muted text-muted-foreground text-xs">Dismissed</Badge>
      default: return <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/20 text-xs">Pending</Badge>
    }
  }

  function timeAgo(date: string) {
    const diff = Date.now() - new Date(date).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading">Content Moderation</h1>
          <p className="text-muted-foreground text-sm mt-1">Review and action reported content</p>
        </div>
        <Select value={filterStatus} onValueChange={v => setFilterStatus(v as FilterStatus)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="dismissed">Dismissed</SelectItem>
            <SelectItem value="all">All Reports</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : reports.length === 0 ? (
        <Card className="p-12 text-center">
          <AlertTriangle className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-medium">No {filterStatus !== 'all' ? filterStatus : ''} reports</p>
          <p className="text-sm text-muted-foreground mt-1">
            {filterStatus === 'pending' ? 'All reports have been actioned' : 'No reports found'}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {reports.map(report => (
            <Card key={report.id} className="hover:border-primary/20 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getContentTypeBadge(report.content_type)}
                      {getStatusBadge(report.status)}
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />{timeAgo(report.created_at)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{report.reason}</p>
                      {report.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{report.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Eye className="w-3 h-3" />
                      <span>Content ID: <code className="font-mono">{report.content_id.slice(0, 8)}...</code></span>
                      {report.reporter && (
                        <span>· Reported by <strong>{report.reporter.full_name || report.reporter.email}</strong></span>
                      )}
                    </div>
                  </div>

                  {report.status === 'pending' && (
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-green-500/40 text-green-600 hover:bg-green-500/10"
                        onClick={() => handleAction(report, 'resolve')}
                        disabled={actionLoading === report.id}
                      >
                        <Check className="w-3.5 h-3.5 mr-1" />Resolve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-muted-foreground"
                        onClick={() => handleAction(report, 'dismiss')}
                        disabled={actionLoading === report.id}
                      >
                        <X className="w-3.5 h-3.5 mr-1" />Dismiss
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
