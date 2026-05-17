'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { FileText, Check, X, RefreshCw, Eye, ArrowLeft, ExternalLink, Calendar } from 'lucide-react'
import type { ShowcaseSubmission } from '@/lib/types/database'

type Action = 'approve' | 'revise' | 'reject' | null

export default function AdminShowcasePage() {
  const [pending, setPending] = useState<ShowcaseSubmission[]>([])
  const [reviewed, setReviewed] = useState<ShowcaseSubmission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selected, setSelected] = useState<ShowcaseSubmission | null>(null)
  const [action, setAction] = useState<Action>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const supabase = createClient()

  const load = useCallback(async () => {
    setIsLoading(true)
    const [pendingRes, reviewedRes] = await Promise.all([
      supabase
        .from('showcase_submissions')
        .select('*, submitter:profiles!submitted_by(id,full_name,email,avatar_url,university_id)')
        .eq('status', 'pending')
        .order('submitted_at', { ascending: false }),
      supabase
        .from('showcase_submissions')
        .select('*, submitter:profiles!submitted_by(id,full_name,email,avatar_url,university_id)')
        .neq('status', 'pending')
        .order('reviewed_at', { ascending: false })
        .limit(50),
    ])
    if (pendingRes.data) setPending(pendingRes.data as ShowcaseSubmission[])
    if (reviewedRes.data) setReviewed(reviewedRes.data as ShowcaseSubmission[])
    setIsLoading(false)
  }, [supabase])

  useEffect(() => { load() }, [load])

  async function handleReview(resolvedAction: Action) {
    if (!selected || !resolvedAction) return
    setIsSubmitting(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setIsSubmitting(false); return }

    const statusMap: Record<string, string> = {
      approve: 'approved',
      revise: 'needs_revision',
      reject: 'rejected',
    }

    await supabase
      .from('showcase_submissions')
      .update({
        status: statusMap[resolvedAction],
        admin_notes: adminNotes.trim() || null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
      })
      .eq('id', selected.id)

    // Notify submitter
    const messages: Record<string, string> = {
      approve: 'Your showcase submission has been approved and is now live!',
      revise: 'Your showcase submission needs revision. Please check the admin notes and resubmit.',
      reject: 'Your showcase submission was not approved.',
    }
    await supabase.from('notifications').insert({
      user_id: selected.submitted_by,
      type: 'system',
      title: resolvedAction === 'approve' ? 'Showcase Approved!' : resolvedAction === 'revise' ? 'Revision Needed' : 'Showcase Not Approved',
      message: messages[resolvedAction],
      link: '/showcase',
    })

    setSelected(null)
    setAction(null)
    setAdminNotes('')
    await load()
    setIsSubmitting(false)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge className="bg-green-500/15 text-green-600 border-green-500/20">Approved</Badge>
      case 'needs_revision': return <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/20">Needs Revision</Badge>
      case 'rejected': return <Badge className="bg-red-500/15 text-red-600 border-red-500/20">Rejected</Badge>
      default: return <Badge variant="outline">Pending</Badge>
    }
  }

  // Detail view
  if (selected) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => { setSelected(null); setAction(null); setAdminNotes('') }}>
            <ArrowLeft className="w-4 h-4 mr-2" />Back to List
          </Button>
          <h1 className="text-xl font-bold">Review Submission</h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main details */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{selected.title}</CardTitle>
                <CardDescription>{selected.abstract}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {selected.research_area_tags?.map(tag => (
                    <Badge key={tag} variant="outline" className="bg-primary/5">{tag}</Badge>
                  ))}
                  {selected.methodology_tags?.map(tag => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Submitted {new Date(selected.submitted_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span>Visibility: {selected.visibility === 'public' ? 'Public' : 'University only'}</span>
                </div>
                {selected.pdf_url && (
                  <Button variant="outline" asChild>
                    <a href={selected.pdf_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />View PDF
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Admin notes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Admin Notes</CardTitle>
                <CardDescription>These notes will be shared with the submitter</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={adminNotes}
                  onChange={e => setAdminNotes(e.target.value)}
                  placeholder="Add notes for the submitter (required for revision/rejection)..."
                  rows={4}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Submitted By</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={selected.submitter?.avatar_url || undefined} />
                    <AvatarFallback>{selected.submitter?.full_name?.[0] || 'U'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{selected.submitter?.full_name || 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground">{selected.submitter?.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Decision</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => handleReview('approve')}
                  disabled={isSubmitting}
                >
                  <Check className="w-4 h-4 mr-2" />Approve
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-amber-500/40 text-amber-600 hover:bg-amber-500/10"
                  onClick={() => handleReview('revise')}
                  disabled={isSubmitting || !adminNotes.trim()}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />Request Revision
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-red-500/40 text-red-600 hover:bg-red-500/10"
                  onClick={() => handleReview('reject')}
                  disabled={isSubmitting || !adminNotes.trim()}
                >
                  <X className="w-4 h-4 mr-2" />Reject
                </Button>
                {!adminNotes.trim() && (
                  <p className="text-xs text-muted-foreground text-center">Add notes before requesting revision or rejecting</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Showcase Review</h1>
        <p className="text-muted-foreground text-sm mt-1">Review and approve showcase submissions from researchers</p>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            Pending{pending.length > 0 && <Badge variant="destructive" className="ml-2 h-5 px-1.5 text-xs">{pending.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="reviewed">Reviewed</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4 mt-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}
            </div>
          ) : pending.length === 0 ? (
            <Card className="p-8 text-center">
              <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="font-medium">No pending submissions</p>
              <p className="text-sm text-muted-foreground mt-1">All submissions have been reviewed</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {pending.map(sub => (
                <Card key={sub.id} className="hover:border-primary/40 transition-colors">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarImage src={sub.submitter?.avatar_url || undefined} />
                          <AvatarFallback>{sub.submitter?.full_name?.[0] || 'U'}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium text-sm">{sub.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{sub.submitter?.full_name} · {new Date(sub.submitted_at).toLocaleDateString()}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{sub.abstract}</p>
                        </div>
                      </div>
                      <Button size="sm" onClick={() => { setSelected(sub); setAdminNotes(sub.admin_notes || '') }}>
                        <Eye className="w-3 h-3 mr-1" />Review
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="reviewed" className="space-y-4 mt-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}
            </div>
          ) : reviewed.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground text-sm">No reviewed submissions yet</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {reviewed.map(sub => (
                <Card key={sub.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-medium text-sm">{sub.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {sub.submitter?.full_name} · {sub.reviewed_at ? new Date(sub.reviewed_at).toLocaleDateString() : '—'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {getStatusBadge(sub.status)}
                        <Button variant="ghost" size="sm" onClick={() => { setSelected(sub); setAdminNotes(sub.admin_notes || '') }}>
                          <Eye className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
