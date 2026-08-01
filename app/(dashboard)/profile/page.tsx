'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
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
import ChipSelector from '@/components/ui/chip-selector'
import {
  RESEARCH_AREAS, RESEARCH_AREAS_FEATURED,
  SKILLS_OFFERED, SKILLS_FEATURED,
} from '@/lib/constants/onboarding'
import {
  User, Mail, Building2, GraduationCap, Calendar,
  Edit, Save, X, Plus, Award, BookOpen, Briefcase, FileText,
  Eye, Star, ExternalLink, Trash2, CheckCircle2, FolderOpen,
  Users, MessageSquare, ListChecks, Zap, Shield, TrendingUp, Loader2,
  BarChart3, Lightbulb, Code, Share2, Check,
} from 'lucide-react'
import type { Profile, PortfolioItem, PortfolioItemType, University } from '@/lib/types/database'
import { AkiliScoreCard } from '@/components/akili/AkiliScoreCard'
import { AkiliProgressCard } from '@/components/akili/AkiliProgressCard'
import { getAkiliNarrative } from '@/lib/utils/akili'
import { useUserState } from '@/hooks/use-user-state'
import { useAkiliState } from '@/lib/hooks/use-akili-state'
import { shareContent } from '@/lib/utils/share'
import { ProfileBackground } from '@/components/profile/ProfileBackground'
import { VerifiedBadge } from '@/components/ui/VerifiedBadge'
import Link from 'next/link'
import { RippleButton } from '@/components/ui/RippleButton'
import { MilestoneToast } from '@/components/ui/MilestoneToast'
import { useMilestones } from '@/hooks/useMilestones'
import { toast } from 'sonner'

// ── Animation helpers (module-level, no hooks) ────────────────────────────────

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function triggerSparkleBurst(elementId: string) {
  const el = document.getElementById(elementId)
  if (!el) return
  const rect = el.getBoundingClientRect()
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2
  const colors = ['#FBBF24','#F59E0B','#A855F7','#C4B5FD','#FBBF24','#7C3AED','#FBBF24','#E879F9','#FDE68A','#FBBF24','#A855F7','#FBBF24']
  for (let i = 0; i < 12; i++) {
    const spark = document.createElement('div')
    const isDiamond = i % 3 !== 0
    Object.assign(spark.style, {
      position: 'fixed', width: isDiamond ? '5px' : '4px', height: isDiamond ? '5px' : '4px',
      borderRadius: isDiamond ? '1px' : '50%', backgroundColor: colors[i],
      transform: isDiamond ? 'rotate(45deg)' : 'none',
      left: `${cx}px`, top: `${cy}px`, pointerEvents: 'none', zIndex: '999',
      boxShadow: `0 0 4px ${colors[i]}, 0 0 8px ${colors[i]}`,
    })
    document.body.appendChild(spark)
    const angle = (i / 12) * 360 + (Math.random() * 20 - 10)
    const dist = 45 + Math.random() * 35
    const rad = (angle * Math.PI) / 180
    const tx = cx + Math.cos(rad) * dist
    const ty = cy + Math.sin(rad) * dist
    spark.animate([
      { transform: `translate(-50%,-50%) ${isDiamond ? 'rotate(45deg)' : ''} scale(0)`, opacity: '1' },
      { transform: `translate(calc(${tx - cx}px - 50%),calc(${ty - cy}px - 50%)) ${isDiamond ? 'rotate(225deg)' : ''} scale(1)`, opacity: '1', offset: 0.6 },
      { transform: `translate(calc(${tx - cx}px - 50%),calc(${ty - cy}px - 50%)) ${isDiamond ? 'rotate(360deg)' : ''} scale(0.3)`, opacity: '0' },
    ], { duration: 600 + Math.random() * 200, delay: i * 18, easing: 'cubic-bezier(0.25,0.46,0.45,0.94)', fill: 'forwards' }).onfinish = () => spark.remove()
  }
  el.animate(
    [{ transform: 'scale(1)' }, { transform: 'scale(1.12)' }, { transform: 'scale(0.96)' }, { transform: 'scale(1.04)' }, { transform: 'scale(1)' }],
    { duration: 400, easing: 'ease-out' }
  )
}

function animateCountUp(targetValue: number, elementId: string, duration = 1400) {
  const el = document.getElementById(elementId)
  if (!el) return
  const key = `akili_counted_${targetValue}`
  if (sessionStorage.getItem(key)) { el.textContent = targetValue.toString(); return }
  const startTime = performance.now()
  function tick(now: number) {
    const progress = Math.min((now - startTime) / duration, 1)
    el!.textContent = Math.round(easeOutExpo(progress) * targetValue).toString()
    if (progress < 1) { requestAnimationFrame(tick) }
    else {
      el!.textContent = targetValue.toString()
      sessionStorage.setItem(key, 'true')
      triggerSparkleBurst('akili-hero-badge')
    }
  }
  requestAnimationFrame(tick)
}

function animateStatNumber(target: number, id: string, duration = 850) {
  const el = document.getElementById(id)
  if (!el) return
  const start = performance.now()
  function tick(now: number) {
    const t = Math.min((now - start) / duration, 1)
    const ease = 1 - Math.pow(1 - t, 3)
    el!.textContent = String(Math.round(ease * target))
    if (t < 1) requestAnimationFrame(tick)
    else el!.textContent = String(target)
  }
  el.textContent = '0'
  requestAnimationFrame(tick)
}
import { ProfileHeaderSkeleton, Skeleton } from '@/components/ui/SkeletonLayouts'
import { ListPageSkeleton } from '@/components/ui/skeleton-screens'

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

interface AkiliEvent {
  id: string
  event_type: string
  points_earned: number
  created_at: string
}

interface AnalyticsData {
  profileViews: number
  ideaViews: number
  collaborationRequests: number
  leaderboardRank: number | null
  scoreHistory: { week: string; score: number }[]
  dimensionBreakdown: { name: string; value: number; color: string }[]
  recentEvents: AkiliEvent[]
  ideasPerformance: { title: string; views: number; matches: number }[]
}

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile & { university?: University } | null>(null)
  const { state: userState } = useUserState(profile?.id ?? null)
  const { state: akiliState } = useAkiliState(profile?.id ?? null)
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
    research_interests: [] as string[],
    skills: [] as string[],
  })

  const [universityName, setUniversityName] = useState('')
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Crop modal state
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<Crop | null>(null)
  const imgRef = useRef<HTMLImageElement>(null)

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

  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const supabase = createClient()
  const { activeMilestone, clearMilestone } = useMilestones(profile)

  useEffect(() => {
    loadAll()
  }, [])

  // Count-up animation when akili_score is available
  useEffect(() => {
    if (profile?.akili_score) {
      // Small delay so the element is in the DOM
      const t = setTimeout(() => animateCountUp(profile.akili_score, 'akili-count'), 120)
      return () => clearTimeout(t)
    }
  }, [profile?.akili_score])

  // Animate header stat numbers on profile load
  useEffect(() => {
    if (!profile) return
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = setTimeout(() => {
      animateStatNumber(profile.projects_completed || 0, 'hstat-projects')
      animateStatNumber(profile.connections_count || 0, 'hstat-connections')
      animateStatNumber(profile.portfolio_views || 0, 'hstat-views')
    }, 200)
    return () => clearTimeout(timer)
  }, [profile?.id])

  // Stats cards IntersectionObserver — only animates when user has no reduced-motion preference
  useEffect(() => {
    const cards = document.querySelectorAll('.stat-card-animate')
    const prefersMotion = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersMotion) {
      cards.forEach(card => card.classList.add('stat-will-animate'))
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement
            const delay = parseInt(el.dataset.delay ?? '0')
            setTimeout(() => el.classList.add('is-visible'), delay)
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.15, rootMargin: '0px 0px -30px 0px' }
    )
    cards.forEach(card => observer.observe(card))
    return () => observer.disconnect()
  }, [profile]) // re-run when profile loads so cards exist in DOM

  async function loadAnalytics(userId: string) {
    setAnalyticsLoading(true)
    const now = new Date()

    // Build 12-week date range
    const weeks: string[] = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i * 7)
      weeks.push(d.toISOString().split('T')[0])
    }

    const [eventsResult, ideasResult, connectionsResult, rankResult] = await Promise.all([
      supabase
        .from('akili_score_events')
        .select('id, event_type, points_earned, created_at, dimension')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100),
      supabase
        .from('ideas')
        .select('id, title, view_count, match_count')
        .eq('user_id', userId)
        .order('view_count', { ascending: false })
        .limit(5),
      supabase
        .from('connections')
        .select('id', { count: 'exact', head: true })
        .eq('receiver_id', userId)
        .eq('status', 'pending'),
      supabase
        .from('profiles')
        .select('id, akili_score')
        .order('akili_score', { ascending: false })
        .limit(200),
    ])

    const events = (eventsResult.data || []) as (AkiliEvent & { dimension?: string })[]

    // Score history by week (running cumulative from events)
    const scoreByWeek: Record<string, number> = {}
    for (const wk of weeks) scoreByWeek[wk] = 0
    for (const ev of events) {
      const evDate = ev.created_at.split('T')[0]
      // find the week bucket
      for (let i = weeks.length - 1; i >= 0; i--) {
        if (evDate >= weeks[i]) {
          scoreByWeek[weeks[i]] = (scoreByWeek[weeks[i]] || 0) + (ev.points_earned || 0)
          break
        }
      }
    }
    // Make cumulative
    let running = 0
    const scoreHistory = weeks.map(wk => {
      running += scoreByWeek[wk]
      const label = new Date(wk).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      return { week: label, score: running }
    })

    // Dimension breakdown
    const DIMENSION_COLORS: Record<string, string> = {
      knowledge: '#A855F7',
      collaboration: '#06B6D4',
      mentorship: '#C084FC',
      technical: '#818CF8',
      other: '#4A3F6B',
    }
    const dimMap: Record<string, number> = {}
    for (const ev of events) {
      const dim = ev.dimension || 'other'
      dimMap[dim] = (dimMap[dim] || 0) + (ev.points_earned || 0)
    }
    const dimensionBreakdown = Object.entries(dimMap).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: DIMENSION_COLORS[name] || '#4A3F6B',
    }))

    // Leaderboard rank
    const allProfiles = (rankResult.data || []) as { id: string; akili_score: number }[]
    const rankIdx = allProfiles.findIndex(p => p.id === userId)
    const leaderboardRank = rankIdx >= 0 ? rankIdx + 1 : null

    setAnalyticsData({
      profileViews: 0, // placeholder — profile_views from profile itself
      ideaViews: 0,
      collaborationRequests: connectionsResult.count || 0,
      leaderboardRank,
      scoreHistory,
      dimensionBreakdown,
      recentEvents: events.slice(0, 8),
      ideasPerformance: (ideasResult.data || []).map(i => ({
        title: i.title,
        views: (i as { view_count?: number }).view_count || 0,
        matches: (i as { match_count?: number }).match_count || 0,
      })),
    })
    setAnalyticsLoading(false)
  }

  async function loadAll() {
    setIsLoading(true)
    try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { return }

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
        research_interests: profileResult.data.research_interests || [],
        skills: profileResult.data.skills || [],
      })

      // Resolve university UUID to name if needed
      const uid = profileResult.data.university_id
      if (uid) {
        if (uid.includes('-')) {
          const { data: uni } = await supabase.from('universities').select('name').eq('id', uid).single()
          setUniversityName(uni?.name || uid)
        } else {
          setUniversityName(uid)
        }
      }
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
    } catch {
      toast.error('Failed to load profile data. Please refresh.')
    } finally {
      setIsLoading(false)
    }
  }

  async function saveProfile() {
    if (!profile) return
    setIsSaving(true)
    const { error } = await supabase.from('profiles').update(editForm).eq('id', profile.id)
    if (!error) {
      setProfile({ ...profile, ...editForm })
      setIsEditing(false)
      toast.success('Profile saved.')
    } else {
      toast.error('Failed to save profile. Please try again.')
    }
    setIsSaving(false)
  }

  function handleAvatarFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('Image must be under 5MB')
      return
    }
    setAvatarError(null)
    const reader = new FileReader()
    reader.onload = () => setCropSrc(reader.result as string)
    reader.readAsDataURL(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget
    const centered = centerCrop(
      makeAspectCrop({ unit: '%', width: 90 }, 1, width, height),
      width,
      height
    )
    setCrop(centered)
    setCompletedCrop(centered)
  }, [])

  async function handleCropAndUpload() {
    if (!completedCrop || !imgRef.current || !profile) return
    setIsUploadingAvatar(true)
    setAvatarError(null)

    const canvas = document.createElement('canvas')
    const size = 400
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) { setIsUploadingAvatar(false); return }

    const img = imgRef.current
    const scaleX = img.naturalWidth / img.width
    const scaleY = img.naturalHeight / img.height
    const pixelCrop = {
      x: completedCrop.x * (completedCrop.unit === '%' ? img.width / 100 : 1) * scaleX,
      y: completedCrop.y * (completedCrop.unit === '%' ? img.height / 100 : 1) * scaleY,
      width: completedCrop.width * (completedCrop.unit === '%' ? img.width / 100 : 1) * scaleX,
      height: completedCrop.height * (completedCrop.unit === '%' ? img.height / 100 : 1) * scaleY,
    }

    ctx.beginPath()
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
    ctx.clip()
    ctx.drawImage(img, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, size, size)

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92))
    if (!blob) { setIsUploadingAvatar(false); return }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setIsUploadingAvatar(false); return }

    const filePath = `${user.id}/${Date.now()}.jpg`
    const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, blob, {
      upsert: true,
      contentType: 'image/jpeg',
    })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      setAvatarError(uploadError.message)
      setIsUploadingAvatar(false)
      return
    }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath)
    const publicUrl = urlData.publicUrl

    await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id)
    setProfile({ ...profile, avatar_url: publicUrl })
    setCropSrc(null)
    setIsUploadingAvatar(false)
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
    const urlValue = portfolioForm.url.trim()
    if (urlValue && !/^https?:\/\/.+/.test(urlValue)) {
      toast.error('URL must start with http:// or https://')
      return
    }
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
      url: urlValue || null,
      date: dateStr,
      user_id: user.id,
    }

    if (editingItem) {
      const { data, error } = await supabase.from('portfolio_items').update(payload).eq('id', editingItem.id).select().single()
      if (data) setPortfolioItems(prev => prev.map(i => i.id === editingItem.id ? data : i))
      else if (error) { toast.error('Failed to save item.'); setPortfolioSaving(false); return }
    } else {
      const { data, error } = await supabase.from('portfolio_items').insert(payload).select().single()
      if (data) setPortfolioItems(prev => [data, ...prev])
      else if (error) { toast.error('Failed to add item.'); setPortfolioSaving(false); return }
    }

    setShowPortfolioModal(false)
    setPortfolioSaving(false)
  }

  async function deletePortfolioItem(id: string) {
    const { error } = await supabase.from('portfolio_items').delete().eq('id', id)
    if (error) {
      toast.error('Failed to delete item. Please try again.')
      setDeletingItemId(null)
      return
    }
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
      <div className="space-y-4">
        <ProfileHeaderSkeleton />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
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

  async function handleShareProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const result = await shareContent({
      title: `${profile?.full_name} on ResearchFlow`,
      text: `Check out ${profile?.full_name}'s research profile on ResearchFlow — Africa's premier research collaboration platform.`,
      url: `https://researchflowafrica.com/researcher/${user.id}`,
    })

    if (result.method === 'clipboard' && result.success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="space-y-8">
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

      {/* Crop Modal */}
      {cropSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-background border rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">Crop Photo</h2>
              <Button variant="ghost" size="icon" onClick={() => setCropSrc(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-6 flex justify-center">
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={1}
                circularCrop
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={imgRef}
                  src={cropSrc}
                  alt="Crop preview"
                  onLoad={onImageLoad}
                  style={{ maxHeight: '60vh', maxWidth: '100%' }}
                />
              </ReactCrop>
            </div>
            <div className="flex gap-3 p-6 border-t">
              <Button
                onClick={handleCropAndUpload}
                disabled={isUploadingAvatar}
                className="flex-1"
              >
                {isUploadingAvatar ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading...</>
                ) : (
                  'Crop & Upload'
                )}
              </Button>
              <Button variant="outline" onClick={() => setCropSrc(null)}>Cancel</Button>
            </div>
            {avatarError && <p className="text-xs text-destructive px-6 pb-4">{avatarError}</p>}
          </div>
        </div>
      )}

      {/* Header Card */}
      <div
        className="relative rounded-2xl overflow-hidden border border-primary/40"
        style={{ boxShadow: 'var(--brand-glow)' }}
      >
        {/* Animated canvas banner — first child, flush to top edge */}
        <div className="relative h-52 bg-muted dark:bg-background">
          <ProfileBackground
            backgroundStyle={profile.profile_background ?? 'baobab'}
            interests={profile.research_interests?.length > 0
              ? profile.research_interests.map((name: string, _i: number, arr: string[]) => ({ name, weight: 1 / arr.length }))
              : [{ name: 'Research', weight: 1 }]}
            akiliScore={akiliState?.total ?? profile.akili_score ?? 0}
            dimensions={akiliState?.dimensions ?? {
              knowledge:     profile.akili_dimension_knowledge     ?? 0,
              collaboration: profile.akili_dimension_collaboration ?? 0,
              mentorship:    profile.akili_dimension_mentorship    ?? 0,
              technical:     profile.akili_dimension_technical     ?? 0,
            }}
            collaborationCount={profile.connections_count ?? 0}
          />
          {/* Gradient fade at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none z-10"
            style={{ background: 'linear-gradient(to bottom, transparent, rgba(9,6,19,0.95))' }} />
        </div>
        {/* CSS for avatar pulse and stat card animations */}
        <style>{`
          @keyframes avatar-ring-pulse {
            0%,100% { opacity: 0.4; transform: scale(1); }
            50%      { opacity: 1;   transform: scale(1.08); }
          }
          .avatar-ring-pulse { animation: avatar-ring-pulse 2.8s ease-in-out infinite; }
          .avatar-ring-pulse-fast { animation: avatar-ring-pulse 0.9s ease-in-out infinite; }
          .stat-card-animate {
            transition: opacity 0.55s ease, transform 0.55s ease;
          }
          @media (prefers-reduced-motion: no-preference) {
            .stat-card-animate.stat-will-animate { opacity: 0; transform: translateY(24px); }
            .stat-card-animate.is-visible { opacity: 1; transform: translateY(0); }
          }
        `}</style>

        <div className="px-8 pb-8">
          <div className="flex flex-col md:flex-row items-start gap-6">

            {/* ── Avatar ── */}
            <div className="relative shrink-0 flex flex-col items-center -mt-12 z-20">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarFileSelect}
              />
              {/* Outer glow ring */}
              <div
                className="avatar-ring-pulse rounded-full"
                style={{
                  position: 'absolute', inset: '-8px',
                  border: '4px solid color-mix(in oklch, var(--primary) 25%, transparent)',
                  borderRadius: '9999px',
                  pointerEvents: 'none',
                }}
                id="avatar-outer-ring"
              />
              {/* Clickable avatar wrapper */}
              <div
                className="relative cursor-pointer group"
                style={{ width: 96, height: 96 }}
                onClick={() => fileInputRef.current?.click()}
                onMouseEnter={() => {
                  const ring = document.getElementById('avatar-outer-ring')
                  if (ring) { ring.classList.remove('avatar-ring-pulse'); ring.classList.add('avatar-ring-pulse-fast') }
                }}
                onMouseLeave={() => {
                  const ring = document.getElementById('avatar-outer-ring')
                  if (ring) { ring.classList.remove('avatar-ring-pulse-fast'); ring.classList.add('avatar-ring-pulse') }
                }}
                onTouchStart={(e) => {
                  const ring = document.getElementById('avatar-outer-ring')
                  if (ring) { ring.classList.remove('avatar-ring-pulse'); ring.classList.add('avatar-ring-pulse-fast') }
                  const timer = setTimeout(() => { fileInputRef.current?.click() }, 500)
                  const cancel = () => { clearTimeout(timer); if (ring) { ring.classList.remove('avatar-ring-pulse-fast'); ring.classList.add('avatar-ring-pulse') } }
                  e.currentTarget.addEventListener('touchend', cancel, { once: true })
                  e.currentTarget.addEventListener('touchmove', cancel, { once: true })
                }}
              >
                <Avatar
                  className="w-24 h-24 transition-transform duration-200 group-hover:scale-[1.06]"
                  style={{
                    border: '3px solid var(--primary)',
                    boxShadow: '0 0 0 5px color-mix(in oklch, var(--primary) 18%, transparent), var(--brand-glow)',
                    transition: 'box-shadow 300ms ease, transform 200ms cubic-bezier(0.34,1.56,0.64,1)',
                  }}
                >
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="text-3xl font-black text-gold-foreground">
                    {profile.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                {isUploadingAvatar && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                  </div>
                )}
              </div>
              {avatarError && <p className="text-xs text-destructive mt-2 text-center">{avatarError}</p>}
            </div>

            {/* ── Identity ── */}
            <div className="flex-1 space-y-4 min-w-0">
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
                      <Select value={editForm.academic_level} onValueChange={(v) => setEditForm({ ...editForm, academic_level: v })}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="undergraduate">Undergraduate</SelectItem>
                          <SelectItem value="masters">Masters Student</SelectItem>
                          <SelectItem value="phd">PhD Candidate</SelectItem>
                          <SelectItem value="postdoc">Postdoctoral</SelectItem>
                          <SelectItem value="faculty">Faculty</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label className="mb-2 block">
                      Research Interests
                      {editForm.research_interests.length > 0 && (
                        <span className="ml-2 text-xs text-primary font-normal">{editForm.research_interests.length} selected</span>
                      )}
                    </Label>
                    <ChipSelector
                      featuredOptions={RESEARCH_AREAS_FEATURED}
                      allOptions={RESEARCH_AREAS}
                      selected={editForm.research_interests}
                      maxSelections={10}
                      onToggle={(item) => setEditForm(f => ({
                        ...f,
                        research_interests: f.research_interests.includes(item)
                          ? f.research_interests.filter(i => i !== item)
                          : f.research_interests.length < 10
                          ? [...f.research_interests, item]
                          : f.research_interests,
                      }))}
                      onAddCustom={(item) => setEditForm(f => ({
                        ...f,
                        research_interests: f.research_interests.length < 10
                          ? [...f.research_interests, item]
                          : f.research_interests,
                      }))}
                    />
                  </div>
                  <div>
                    <Label className="mb-2 block">
                      Skills
                      {editForm.skills.length > 0 && (
                        <span className="ml-2 text-xs text-primary font-normal">{editForm.skills.length} selected</span>
                      )}
                    </Label>
                    <ChipSelector
                      featuredOptions={SKILLS_FEATURED}
                      allOptions={SKILLS_OFFERED}
                      selected={editForm.skills}
                      maxSelections={15}
                      onToggle={(item) => setEditForm(f => ({
                        ...f,
                        skills: f.skills.includes(item)
                          ? f.skills.filter(i => i !== item)
                          : f.skills.length < 15
                          ? [...f.skills, item]
                          : f.skills,
                      }))}
                      onAddCustom={(item) => setEditForm(f => ({
                        ...f,
                        skills: f.skills.length < 15
                          ? [...f.skills, item]
                          : f.skills,
                      }))}
                    />
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
                  {/* Name + badges row */}
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h1
                          className="text-3xl md:text-4xl font-heading font-bold"
                          style={{ letterSpacing: '-0.03em', fontWeight: 800 }}
                        >
                          {profile.full_name}
                        </h1>
                        <div className="flex items-center gap-1">
                          {profile.is_verified && (
                            <VerifiedBadge universityName={profile.university_name} size="md" />
                          )}
                          {profile.is_admin && (
                            <div title="Platform Admin" className="w-5 h-5 rounded-full bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center">
                              <Shield className="w-3 h-3 text-yellow-500" />
                            </div>
                          )}
                          {profile.roles?.includes('mentor') && mentorInfo?.is_verified && (
                            <div title="Verified Mentor" className="w-5 h-5 rounded-full bg-teal-500/20 border border-teal-500/40 flex items-center justify-center">
                              <GraduationCap className="w-3 h-3 text-teal-400" />
                            </div>
                          )}
                          {profile.roles?.includes('technical_expert') && (
                            <div title="Technical Expert" className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center">
                              <Code className="w-3 h-3 text-blue-400" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Akili hero badge */}
                      <div className="flex items-center gap-2 mt-2">
                        <div
                          id="akili-hero-badge"
                          className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full cursor-pointer select-none bg-primary/15 border border-primary/35"
                          onClick={() => triggerSparkleBurst('akili-hero-badge')}
                        >
                          <span className="text-gold-foreground text-sm">⚡</span>
                          <span
                            id="akili-count"
                            className="text-gold-foreground font-black text-lg tracking-tight"
                          >
                            {akiliState?.total ?? profile.akili_score ?? 0}
                          </span>
                          <span className="text-xs font-semibold text-muted-foreground">
                            · {akiliState?.tier.name ?? getAkiliNarrative(profile.akili_score ?? 0).title}
                          </span>
                        </div>
                      </div>

                      <p className="text-muted-foreground flex items-center gap-2 mt-2">
                        <GraduationCap className="w-4 h-4" />
                        {getAcademicLevelLabel(profile.academic_level || '')}
                        {profile.department && ` · ${profile.department}`}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 flex-wrap">
                      <RippleButton
                        variant="default"
                        className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold text-foreground bg-accent/50 border border-primary/50 hover:border-primary/70 hover:bg-accent/70 transition-colors"
                        onClick={() => setIsEditing(true)}
                      >
                        <Edit className="w-3.5 h-3.5" />
                        Edit Profile
                      </RippleButton>
                      <RippleButton
                        variant="default"
                        className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold text-primary-foreground bg-primary border border-primary hover:bg-primary/90 transition-colors"
                        onClick={handleShareProfile}
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-green-300" /> : <Share2 className="w-3.5 h-3.5" />}
                        {copied ? 'Link Copied!' : 'Share Profile'}
                      </RippleButton>
                    </div>
                  </div>

                  {profile.bio && <p className="text-sm text-muted-foreground leading-relaxed max-w-prose">{profile.bio}</p>}

                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1 hover:text-foreground transition-colors">
                      <Mail className="w-4 h-4" />{profile.email}
                    </span>
                    {universityName && (
                      <span className="flex items-center gap-1 hover:text-foreground transition-colors">
                        <Building2 className="w-4 h-4" />{universityName}
                      </span>
                    )}
                    <span className="flex items-center gap-1 hover:text-foreground transition-colors">
                      <Calendar className="w-4 h-4" />
                      Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {profile.academic_level && (
                      <span className="bg-primary/20 text-primary border border-primary/40 rounded-full px-3 py-1 text-xs font-semibold">
                        {getAcademicLevelLabel(profile.academic_level)}
                      </span>
                    )}
                    {(userState?.verification.show_email_prompt ?? !profile.is_verified) && (
                      <Link
                        href="/settings#verification"
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-primary/8 border border-primary/20 text-primary/70 hover:text-primary hover:border-primary/40 transition-all"
                      >
                        <svg viewBox="0 0 16 16" width="11" height="11" fill="none">
                          <path d="M8 1L2 4.5V8c0 3.5 2.5 6.75 6 7.5C11.5 14.75 14 11.5 14 8V4.5L8 1Z" fill="color-mix(in oklch, var(--primary) 40%, transparent)" stroke="var(--primary)" strokeWidth="1"/>
                          <path d="M5.5 8L7 9.5L10.5 6" stroke="var(--primary-foreground)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Verify your university email →
                      </Link>
                    )}
                    {profile.roles?.filter((role: string) => !['admin', 'mentor', 'technical_expert'].includes(role)).map((role: string) => (
                      <span key={role} className="bg-primary/15 text-primary border border-primary/25 rounded-full px-3 py-1 text-xs font-semibold">
                        {role === 'student_researcher' ? 'Student Researcher' : role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* ── Stats (with stagger animation) ── */}
            {!isEditing && (
              <div className="flex md:flex-col gap-4 md:gap-3 text-center md:text-right shrink-0">
                <div className="stat-card-animate" data-delay="0">
                  <p className="text-2xl font-heading font-bold tabular-nums text-primary" id="hstat-projects">{profile.projects_completed}</p>
                  <p className="text-xs text-muted-foreground">Projects</p>
                </div>
                <div className="stat-card-animate" data-delay="100">
                  <p className="text-2xl font-heading font-bold tabular-nums text-accent" id="hstat-connections">{profile.connections_count}</p>
                  <p className="text-xs text-muted-foreground">Connections</p>
                </div>
                <div className="stat-card-animate" data-delay="200">
                  <p className="text-2xl font-heading font-bold tabular-nums" id="hstat-views">{profile.portfolio_views}</p>
                  <p className="text-xs text-muted-foreground">Profile Views</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Akili Score — progress card with tier bar + next actions */}
      <AkiliProgressCard
        score={akiliState?.total ?? profile.akili_score ?? 0}
        dimensions={akiliState?.dimensions ?? {
          knowledge:     profile.akili_dimension_knowledge     ?? 0,
          collaboration: profile.akili_dimension_collaboration ?? 0,
          mentorship:    profile.akili_dimension_mentorship    ?? 0,
          technical:     profile.akili_dimension_technical     ?? 0,
        }}
      />

      {/* Tabs */}
      <Tabs defaultValue="skills" className="space-y-6" onValueChange={(v) => {
        if (v === 'analytics' && !analyticsData && profile) loadAnalytics(profile.id)
      }}>
        <div className="overflow-x-auto scrollbar-none">
          <TabsList className="flex-nowrap w-max min-w-full sm:w-auto">
            <TabsTrigger value="skills">Skills & Interests</TabsTrigger>
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
              Analytics
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="skills" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-heading">Research Interests</CardTitle>
                <CardDescription>Areas you want to explore</CardDescription>
              </CardHeader>
              <CardContent>
                {profile.research_interests && profile.research_interests.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.research_interests.map(interest => (
                      <span key={interest} className="border border-primary/50 text-primary rounded-full px-3.5 py-1.5 text-xs font-semibold hover:bg-primary/10 hover:scale-105 active:scale-95 transition-all duration-150">
                        {interest}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No research interests added yet.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-heading">Skills Offered</CardTitle>
                <CardDescription>What you can contribute</CardDescription>
              </CardHeader>
              <CardContent>
                {profile.skills && profile.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map(skill => (
                      <span key={skill} className="bg-primary/10 text-primary border border-primary/20 rounded-full px-3.5 py-1.5 text-xs font-semibold hover:bg-primary/15 hover:scale-105 active:scale-95 transition-all duration-150">
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No skills added yet.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-heading">Looking For</CardTitle>
                <CardDescription>What you need in collaborators</CardDescription>
              </CardHeader>
              <CardContent>
                {profile.looking_for && profile.looking_for.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.looking_for.map(item => (
                      <span key={item} className="border border-[var(--cyan)]/50 text-[var(--cyan)] rounded-full px-3.5 py-1.5 text-xs font-semibold hover:bg-[var(--cyan)]/10 hover:scale-105 active:scale-95 transition-all duration-150">
                        {item}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Not specified.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-heading">Availability</CardTitle>
                <CardDescription>Time commitment per week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-lg font-heading font-bold text-primary">{profile.weekly_hours_available || 0}</span>
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
              <h3 className="text-lg font-heading font-bold">Portfolio Items</h3>
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
            <div className="grid md:grid-cols-2 gap-6">
              {portfolioItems.map(item => (
                <Card key={item.id} className="overflow-hidden hover:border-primary/50 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          {getPortfolioIcon(item.item_type)}
                        </div>
                        <div>
                          <CardTitle className="text-base font-heading">{item.title}</CardTitle>
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
          {/* Stats strip */}
          <div className="rounded-xl border overflow-hidden">
            <div className={`grid divide-x divide-border ${profile.roles?.includes('mentor') ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-3'}`}>
              <div className="flex items-center gap-3 p-4">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <FolderOpen className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xl font-bold tabular-nums leading-none">{activityStats.activeProjects}</p>
                  <p className="text-xs text-muted-foreground mt-1">Active Projects</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                </div>
                <div>
                  <p className="text-xl font-bold tabular-nums leading-none">{activityStats.completedProjects}</p>
                  <p className="text-xs text-muted-foreground mt-1">Completed</p>
                </div>
              </div>
              {profile.roles?.includes('mentor') && (
                <div className="flex items-center gap-3 p-4">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-xl font-bold tabular-nums leading-none">{activityStats.mentorshipSessions}</p>
                    <p className="text-xs text-muted-foreground mt-1">Sessions</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 p-4">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                  <ListChecks className="w-4 h-4 text-orange-500" />
                </div>
                <div>
                  <p className="text-xl font-bold tabular-nums leading-none">{activityStats.tasksCompleted}</p>
                  <p className="text-xs text-muted-foreground mt-1">Tasks Done</p>
                </div>
              </div>
            </div>
          </div>

          {/* Akili Score */}
          <AkiliScoreCard userId={profile.id} limit={10} />

          {/* Mentor Section */}
          {mentorInfo ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-heading flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-primary" />
                  Mentor Profile
                </CardTitle>
                <CardDescription>Your mentorship activity and status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 flex-wrap">
                  {mentorInfo.is_verified ? (
                    <Badge className="bg-green-500/15 text-green-600 border-green-500/20 hover:bg-green-500/20">
                      <CheckCircle2 className="w-3 h-3 mr-1" />Approved
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/20 hover:bg-amber-500/20">
                      Pending Verification
                    </Badge>
                  )}
                  {mentorInfo.tier && (
                    <Badge variant="secondary">{mentorInfo.tier}</Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-2 pt-1">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-bold tabular-nums text-primary">{mentorInfo.total_sessions}</span>
                    <span className="text-sm text-muted-foreground">Sessions</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {mentorInfo.rating > 0 ? (
                      <>
                        <span className="text-xl font-bold tabular-nums">{mentorInfo.rating.toFixed(1)}</span>
                        <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                      </>
                    ) : (
                      <span className="text-xl font-bold tabular-nums">—</span>
                    )}
                    <span className="text-sm text-muted-foreground">Avg Rating</span>
                  </div>
                  {mentorInfo.specialty && (
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-sm font-semibold">{mentorInfo.specialty}</span>
                      <span className="text-xs text-muted-foreground">Specialty</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : profile.roles?.includes('mentor') ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-heading flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-primary" />
                  Mentor Profile
                </CardTitle>
                <CardDescription>Your mentorship application status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge className="bg-red-500/15 text-red-600 border-red-500/20 hover:bg-red-500/20">
                    Application Not Approved
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">Your mentor application was not approved. You may resubmit with updated documents.</p>
                <Button variant="outline" asChild>
                  <a href="/mentor-verification">Re-upload Documents</a>
                </Button>
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
              <CardTitle className="text-lg font-heading flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Research Output
              </CardTitle>
              <CardDescription>Your published and contributed works</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-bold tabular-nums">{portfolioItems.filter(i => i.item_type === 'publication').length}</span>
                  <span className="text-sm text-muted-foreground">Publications</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-bold tabular-nums">{portfolioItems.filter(i => i.item_type === 'presentation').length}</span>
                  <span className="text-sm text-muted-foreground">Presentations</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-bold tabular-nums">{portfolioItems.filter(i => ['award','certificate'].includes(i.item_type)).length}</span>
                  <span className="text-sm text-muted-foreground">Awards & Certs</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {analyticsLoading ? (
            <ListPageSkeleton type="card" count={3} />
          ) : analyticsData ? (
            <>
              {/* Stat strip */}
              <div className="rounded-xl border overflow-hidden">
                <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
                  <div className="flex items-center gap-3 p-4">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Eye className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xl font-bold tabular-nums leading-none">{profile.portfolio_views || 0}</p>
                      <p className="text-xs text-muted-foreground mt-1">Profile Views</p>
                    </div>
                  </div>
                  <button className="flex items-center gap-3 p-4 hover:bg-muted/40 transition-colors text-left w-full" onClick={() => router.push('/ideas')}>
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0">
                      <Lightbulb className="w-4 h-4 text-cyan-500" />
                    </div>
                    <div>
                      <p className="text-xl font-bold tabular-nums leading-none">{analyticsData.ideasPerformance.reduce((a, i) => a + i.views, 0)}</p>
                      <p className="text-xs text-muted-foreground mt-1">Idea Views</p>
                    </div>
                  </button>
                  <button className="flex items-center gap-3 p-4 hover:bg-muted/40 transition-colors text-left w-full" onClick={() => router.push('/network')}>
                    <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4 text-violet-500" />
                    </div>
                    <div>
                      <p className="text-xl font-bold tabular-nums leading-none">{analyticsData.collaborationRequests}</p>
                      <p className="text-xs text-muted-foreground mt-1">Pending Requests</p>
                    </div>
                  </button>
                  <button className="flex items-center gap-3 p-4 hover:bg-muted/40 transition-colors text-left w-full" onClick={() => router.push('/leaderboard')}>
                    <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center shrink-0">
                      <TrendingUp className="w-4 h-4 text-yellow-500" />
                    </div>
                    <div>
                      <p className="text-xl font-bold tabular-nums leading-none">
                        {analyticsData.leaderboardRank ? `#${analyticsData.leaderboardRank}` : '—'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Leaderboard Rank</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Score growth chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-heading flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Akili Score Growth
                  </CardTitle>
                  <CardDescription>Points earned over the last 12 weeks</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={analyticsData.scoreHistory} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="akiliGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#A855F7" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#A855F7" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} interval={2} />
                      <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                        labelStyle={{ color: 'var(--muted-foreground)' }}
                        itemStyle={{ color: 'var(--primary)' }}
                      />
                      <Area type="monotone" dataKey="score" stroke="#A855F7" strokeWidth={2} fill="url(#akiliGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Dimension breakdown */}
                {analyticsData.dimensionBreakdown.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg font-heading">Score Dimensions</CardTitle>
                      <CardDescription>Breakdown by contribution type</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center gap-6">
                      <ResponsiveContainer width={120} height={120}>
                        <PieChart>
                          <Pie data={analyticsData.dimensionBreakdown} cx="50%" cy="50%" innerRadius={30} outerRadius={55} dataKey="value" strokeWidth={0}>
                            {analyticsData.dimensionBreakdown.map((entry, idx) => (
                              <Cell key={idx} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="space-y-2 flex-1">
                        {analyticsData.dimensionBreakdown.map((d) => (
                          <div key={d.name} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                              <span className="text-muted-foreground">{d.name}</span>
                            </div>
                            <span className="font-medium">{d.value} pts</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Recent Akili events */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Recent Activity</CardTitle>
                    <CardDescription>Latest Akili Score events</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {analyticsData.recentEvents.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No Akili events yet. Complete your profile and post ideas to earn points!</p>
                    ) : (
                      analyticsData.recentEvents.map(ev => (
                        <div key={ev.id} className="flex items-center justify-between py-1.5 border-b last:border-0 border-border/50">
                          <div>
                            <p className="text-sm font-medium capitalize">{ev.event_type.replace(/_/g, ' ')}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(ev.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                          <span className="text-sm font-semibold text-primary">+{ev.points_earned}</span>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Ideas performance */}
              {analyticsData.ideasPerformance.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-primary" />
                      Ideas Performance
                    </CardTitle>
                    <CardDescription>Views and matches for your posted ideas</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      <div className="grid grid-cols-12 text-xs text-muted-foreground py-1 px-2">
                        <span className="col-span-7">Title</span>
                        <span className="col-span-2 text-right">Views</span>
                        <span className="col-span-3 text-right">Matches</span>
                      </div>
                      {analyticsData.ideasPerformance.map((idea, i) => (
                        <div key={i} className="grid grid-cols-12 text-sm py-2 px-2 rounded-lg hover:bg-muted/50 transition-colors">
                          <span className="col-span-7 font-medium truncate pr-2">{idea.title}</span>
                          <span className="col-span-2 text-right text-muted-foreground">{idea.views}</span>
                          <span className="col-span-3 text-right">
                            <span className="inline-flex items-center gap-1 text-primary">
                              <Users className="w-3 h-3" />{idea.matches}
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <BarChart3 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">Couldn&apos;t load analytics.</p>
              <button
                onClick={() => profile && loadAnalytics(profile.id)}
                className="mt-3 text-sm text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
              >
                Try again
              </button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {activeMilestone && (
        <MilestoneToast
          title={activeMilestone.title}
          description={activeMilestone.description}
          icon={activeMilestone.icon}
          onClose={clearMilestone}
        />
      )}
    </div>
  )
}
