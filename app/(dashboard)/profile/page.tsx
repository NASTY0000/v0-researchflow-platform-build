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
import { 
  User, Mail, Building2, GraduationCap, Calendar, MapPin,
  Edit, Save, X, Plus, Award, BookOpen, Briefcase, FileText,
  Eye, Users, Star, ExternalLink
} from 'lucide-react'
import type { Profile, PortfolioItem, University } from '@/lib/types/database'
import { AkiliScoreCard } from '@/components/akili/AkiliScoreCard'

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile & { university?: University } | null>(null)
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    full_name: '',
    bio: '',
    department: '',
    academic_level: '',
  })
  const supabase = createClient()

  useEffect(() => {
    loadProfile()
    loadPortfolio()
  }, [])

  async function loadProfile() {
    setIsLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (data) {
      setProfile(data as Profile & { university?: University })
      setEditForm({
        full_name: data.full_name || '',
        bio: data.bio || '',
        department: data.department || '',
        academic_level: data.academic_level || '',
      })
    }
    setIsLoading(false)
  }

  async function loadPortfolio() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('portfolio_items')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })

    if (data) {
      setPortfolioItems(data)
    }
  }

  async function saveProfile() {
    if (!profile) return
    setIsSaving(true)

    const { error } = await supabase
      .from('profiles')
      .update(editForm)
      .eq('id', profile.id)

    if (!error) {
      setProfile({ ...profile, ...editForm })
      setIsEditing(false)
    }
    setIsSaving(false)
  }

  const getAcademicLevelLabel = (level: string) => {
    const labels: Record<string, string> = {
      'undergraduate': 'Undergraduate',
      'masters': 'Masters Student',
      'phd': 'PhD Candidate',
      'postdoc': 'Postdoctoral',
      'faculty': 'Faculty'
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
      {/* Header Card */}
      <Card>
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-start gap-6">
            {/* Avatar */}
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

            {/* Info */}
            <div className="flex-1 space-y-4">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <Label>Full Name</Label>
                    <Input
                      value={editForm.full_name}
                      onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <Label>Bio</Label>
                    <Textarea
                      value={editForm.bio}
                      onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                      placeholder="Tell us about yourself and your research interests..."
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Department</Label>
                      <Input
                        value={editForm.department}
                        onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                        placeholder="e.g., Computer Science"
                      />
                    </div>
                    <div>
                      <Label>Academic Level</Label>
                      <Input
                        value={editForm.academic_level}
                        onChange={(e) => setEditForm({ ...editForm, academic_level: e.target.value })}
                        placeholder="e.g., undergraduate"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={saveProfile} disabled={isSaving}>
                      <Save className="w-4 h-4 mr-2" />
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="text-2xl font-bold font-heading">{profile.full_name}</h1>
                      <p className="text-muted-foreground flex items-center gap-2 mt-1">
                        <GraduationCap className="w-4 h-4" />
                        {getAcademicLevelLabel(profile.academic_level || '')}
                        {profile.department && ` · ${profile.department}`}
                      </p>
                    </div>
                    <Button variant="outline" onClick={() => setIsEditing(true)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  </div>

                  {profile.bio && (
                    <p className="text-muted-foreground">{profile.bio}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      {profile.email}
                    </span>
                    {profile.university_id && (
                      <span className="flex items-center gap-1">
                        <Building2 className="w-4 h-4" />
                        {profile.university_id}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                  </div>

                  {/* Roles */}
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

            {/* Stats */}
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
            {/* Research Interests */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Research Interests</CardTitle>
                <CardDescription>Areas you want to explore</CardDescription>
              </CardHeader>
              <CardContent>
                {profile.research_interests && profile.research_interests.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.research_interests.map(interest => (
                      <Badge key={interest} variant="outline" className="bg-primary/5">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No research interests added yet.</p>
                )}
              </CardContent>
            </Card>

            {/* Skills */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Skills Offered</CardTitle>
                <CardDescription>What you can contribute</CardDescription>
              </CardHeader>
              <CardContent>
                {profile.skills && profile.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map(skill => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No skills added yet.</p>
                )}
              </CardContent>
            </Card>

            {/* Looking For */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Looking For</CardTitle>
                <CardDescription>What you need in collaborators</CardDescription>
              </CardHeader>
              <CardContent>
                {profile.looking_for && profile.looking_for.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.looking_for.map(item => (
                      <Badge key={item} variant="outline" className="bg-accent/5">
                        {item}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Not specified.</p>
                )}
              </CardContent>
            </Card>

            {/* Availability */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Availability</CardTitle>
                <CardDescription>Time commitment per week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-lg font-bold text-primary">
                      {profile.weekly_hours_available || 0}
                    </span>
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
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>

          {portfolioItems.length === 0 ? (
            <Card className="p-8 text-center">
              <Award className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="font-medium mb-2">No portfolio items yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add your publications, projects, awards, and other achievements
              </p>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Item
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
                      {item.is_featured && (
                        <Badge variant="secondary" className="text-xs">Featured</Badge>
                      )}
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

        <TabsContent value="activity">
          <Card className="p-8 text-center">
            <Eye className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-medium mb-2">Activity feed coming soon</h3>
            <p className="text-sm text-muted-foreground">
              Track your research contributions, connections, and project milestones
            </p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
