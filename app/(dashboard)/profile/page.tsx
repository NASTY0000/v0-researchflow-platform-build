'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  User, Mail, Building2, GraduationCap, Calendar,
  Edit, Save, X, Plus, Award, BookOpen, Briefcase, FileText,
  Eye, Star, ExternalLink, Trash2, CheckCircle2, FolderOpen,
  Users, MessageSquare, ListChecks, Zap, Shield, TrendingUp
} from 'lucide-react'
import type { Profile, PortfolioItem, PortfolioItemType, University } from '@/lib/types/database'
import { AkiliScoreCard } from '@/components/akili/AkiliScoreCard'

interface ActivityStats {
  activeProjects: number
  completedProjects: number
  mentorshipSessions: number
  tasksCompleted: number
}

interface MentorInfo {
  is_verified: boolean
  rating: number
  total_sessions: number
  specialty: string | null
  tier: string | null
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile & { university?: University } | null>(null)
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([])
  const [activityStats, setActivityStats] = useState<ActivityStats>({
    activeProjects: 0, completedProjects: 0, mentorshipSessions: 0, tasksCompleted: 0
  })
  const [mentorInfo, setMentorInfo] = useState<MentorInfo | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    full_name: '',
    bio: '',
    department: '',
    academic_level: '',
  })

  // Portfolio modal state
  const [showPortfolioModal, setShowPortfolioModal] = useState(false)
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null)
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null)
  const [portfolioSaving, setPortfolioSaving] = useState(false)
  const [portfolioForm, setPortfolioForm] = useState({
    item_type: 'publication' as PortfolioItemType,
    title: '',
    description: '',
    url: '',
    date_month: '',
    date_year: '',
  })

  const supabase = createClient()

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    setIsLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setIsLoading(false); return }

    const [profileResult, portfolioResult] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('portfolio_items').select('*').eq('user_id', user.id).order('date', { ascending: false })
    ])

    if (profileResult.data) {
      setProfile(profileResult.data as Profile & { university?: University })
      setEditForm({
        full_name: profileResult.data.full_name || '',
        bio: profileResult.data.bio || '',
        department: profileResult.data.department || '',
        academic_level: profileResult.data.academic_level || '',
      })
    }

    if (portfolioResult.data) setPortfolioItems(portfolioResult.data)

    // Load activity stats
    const [teamMembersResult, tasksResult, mentorResult] = await Promise.all([
      supabase.from('team_members').select('project_id, projects!inner(id, status)').eq('user_id', user.id),
      supabase.from('tasks').select('id, status').eq('assigned_to', user.id),
      supabase.from('mentor_profiles').select('*').eq('user_id', user.id).single()
    ])

    if (teamMembersResult.data) {
      const members = teamMembersResult.data as Array<{ project_id: string; projects: { id: string; status: string } }>
      setActivityStats(prev => ({
        ...prev,
        activeProjects: members.filter(m => m.projects?.status === 'active').length,
        completedProjects: members.filter(m => m.projects?.status === 'completed').length,
      }))
    }

    if (tasksResult.data) {
      setActivityStats(prev => ({
        ...prev,
        tasksCompleted: tasksResult.data.filter((t: { id: string; status: string }) => t.status === 'completed').length
      }))
    }

    // Load mentorship sessions count
    const { count: sessionCount } = await supabase
      .from('mentor_sessions')
      .select('*', { count: 'exact', head: true })
      .or(`student_id.eq.${user.id},mentor_id.eq.${user.id}`)
      .eq('status', 'completed')

    setActivityStats(prev => ({ ...prev, mentorshipSessions: sessionCount || 0 }))

    if (mentorResult.data) setMentorInfo(mentorResult.data)

    setIsLoading(false)
  }

  async function saveProfile() {
    if (!profile) return
    setIsSaving(true)
    const { error } = await supabase.from('profiles').update(editForm).eq('id', profile.id)
    if (!error) {
      setProfile({ ...profile, ...editForm })
      setIsEditing(false)
    }
    setIsSaving(false)
  }

  function openAddModal() {
    setEditingItem(null)
    setPortfolioForm({ item_type: 'publication', title: '', description: '', url: '', date_month: '', date_year: '' })
    setShowPortfolioModal(true)
  }

  function openEditModal(item: PortfolioItem) {
    setEditingItem(item)
    const d = item.date ? new Date(item.date) : null
    setPortfolioForm({
      item_type: item.item_type,
      title: item.title,
      description: item.description || '',
      url: item.url || '',
      date_month: d ? String(d.getMonth() + 1).padStart(2, '0') : '',
      date_year: d ? String(d.getFullYear()) : '',
    })
    setShowPortfolioModal(true)
  }

  async function savePortfolioItem() {
    if (!portfolioForm.title.trim() || !profile) return
    setPortfolioSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setPortfolioSaving(false); return }

    let dateStr: string | null = null
    if (portfolioForm.date_year) {
      const month = portfolioForm.date_month || '01'
      dateStr = `${portfolioForm.date_year}-${month}-01`
    }

    const payload = {
      item_type: portfolioForm.item_type,
      title: portfolioForm.title.trim(),
      description: portfolioForm.description.trim() || null,
      url: portfolioForm.url.trim() || null,
      date: dateStr,
      user_id: user.id,
    }

    if (editingItem) {
      const { data } = await supabase.from('portfolio_items').update(payload).eq('id', editingItem.id).select().single()
      if (data) setPortfolioItems(prev => prev.map(i => i.id === editingItem.id ? data : i))
    } else {
      const { data } = await supabase.from('portfolio_items').insert(payload).select().single()
      if (data) setPortfolioItems(prev => [data, ...prev])
    }

    setShowPortfolioModal(false)
    setPortfolioSaving(false)
  }

  async function deletePortfolioItem(id: string) {
    await supabase.from('portfolio_items').delete().eq('id', id)
    setPortfolioItems(prev => prev.filter(i => i.id !== id))
    setDeletingItemId(null)
  }

  const getAcademicLevelLabel = (level: string) => {
    const labels: Record<string, string> = {
      'undergraduate': 'Undergraduate', 'masters': 'Masters Student',
      'phd': 'PhD Candidate', 'postdoc': 'Postdoctoral', 'faculty': 'Faculty'
    }
    return labels[level] || level
  }

  const getPortfolioIcon = (type: string) => {
    switch (type) {
      case 'publication': return <BookOpen className="w-4 h-4" />
      case 'project': return <Briefcase className="w-4 h-4" />
      case 'certificate': return <Award className="w-4 h-4" />
      case 'award': return <Star className="w-4 h-4" />
      case 'presentation': return <FileText className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <Card>
          <CardContent className="p-8">
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 rounded-full bg-muted" />
              <div className="flex-1 space-y-3">
                <div className="h-6 bg-muted rounded w-48" />
                <div className="h-4 bg-muted rounded w-32" />
                <div className="h-4 bg-muted rounded w-64" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!profile) {
    return (
      <Card className="p-8 text-center">
        <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium">Profile not found</h3>
        <p className="text-muted-foreground">Please complete your onboarding to set up your profile.</p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Modal */}
      {showPortfolioModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-background border rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">{editingItem ? 'Edit Portfolio Item' : 'Add Portfolio Item'}</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowPortfolioModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <Label>Type</Label>
                <Select value={portfolioForm.item_type} onValueChange={(v) => setPortfolioForm(f => ({ ...f, item_type: v as PortfolioItemType }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="publication">Publication</SelectItem>
                    <SelectItem value="presentation">Presentation</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                    <SelectItem value="award">Award</SelectItem>
                    <SelectItem value="certificate">Certificate</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Title <span className="text-destructive">*</span></Label>
                <Input
                  className="mt-1"
                  value={portfolioForm.title}
                  onChange={(e) => setPortfolioForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g., Machine Learning in Climate Research"
                />
              </div>
              <div>
                <Label>Description <span className="text-muted-foreground text-xs">({portfolioForm.description.length}/300)</span></Label>
                <Textarea
                  className="mt-1"
                  value={portfolioForm.description}
                  onChange={(e) => setPortfolioForm(f => ({ ...f, description: e.target.value.slice(0, 300) }))}
                  placeholder="Brief description of this item..."
                  rows={3}
                />
              </div>
              <div>
                <Label>URL <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input
                  className="mt-1"
                  value={portfolioForm.url}
                  onChange={(e) => setPortfolioForm(f => ({ ...f, url: e.target.value }))}
                  placeholder="https://..."
                  type="url"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Month</Label>
                  <Select value={portfolioForm.date_month} onValueChange={(v) => setPortfolioForm(f => ({ ...f, date_month: v }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent>
                      {['01','02','03','04','05','06','07','08','09','10','11','12'].map((m, i) => (
                        <SelectItem key={m} value={m}>
                          {new Date(2000, i).toLocaleDateString('en-US', { month: 'long' })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Year</Label>
                  <Select value={portfolioForm.date_year} onValueChange={(v) => setPortfolioForm(f => ({ ...f, date_year: v }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 30 }, (_, i) => String(new Date().getFullYear() - i)).map(y => (
                        <SelectItem key={y} value={y}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t">
              <Button onClick={savePortfolioItem} disabled={!portfolioForm.title.trim() || portfolioSaving} className="flex-1">
                <Save className="w-4 h-4 mr-2" />
                {portfolioSaving ? 'Saving...' : editingItem ? 'Save Changes' : 'Add Item'}
              </Button>
              <Button variant="outline" onClick={() => setShowPortfolioModal(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deletingItemId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-background border rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="font-semibold text-lg">Delete Portfolio Item</h3>
            <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
            <div className="flex gap-3">
              <Button variant="destructive" onClick={() => deletePortfolioItem(deletingItemId)} className="flex-1">Delete</Button>
              <Button variant="outline" onClick={() => setDeletingItemId(null)} className="flex-1">Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* Header Card */}
      <Card>
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="relative">
              <Avatar className="w-24 h-24">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="text-2xl">
                  {profile.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <Button size="icon" variant="outline" className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full">
                <Edit className="w-3 h-3" />
              </Button>
            </div>

            <div className="flex-1 space-y-4">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <Label>Full Name</Label>
                    <Input value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} placeholder="Your full name" />
                  </div>
                  <div>
                    <Label>Bio</Label>
                    <Textarea value={editForm.bio} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} placeholder="Tell us about yourself and your research interests..." rows={3} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Department</Label>
                      <Input value={editForm.department} onChange={(e) => setEditForm({ ...editForm, department: e.target.value })} placeholder="e.g., Computer Science" />
                    </div>
                    <div>
                      <Label>Academic Level</Label>
                      <Input value={editForm.academic_level} onChange={(e) => setEditForm({ ...editForm, academic_level: e.target.value })} placeholder="e.g., undergraduate" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={saveProfile} disabled={isSaving}>
                      <Save className="w-4 h-4 mr-2" />
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      <X className="w-4 h-4 mr-2" />Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-2xl font-bold font-heading">{profile.full_name}</h1>
                        {profile.akili_score > 0 && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-semibold bg-primary/10 text-primary border border-primary/20">
                            <Zap className="w-3.5 h-3.5" />
                            {profile.akili_score.toLocaleString()} Akili
                          </span>
                        )}
                      </div>
                      <p className="text-muted-foreground flex items-center gap-2 mt-1">
                        <GraduationCap className="w-4 h-4" />
                        {getAcademicLevelLabel(profile.academic_level || '')}
                        {profile.department && ` · ${profile.department}`}
                      </p>
                    </div>
                    <Button variant="outline" onClick={() => setIsEditing(true)}>
                      <Edit className="w-4 h-4 mr-2" />Edit Profile
                    </Button>
                  </div>

                  {profile.bio && <p className="text-muted-foreground">{profile.bio}</p>}

                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />{profile.email}
                    </span>
                    {profile.university_id && (
                      <span className="flex items-center gap-1">
                        <Building2 className="w-4 h-4" />{profile.university_id}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {profile.roles?.map(role => (
                      <Badge key={role} variant="secondary">
                        {role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    ))}
                  </div>
                </>
              )}
            </div>

            {!isEditing && (
              <div className="flex md:flex-col gap-4 md:gap-2 text-center md:text-right">
                <div>
                  <p className="text-2xl font-bold text-primary">{profile.projects_completed}</p>
                  <p className="text-xs text-muted-foreground">Projects</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-accent">{profile.connections_count}</p>
                  <p className="text-xs text-muted-foreground">Connections</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{profile.portfolio_views}</p>
                  <p className="text-xs text-muted-foreground">Profile Views</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Akili Score */}
      <AkiliScoreCard userId={profile.id} />

      {/* Tabs */}
      <Tabs defaultValue="skills" className="space-y-4">
        <TabsList>
          <TabsTrigger value="skills">Skills & Interests</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="skills" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Research Interests</CardTitle>
                <CardDescription>Areas you want to explore</CardDescription>
              </CardHeader>
              <CardContent>
                {profile.research_interests && profile.research_interests.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.research_interests.map(interest => (
                      <Badge key={interest} variant="outline" className="bg-primary/5">{interest}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No research interests added yet.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Skills Offered</CardTitle>
                <CardDescription>What you can contribute</CardDescription>
              </CardHeader>
              <CardContent>
                {profile.skills && profile.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map(skill => (
                      <Badge key={skill} variant="secondary">{skill}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No skills added yet.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Looking For</CardTitle>
                <CardDescription>What you need in collaborators</CardDescription>
              </CardHeader>
              <CardContent>
                {profile.looking_for && profile.looking_for.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.looking_for.map(item => (
                      <Badge key={item} variant="outline" className="bg-accent/5">{item}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Not specified.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Availability</CardTitle>
                <CardDescription>Time commitment per week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-lg font-bold text-primary">{profile.weekly_hours_available || 0}</span>
                  </div>
                  <div>
                    <p className="font-medium">hours per week</p>
                    <p className="text-xs text-muted-foreground">Available for collaboration</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="portfolio" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Portfolio Items</h3>
              <p className="text-sm text-muted-foreground">Showcase your work and achievements</p>
            </div>
            <Button onClick={openAddModal}>
              <Plus className="w-4 h-4 mr-2" />Add Item
            </Button>
          </div>

          {portfolioItems.length === 0 ? (
            <Card className="p-8 text-center">
              <Award className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="font-medium mb-2">No portfolio items yet</h3>
              <p className="text-sm text-muted-foreground mb-4">Add your publications, projects, awards, and other achievements</p>
              <Button onClick={openAddModal}>
                <Plus className="w-4 h-4 mr-2" />Add Your First Item
              </Button>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {portfolioItems.map(item => (
                <Card key={item.id} className="overflow-hidden hover:border-primary/50 transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          {getPortfolioIcon(item.item_type)}
                        </div>
                        <div>
                          <CardTitle className="text-base">{item.title}</CardTitle>
                          <CardDescription className="text-xs">
                            {item.item_type.charAt(0).toUpperCase() + item.item_type.slice(1)}
                            {item.date && ` · ${new Date(item.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {item.is_featured && <Badge variant="secondary" className="text-xs">Featured</Badge>}
                        <Button size="icon" variant="ghost" className="w-7 h-7" onClick={() => openEditModal(item)}>
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="w-7 h-7 text-destructive hover:text-destructive" onClick={() => setDeletingItemId(item.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {item.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                    )}
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.tags.slice(0, 3).map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                    )}
                    {item.url && (
                      <Button variant="link" className="p-0 h-auto mt-2 text-xs" asChild>
                        <a href={item.url} target="_blank" rel="noopener noreferrer">
                          View <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-5 flex flex-col items-center text-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FolderOpen className="w-5 h-5 text-primary" />
                </div>
                <p className="text-3xl font-bold">{activityStats.activeProjects}</p>
                <p className="text-xs text-muted-foreground">Active Projects</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 flex flex-col items-center text-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                </div>
                <p className="text-3xl font-bold">{activityStats.completedProjects}</p>
                <p className="text-xs text-muted-foreground">Completed Projects</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 flex flex-col items-center text-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-accent" />
                </div>
                <p className="text-3xl font-bold">{activityStats.mentorshipSessions}</p>
                <p className="text-xs text-muted-foreground">Mentorship Sessions</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 flex flex-col items-center text-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <ListChecks className="w-5 h-5 text-orange-500" />
                </div>
                <p className="text-3xl font-bold">{activityStats.tasksCompleted}</p>
                <p className="text-xs text-muted-foreground">Tasks Completed</p>
              </CardContent>
            </Card>
          </div>

          {/* Mentor Section */}
          {mentorInfo ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Mentor Profile
                </CardTitle>
                <CardDescription>Your mentorship activity and status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 flex-wrap">
                  {mentorInfo.is_verified ? (
                    <Badge className="bg-green-500/15 text-green-600 border-green-500/20 hover:bg-green-500/20">
                      <CheckCircle2 className="w-3 h-3 mr-1" />Verified Mentor
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      Pending Verification
                    </Badge>
                  )}
                  {mentorInfo.tier && (
                    <Badge variant="secondary">{mentorInfo.tier}</Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="text-center p-3 rounded-xl bg-muted/50">
                    <p className="text-2xl font-bold text-primary">{mentorInfo.total_sessions}</p>
                    <p className="text-xs text-muted-foreground">Total Sessions</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-muted/50">
                    <div className="flex items-center justify-center gap-1">
                      <p className="text-2xl font-bold">{mentorInfo.rating > 0 ? mentorInfo.rating.toFixed(1) : '—'}</p>
                      {mentorInfo.rating > 0 && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                    </div>
                    <p className="text-xs text-muted-foreground">Avg Rating</p>
                  </div>
                  {mentorInfo.specialty && (
                    <div className="text-center p-3 rounded-xl bg-muted/50">
                      <p className="text-sm font-semibold truncate">{mentorInfo.specialty}</p>
                      <p className="text-xs text-muted-foreground">Specialty</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-6 text-center">
                <Shield className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <h3 className="font-medium mb-1">Become a Mentor</h3>
                <p className="text-sm text-muted-foreground mb-4">Share your expertise and earn Akili points by mentoring other researchers</p>
                <Button variant="outline" asChild>
                  <a href="/mentors">Explore Mentorship</a>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Research Output */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Research Output
              </CardTitle>
              <CardDescription>Your published and contributed works</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="text-center p-3 rounded-xl bg-muted/50">
                  <p className="text-2xl font-bold">{portfolioItems.filter(i => i.item_type === 'publication').length}</p>
                  <p className="text-xs text-muted-foreground">Publications</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-muted/50">
                  <p className="text-2xl font-bold">{portfolioItems.filter(i => i.item_type === 'presentation').length}</p>
                  <p className="text-xs text-muted-foreground">Presentations</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-muted/50">
                  <p className="text-2xl font-bold">{portfolioItems.filter(i => ['award','certificate'].includes(i.item_type)).length}</p>
                  <p className="text-xs text-muted-foreground">Awards & Certs</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
