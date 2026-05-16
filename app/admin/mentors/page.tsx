'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  CheckCircle, XCircle, Eye, Building2, GraduationCap,
  Star, ArrowLeft, X, Shield, ShieldOff
} from 'lucide-react'
import { toast } from 'sonner'
import type { Profile, MentorProfile } from '@/lib/types/database'
import { resolveUniversityName } from '@/lib/utils/university'

type MentorWithProfile = MentorProfile & { user: Profile }

const TIER_LABELS: Record<number, string> = { 1: 'Faculty', 2: 'Postgraduate', 3: 'Industry' }

export default function AdminMentorsPage() {
  const [pendingMentors, setPendingMentors] = useState<MentorWithProfile[]>([])
  const [approvedMentors, setApprovedMentors] = useState<MentorWithProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMentor, setSelectedMentor] = useState<MentorWithProfile | null>(null)
  const [rejectTarget, setRejectTarget] = useState<MentorWithProfile | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [tierFilter, setTierFilter] = useState('all')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setIsLoading(true)
    const [pendingResult, approvedResult] = await Promise.all([
      supabase.from('mentor_profiles').select('*, user:profiles(*, university:universities(name))').eq('is_verified', false).order('created_at', { ascending: false }),
      supabase.from('mentor_profiles').select('*, user:profiles(*, university:universities(name))').eq('is_verified', true).order('created_at', { ascending: false }),
    ])
    if (pendingResult.data) setPendingMentors(pendingResult.data as MentorWithProfile[])
    if (approvedResult.data) setApprovedMentors(approvedResult.data as MentorWithProfile[])
    setIsLoading(false)
  }

  async function approveMentor(mentor: MentorWithProfile) {
    setSaving(true)
    const { error } = await supabase.from('mentor_profiles').update({ is_verified: true }).eq('id', mentor.id)
    if (!error) {
      await supabase.from('notifications').insert({
        user_id: mentor.user_id,
        title: 'Mentor Application Approved',
        message: 'Congratulations! Your mentor application has been approved. You now appear in the mentor directory.',
        type: 'mentor_approved',
        related_id: mentor.id,
      })
      toast.success(`${mentor.user?.full_name} approved as mentor`)
      setSelectedMentor(null)
      loadData()
    } else {
      toast.error('Failed to approve mentor')
    }
    setSaving(false)
  }

  async function rejectMentor() {
    if (!rejectTarget || !rejectReason.trim()) return
    setSaving(true)
    const { error } = await supabase.from('mentor_profiles').delete().eq('id', rejectTarget.id)
    if (!error) {
      await supabase.from('notifications').insert({
        user_id: rejectTarget.user_id,
        title: 'Mentor Application Not Approved',
        message: `Your mentor application was not approved. Reason: ${rejectReason.trim()}. You may update your profile and reapply.`,
        type: 'mentor_rejected',
        related_id: rejectTarget.id,
      })
      toast.success('Application rejected and user notified')
      setRejectTarget(null)
      setRejectReason('')
      setSelectedMentor(null)
      loadData()
    } else {
      toast.error('Failed to reject application')
    }
    setSaving(false)
  }

  async function revokeVerification(mentor: MentorWithProfile) {
    const { error } = await supabase.from('mentor_profiles').update({ is_verified: false }).eq('id', mentor.id)
    if (!error) {
      await supabase.from('notifications').insert({
        user_id: mentor.user_id,
        title: 'Mentor Verification Revoked',
        message: 'Your mentor verification has been revoked. Please contact support for more information.',
        type: 'admin',
      })
      toast.success('Verification revoked')
      loadData()
    }
  }

  const filteredApproved = tierFilter === 'all'
    ? approvedMentors
    : approvedMentors.filter(m => String(m.tier) === tierFilter)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-heading">Mentor Verification</h1>
        <p className="text-muted-foreground mt-1">Review and manage mentor applications</p>
      </div>

      {/* Reject Modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-background border rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="font-semibold">Reject Application</h3>
              <Button variant="ghost" size="icon" onClick={() => setRejectTarget(null)}><X className="w-4 h-4" /></Button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Rejecting application from <span className="font-medium text-foreground">{rejectTarget.user?.full_name}</span>. The user will be notified with your reason and can reapply.
              </p>
              <div>
                <Label>Reason <span className="text-destructive">*</span></Label>
                <Textarea
                  className="mt-1.5"
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="e.g. Insufficient credentials provided, unclear specialization..."
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t">
              <Button variant="destructive" disabled={!rejectReason.trim() || saving} onClick={rejectMentor} className="flex-1">
                {saving ? 'Rejecting...' : 'Confirm Rejection'}
              </Button>
              <Button variant="outline" onClick={() => setRejectTarget(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* Detail View */}
      {selectedMentor && !rejectTarget && (
        <div className="space-y-4">
          <Button variant="ghost" className="gap-2" onClick={() => setSelectedMentor(null)}>
            <ArrowLeft className="w-4 h-4" /> Back to list
          </Button>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={selectedMentor.user?.avatar_url || undefined} />
                      <AvatarFallback className="text-2xl">{selectedMentor.user?.full_name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h2 className="text-xl font-bold">{selectedMentor.user?.full_name}</h2>
                      <p className="text-sm text-muted-foreground">{selectedMentor.user?.email}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="outline">Tier {selectedMentor.tier}: {TIER_LABELS[selectedMentor.tier]}</Badge>
                        {selectedMentor.user?.academic_level && (
                          <Badge variant="secondary" className="capitalize">{selectedMentor.user.academic_level}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {selectedMentor.user?.university_id && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Building2 className="w-4 h-4 flex-shrink-0" />
                        <span>{resolveUniversityName(selectedMentor.user.university_id, (selectedMentor.user as Profile & { university?: { name: string } }).university?.name)}</span>
                      </div>
                    )}
                    {selectedMentor.user?.department && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <GraduationCap className="w-4 h-4 flex-shrink-0" />
                        <span>{selectedMentor.user.department}</span>
                      </div>
                    )}
                  </div>

                  {selectedMentor.specializations?.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold mb-2">Specializations</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedMentor.specializations.map(s => (
                          <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedMentor.mentorship_areas?.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold mb-2">Mentorship Areas</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedMentor.mentorship_areas.map(a => (
                          <Badge key={a} variant="outline" className="text-xs">{a}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedMentor.user?.bio && (
                    <div>
                      <p className="text-sm font-semibold mb-1">Bio</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{selectedMentor.user.bio}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <div className="text-center p-3 rounded-xl bg-muted/50">
                      <p className="text-xl font-bold">{selectedMentor.available_slots}</p>
                      <p className="text-xs text-muted-foreground">Available Slots</p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-muted/50">
                      <p className="text-xl font-bold">{selectedMentor.total_sessions}</p>
                      <p className="text-xs text-muted-foreground">Sessions</p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-muted/50">
                      <p className="text-xl font-bold flex items-center justify-center gap-1">
                        {selectedMentor.rating > 0 ? selectedMentor.rating.toFixed(1) : '—'}
                        {selectedMentor.rating > 0 && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                      </p>
                      <p className="text-xs text-muted-foreground">Rating</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Documents</CardTitle>
                  <CardDescription>Submitted verification documents</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground text-center py-6">
                    Document viewing requires storage bucket configuration. Files submitted via the mentor application form are stored in Supabase storage.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              {!selectedMentor.is_verified && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Review Decision</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white" disabled={saving} onClick={() => approveMentor(selectedMentor)}>
                      <CheckCircle className="w-4 h-4 mr-2" /> Approve Mentor
                    </Button>
                    <Button variant="outline" className="w-full border-destructive/50 text-destructive hover:bg-destructive/10" disabled={saving}
                      onClick={() => { setRejectTarget(selectedMentor); setRejectReason('') }}>
                      <XCircle className="w-4 h-4 mr-2" /> Reject Application
                    </Button>
                  </CardContent>
                </Card>
              )}
              <Card className="bg-muted/30">
                <CardContent className="p-4 text-xs text-muted-foreground space-y-1.5">
                  <p className="font-medium text-foreground">On Approval</p>
                  <p>Mentor appears in the public directory</p>
                  <p>Notification sent to applicant</p>
                  <p>Students can send mentorship requests</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* List View */}
      {!selectedMentor && (
        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending" className="gap-2">
              Pending Verification
              {pendingMentors.length > 0 && (
                <Badge variant="destructive" className="text-xs">{pendingMentors.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved Mentors ({approvedMentors.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Awaiting Review</CardTitle>
                <CardDescription>Review submitted mentor applications</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-center gap-4 p-4 rounded-lg border animate-pulse">
                        <div className="w-12 h-12 rounded-full bg-muted" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded w-1/3" />
                          <div className="h-3 bg-muted rounded w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : pendingMentors.length === 0 ? (
                  <div className="text-center py-12">
                    <Shield className="w-12 h-12 text-green-500 mx-auto mb-3" />
                    <h3 className="font-medium">All caught up!</h3>
                    <p className="text-sm text-muted-foreground">No pending mentor verifications.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingMentors.map(mentor => (
                      <div key={mentor.id} className="flex items-start gap-4 p-4 rounded-xl border hover:border-primary/40 transition-colors">
                        <Avatar className="w-12 h-12 flex-shrink-0">
                          <AvatarImage src={mentor.user?.avatar_url || undefined} />
                          <AvatarFallback>{mentor.user?.full_name?.charAt(0) || 'M'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-semibold">{mentor.user?.full_name}</h4>
                              <p className="text-xs text-muted-foreground">{mentor.user?.email}</p>
                            </div>
                            <Badge variant="outline">Tier {mentor.tier}: {TIER_LABELS[mentor.tier]}</Badge>
                          </div>
                          <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                            {mentor.user?.university_id && (
                              <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{resolveUniversityName(mentor.user.university_id, (mentor.user as Profile & { university?: { name: string } }).university?.name)}</span>
                            )}
                            {mentor.user?.department && (
                              <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3" />{mentor.user.department}</span>
                            )}
                          </div>
                          {mentor.specializations?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {mentor.specializations.slice(0, 3).map(s => (
                                <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                              ))}
                            </div>
                          )}
                          <div className="flex items-center justify-between mt-3">
                            <p className="text-xs text-muted-foreground">
                              Applied {new Date(mentor.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => setSelectedMentor(mentor)}>
                                <Eye className="w-3.5 h-3.5 mr-1.5" /> Review
                              </Button>
                              <Button size="sm" variant="outline" className="text-green-600 border-green-500/30 hover:bg-green-500/10"
                                onClick={() => approveMentor(mentor)} disabled={saving}>
                                <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Approve
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="approved" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Active Verified Mentors</CardTitle>
                    <CardDescription>All approved mentors on the platform</CardDescription>
                  </div>
                  <Select value={tierFilter} onValueChange={setTierFilter}>
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="Filter tier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tiers</SelectItem>
                      <SelectItem value="1">Tier 1 (Faculty)</SelectItem>
                      <SelectItem value="2">Tier 2 (Postgrad)</SelectItem>
                      <SelectItem value="3">Tier 3 (Industry)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-center gap-4 p-3 rounded-lg border animate-pulse">
                        <div className="w-10 h-10 rounded-full bg-muted" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 bg-muted rounded w-1/4" />
                          <div className="h-2.5 bg-muted rounded w-1/3" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredApproved.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground text-sm">No approved mentors yet</p>
                ) : (
                  <div className="space-y-3">
                    {filteredApproved.map(mentor => (
                      <div key={mentor.id} className="flex items-center gap-3 p-3 rounded-xl border">
                        <Avatar className="w-10 h-10 flex-shrink-0">
                          <AvatarImage src={mentor.user?.avatar_url || undefined} />
                          <AvatarFallback>{mentor.user?.full_name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-sm">{mentor.user?.full_name}</p>
                            <Badge variant="secondary" className="text-xs">Tier {mentor.tier}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{resolveUniversityName(mentor.user?.university_id, (mentor.user as Profile & { university?: { name: string } } | undefined)?.university?.name)}</p>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-shrink-0">
                          {mentor.rating > 0 && (
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                              {mentor.rating.toFixed(1)}
                            </span>
                          )}
                          <span>{mentor.total_sessions} sessions</span>
                        </div>
                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive flex-shrink-0"
                          onClick={() => revokeVerification(mentor)}>
                          <ShieldOff className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
