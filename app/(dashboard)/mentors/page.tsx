"use client"

import { useEffect, useState, type ChangeEvent } from "react"
import Link from "next/link"
import { BackToHub } from "@/components/ui/back-to-hub"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  BookOpen,
  Search,
  Star,
  Clock,
  GraduationCap,
  Building2,
  MessageSquare,
  Loader2,
  Paperclip,
  CheckCircle2,
  FolderKanban,
  Briefcase,
  Award,
  ArrowRight,
  Sparkles,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { BookmarkButton } from "@/components/ui/bookmark-button"
import type { MentorProfile, Profile, Project } from "@/lib/types/database"
import { AkiliScoreBadge } from "@/components/akili/AkiliScoreBadge"
import { toast } from "sonner"
import { ContextualHint } from "@/components/ui/ContextualHint"
import { RequestProgramModal } from "@/components/mentorship/RequestProgramModal"
import { DeleteButton } from "@/components/ui/delete-button"
import { ProgramCard } from "@/components/mentorship/ProgramCard"
import { getMyMentorshipPrograms, type MenteeProgramItem } from "@/lib/actions/mentorship"
import { computeMentorMatches, type MatchScore } from '@/lib/mentorship/matching-engine'

interface MentorWithProfile extends MentorProfile {
  profile: Profile
}

const EXPERTISE_AREAS = [
  "All Areas",
  "Research Methods",
  "Academic Writing",
  "Data Analysis",
  "Statistics",
  "Grant Writing",
  "Publishing",
  "Career Development",
  "Laboratory Skills",
  "Field Research",
]

const MENTOR_TIERS = [
  {
    id: "faculty",
    label: "Tier 1: Registered Faculty",
    icon: GraduationCap,
    description: "Academic staff at a recognised university or research institution.",
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.3)",
  },
  {
    id: "postgraduate",
    label: "Tier 2: Postgraduate Student",
    icon: BookOpen,
    description: "Masters or PhD students with research experience who can guide undergraduates.",
    color: "#A855F7",
    bg: "rgba(168,85,247,0.08)",
    border: "rgba(168,85,247,0.3)",
  },
  {
    id: "industry",
    label: "Tier 3: Industry Professional",
    icon: Briefcase,
    description: "Working professionals with domain expertise relevant to African research.",
    color: "#22C55E",
    bg: "rgba(34,197,94,0.08)",
    border: "rgba(34,197,94,0.3)",
  },
]

export default function MentorsPage() {
  const [mentors, setMentors] = useState<MentorWithProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedArea, setSelectedArea] = useState("All Areas")
  const [selectedMentor, setSelectedMentor] = useState<MentorWithProfile | null>(null)
  const [currentUserRoles, setCurrentUserRoles] = useState<string[]>([])
  const [showBecomeMentorModal, setShowBecomeMentorModal] = useState(false)
  const [applyingTier, setApplyingTier] = useState<string | null>(null)

  // Request modal state
  const [userProjects, setUserProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState("")
  const [requestMessage, setRequestMessage] = useState("")
  const [briefFile, setBriefFile] = useState<File | null>(null)
  const [briefError, setBriefError] = useState<string | null>(null)
  const [isRequesting, setIsRequesting] = useState(false)
  const [requestSuccess, setRequestSuccess] = useState(false)

  // Programs tab
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'matches' | 'mentors' | 'programs'>('mentors')
  const [myPrograms, setMyPrograms] = useState<MenteeProgramItem[]>([])
  const [loadingPrograms, setLoadingPrograms] = useState(false)
  const [programModalMentor, setProgramModalMentor] = useState<MentorWithProfile | null>(null)

  // Matches tab
  const [matches, setMatches] = useState<MatchScore[]>([])
  const [matchesLoading, setMatchesLoading] = useState(false)
  const [matchesLoaded, setMatchesLoaded] = useState(false)

  useEffect(() => {
    loadMentors()
  }, [selectedArea, searchQuery])

  useEffect(() => {
    if (activeTab === 'programs' && myPrograms.length === 0) {
      setLoadingPrograms(true)
      getMyMentorshipPrograms().then(({ asMentee }) => {
        setMyPrograms(asMentee)
        setLoadingPrograms(false)
      })
    }
  }, [activeTab])

  useEffect(() => {
    if (activeTab === 'matches' && !matchesLoaded && currentUserId) {
      setMatchesLoading(true)
      computeMentorMatches(currentUserId)
        .then(data => {
          setMatches(data)
          setMatchesLoaded(true)
        })
        .finally(() => setMatchesLoading(false))
    }
  }, [activeTab, matchesLoaded, currentUserId])

  async function loadMentors() {
    setIsLoading(true)
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setCurrentUserId(user.id)
      const { data: profile } = await supabase
        .from("profiles")
        .select("roles")
        .eq("id", user.id)
        .single()
      if (profile?.roles) setCurrentUserRoles(profile.roles)
    }

    let query = supabase
      .from("mentor_profiles")
      .select(`
        *,
        profile:profiles!mentor_profiles_user_id_fkey(*)
      `)
      .eq("is_verified", true)
      .order("rating", { ascending: false })

    if (selectedArea !== "All Areas") {
      query = query.contains("expertise_areas", [selectedArea])
    }

    const { data, error } = await query.limit(30)

    if (error) {
      console.error("Failed to load mentors:", error)
    }

    if (data && !error) {
      let filtered = data
      if (searchQuery) {
        const search = searchQuery.toLowerCase()
        filtered = data.filter(
          (m) =>
            m.profile?.full_name?.toLowerCase().includes(search) ||
            m.profile?.department?.toLowerCase().includes(search) ||
            m.expertise_areas?.some((a: string) => a.toLowerCase().includes(search))
        )
      }
      setMentors(filtered)
    }

    setIsLoading(false)
  }

  async function openRequestModal(mentor: MentorWithProfile) {
    setSelectedMentor(mentor)
    setRequestSuccess(false)
    setSelectedProjectId("")
    setRequestMessage("")
    setBriefFile(null)
    setBriefError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: memberRows } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", user.id)

    if (memberRows && memberRows.length > 0) {
      const teamIds = memberRows.map((r: { team_id: string }) => r.team_id)
      const { data: projects } = await supabase
        .from("projects")
        .select("id, title, status")
        .in("team_id", teamIds)
        .eq("status", "active")
        .order("created_at", { ascending: false })

      setUserProjects((projects as Project[]) || [])
    } else {
      setUserProjects([])
    }
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    setBriefError(null)
    if (!file) { setBriefFile(null); return }
    if (file.type !== "application/pdf") {
      setBriefError("Only PDF files are accepted.")
      setBriefFile(null)
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setBriefError("File must be under 5 MB.")
      setBriefFile(null)
      return
    }
    setBriefFile(file)
  }

  async function handleRequestMentorship() {
    if (!selectedMentor) return
    if (userProjects.length > 0 && !selectedProjectId) {
      toast.error("Please select a project.")
      return
    }

    setIsRequesting(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setIsRequesting(false); return }

    let briefUrl: string | null = null
    if (briefFile) {
      const fileName = `${user.id}/${Date.now()}_${briefFile.name}`
      const { data: uploadData } = await supabase.storage
        .from("mentor-briefs")
        .upload(fileName, briefFile, { upsert: false })
      if (uploadData) {
        const { data: publicUrl } = supabase.storage
          .from("mentor-briefs")
          .getPublicUrl(uploadData.path)
        briefUrl = publicUrl.publicUrl
      }
    }

    const { error } = await supabase.from("mentorship_requests").insert({
      mentor_id: selectedMentor.user_id,
      student_id: user.id,
      project_id: selectedProjectId || null,
      message: requestMessage.trim() || null,
      brief_url: briefUrl,
      status: "pending",
    })

    if (error) {
      toast.error("Failed to send request. Please try again.")
      setIsRequesting(false)
      return
    }

    await supabase.from("notifications").insert({
      user_id: selectedMentor.user_id,
      type: "mentorship_request",
      title: "New Mentorship Request",
      message: "A student has requested your mentorship",
      link: "/dashboard",
    })

    setRequestSuccess(true)
    setIsRequesting(false)
  }

  function closeModal() {
    setSelectedMentor(null)
    setRequestSuccess(false)
  }

  function handleBecomeMentorClick() {
    if (currentUserRoles.includes("mentor")) {
      window.location.href = "/mentor-dashboard"
    } else {
      setShowBecomeMentorModal(true)
    }
  }

  async function applyAsMentor(tierId: string) {
    setApplyingTier(tierId)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setApplyingTier(null); return }

    // Check if user is admin for instant approval
    const { data: profileData } = await supabase
      .from("profiles")
      .select("is_admin, roles")
      .eq("id", user.id)
      .single()

    const isAdmin = profileData?.is_admin === true || profileData?.roles?.includes("admin")

    // 1. Add 'mentor' to roles
    const updatedRoles = Array.from(new Set([...currentUserRoles, "mentor"]))
    const { error: rolesError } = await supabase
      .from("profiles")
      .update({ roles: updatedRoles })
      .eq("id", user.id)

    if (rolesError) {
      toast.error("Failed to apply. Please try again.")
      setApplyingTier(null)
      return
    }

    // 2. Upsert mentor_profiles — instant approval for admins, pending for everyone else
    const tierNumber = tierId === "faculty" ? 1 : tierId === "postgraduate" ? 2 : 3
    await supabase.from("mentor_profiles").upsert(
      {
        user_id: user.id,
        tier: tierNumber,
        is_verified: isAdmin,
        specializations: [],
        mentorship_areas: [],
        available_slots: isAdmin ? 10 : 0,
        slots_used: 0,
        total_sessions: 0,
        rating: 0,
        review_count: 0,
      },
      { onConflict: "user_id" }
    )

    setCurrentUserRoles(updatedRoles)
    setApplyingTier(null)
    setShowBecomeMentorModal(false)

    // 3. Admins skip verification and go straight to dashboard
    if (isAdmin) {
      toast.success("Mentor profile approved instantly!")
      window.location.href = "/mentor-dashboard"
    } else {
      window.location.href = "/mentor-verification"
    }
  }

  return (
    <div className="space-y-6">
      <BackToHub href="/collaborate" label="Back to Collaborate" />
      <ContextualHint
        hintKey="hint_mentors"
        icon="🎓"
        title="Find a Research Mentor"
        description="Connect with experienced academics and industry professionals. A good mentor can accelerate your research journey significantly."
      />
      {/* Become a Mentor Modal */}
      {showBecomeMentorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden" style={{ background: '#0F0A1E', border: '1px solid rgba(139,92,246,0.3)' }}>
            <div className="flex items-center justify-between p-6" style={{ borderBottom: '1px solid rgba(139,92,246,0.15)' }}>
              <div>
                <h2 className="text-xl font-bold font-heading">Become a Mentor</h2>
                <p className="text-sm mt-0.5 text-muted-foreground">Choose the tier that matches your background</p>
              </div>
              <button
                onClick={() => setShowBecomeMentorModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ color: 'var(--muted-foreground)', background: 'rgba(255,255,255,0.05)' }}
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-3">
              {MENTOR_TIERS.map((tier) => {
                const Icon = tier.icon
                return (
                  <div
                    key={tier.id}
                    className="flex items-center gap-4 p-4 rounded-xl"
                    style={{ background: tier.bg, border: `1px solid ${tier.border}` }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${tier.bg}`, border: `1px solid ${tier.border}` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: tier.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm" style={{ color: tier.color }}>{tier.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#9D8BB8' }}>{tier.description}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => applyAsMentor(tier.id)}
                      disabled={!!applyingTier}
                      style={{ background: `linear-gradient(135deg, ${tier.color}55, ${tier.color}33)`, border: `1px solid ${tier.border}`, color: tier.color, flexShrink: 0 }}
                    >
                      {applyingTier === tier.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>Apply <ArrowRight className="w-3 h-3 ml-1" /></>
                      )}
                    </Button>
                  </div>
                )
              })}
            </div>

            <div className="px-6 pb-6">
              <p className="text-xs text-center text-muted-foreground">
                After applying, complete your mentor verification profile in Settings. Your application will be reviewed by the ResearchFlow team.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-primary" />
            Find a Mentor
          </h1>
          <p className="text-muted-foreground mt-1">
            Connect with experienced researchers for guidance and support
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleBecomeMentorClick}
          style={{ border: '1px solid rgba(168,85,247,0.4)', color: 'var(--primary)' }}
        >
          {currentUserRoles.includes("mentor") ? "Mentor Dashboard" : "Become a Mentor"}
        </Button>
      </div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.18)', borderRadius: '12px', padding: '4px', width: 'fit-content' }}>
        {([
          { id: 'matches', label: 'My Matches', icon: Sparkles },
          { id: 'mentors', label: 'Mentor Directory', icon: null },
          { id: 'programs', label: 'My Programs', icon: null },
        ] as const).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '7px 20px', borderRadius: '9px', fontSize: '13px', fontWeight: 500,
              border: 'none', cursor: 'pointer', transition: 'all 0.15s',
              background: activeTab === tab.id ? 'rgba(124,58,237,0.25)' : 'transparent',
              color: activeTab === tab.id ? '#C4B5FD' : 'var(--muted-foreground)',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            {tab.icon && <tab.icon className="w-3.5 h-3.5" />}
            {tab.label}
          </button>
        ))}
      </div>

      {/* My Matches tab */}
      {activeTab === 'matches' && (
        <div className="space-y-4">
          {matchesLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="h-14 w-14 bg-muted rounded-full" />
                      <div className="flex-1">
                        <div className="h-5 bg-muted rounded w-3/4 mb-2" />
                        <div className="h-4 bg-muted rounded w-1/2" />
                      </div>
                    </div>
                    <div className="h-4 bg-muted rounded w-full mb-2" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : matches.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Sparkles className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No matches yet</h3>
                <p className="text-muted-foreground mb-6">
                  Add research interests to your profile to get personalised mentor matches
                </p>
                <Button variant="outline" asChild style={{ border: '1px solid rgba(168,85,247,0.4)', color: '#C084FC' }}>
                  <Link href="/profile">Update Profile</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {matches.map((match) => (
                <Card key={match.id} className="hover:border-primary/50 transition-colors relative overflow-hidden">
                  {/* Match score badge */}
                  <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold z-10"
                    style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(139,92,246,0.4)', color: '#C4B5FD' }}>
                    <Sparkles className="w-3 h-3" />
                    {Math.round(match.score * 100)}% match
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <Link href={`/profile/${match.user_id}`}>
                        <Avatar className="h-14 w-14 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all">
                          <AvatarImage src={match.profile?.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary text-lg">
                            {match.profile?.full_name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                      </Link>
                      <div className="flex-1 min-w-0 pr-16">
                        <Link href={`/profile/${match.user_id}`} className="hover:text-primary transition-colors">
                          <h3 className="font-semibold truncate">{match.profile?.full_name}</h3>
                        </Link>
                        {match.profile?.department && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <GraduationCap className="h-3 w-3 shrink-0" />
                            <span className="truncate">{match.profile.department}</span>
                          </p>
                        )}
                        {match.profile?.university_id && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Building2 className="h-3 w-3 shrink-0" />
                            <span className="truncate">{match.profile.university_id}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {match.bio && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{match.bio}</p>
                    )}

                    {match.expertise_areas && match.expertise_areas.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {match.expertise_areas.slice(0, 3).map((area) => (
                          <Badge key={area} variant="secondary" className="text-xs">{area}</Badge>
                        ))}
                        {match.expertise_areas.length > 3 && (
                          <Badge variant="outline" className="text-xs">+{match.expertise_areas.length - 3}</Badge>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      {match.rating && (
                        <span className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          {Number(match.rating).toFixed(1)}
                        </span>
                      )}
                      {match.total_sessions && match.total_sessions > 0 && (
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          {match.total_sessions} sessions
                        </span>
                      )}
                    </div>

                    {/* Match reasons */}
                    {match.match_reasons.length > 0 && (
                      <p className="text-xs mb-3" style={{ color: '#9D8BB8' }}>
                        {match.match_reasons.join(' · ')}
                      </p>
                    )}

                    <div className="flex gap-2 pt-3 border-t flex-wrap">
                      <Button
                        size="sm"
                        onClick={() => setProgramModalMentor(match as unknown as MentorWithProfile)}
                        style={{ background: 'var(--cta-bg)', border: 'none', flex: 1 }}
                      >
                        Request Program
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/profile/${match.user_id}`}>Profile</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* My Programs tab */}
      {activeTab === 'programs' && (
        <div className="space-y-4">
          {loadingPrograms ? (
            <div className="grid md:grid-cols-2 gap-4">
              {[1,2].map((i) => <div key={i} style={{ height: '180px', borderRadius: '16px', background: 'rgba(139,92,246,0.06)', animation: 'pulse 1.5s ease-in-out infinite' }} />)}
            </div>
          ) : myPrograms.length === 0 ? (
            <Card>
              <CardContent className="p-10 text-center">
                <GraduationCap className="h-14 w-14 text-muted-foreground/40 mx-auto mb-4" />
                <h3 className="font-semibold mb-1">No programs yet</h3>
                <p className="text-muted-foreground text-sm mb-4">Browse the Mentor Directory and request a structured program.</p>
                <Button variant="outline" onClick={() => setActiveTab('mentors')} style={{ border: '1px solid rgba(168,85,247,0.4)', color: '#C084FC' }}>Browse Mentors</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {myPrograms.map((p) => (
                <ProgramCard
                  key={p.id}
                  programId={p.id}
                  otherPerson={p.mentor}
                  role="mentee"
                  status={p.status}
                  focusArea={p.focus_area}
                  durationMonths={p.duration_months}
                  milestones={p.mentorship_milestones}
                  startedAt={p.started_at}
                  expectedEndAt={p.expected_end_at}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filters — only shown in Mentors tab */}
      {activeTab === 'mentors' && <>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search mentors by name, expertise, or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedArea} onValueChange={setSelectedArea}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Expertise Area" />
              </SelectTrigger>
              <SelectContent>
                {EXPERTISE_AREAS.map((area) => (
                  <SelectItem key={area} value={area}>
                    {area}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Mentors Grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-14 w-14 bg-muted rounded-full" />
                  <div className="flex-1">
                    <div className="h-5 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </div>
                </div>
                <div className="h-4 bg-muted rounded w-full mb-2" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : mentors.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mentors.map((mentor) => (
            <Card key={mentor.id} className="hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <Link href={`/profile/${mentor.user_id}`}>
                    <Avatar className="h-14 w-14 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all">
                      <AvatarImage src={mentor.profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-lg">
                        {mentor.profile?.full_name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/profile/${mentor.user_id}`} className="hover:text-primary transition-colors">
                      <h3 className="font-semibold truncate">{mentor.profile?.full_name}</h3>
                    </Link>
                    {mentor.profile?.department && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <GraduationCap className="h-3 w-3 shrink-0" />
                        <span className="truncate">{mentor.profile.department}</span>
                      </p>
                    )}
                    {mentor.profile?.university_id && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Building2 className="h-3 w-3 shrink-0" />
                        <span className="truncate">{mentor.profile.university_id}</span>
                      </p>
                    )}
                    <div className="mt-1.5">
                      <AkiliScoreBadge score={mentor.profile?.akili_score || 0} />
                    </div>
                  </div>
                </div>

                {mentor.bio && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{mentor.bio}</p>
                )}

                {mentor.expertise_areas && mentor.expertise_areas.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {mentor.expertise_areas.slice(0, 3).map((area) => (
                      <Badge key={area} variant="secondary" className="text-xs">
                        {area}
                      </Badge>
                    ))}
                    {mentor.expertise_areas.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{mentor.expertise_areas.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  {mentor.rating && (
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      {Number(mentor.rating).toFixed(1)}
                    </span>
                  )}
                  {mentor.total_sessions && mentor.total_sessions > 0 && (
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      {mentor.total_sessions} sessions
                    </span>
                  )}
                  {mentor.availability_hours && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {mentor.availability_hours}h/week
                    </span>
                  )}
                </div>

                <div className="flex gap-2 pt-4 border-t flex-wrap">
                  {mentor.user_id === currentUserId ? (
                    <>
                      <Button variant="outline" size="sm" asChild className="flex-1">
                        <Link href="/mentor-dashboard">Manage Listing</Link>
                      </Button>
                      <DeleteButton
                        label="Delete"
                        onDelete={async () => {
                          const supabase = createClient()
                          const { error } = await supabase
                            .from('mentor_profiles')
                            .delete()
                            .eq('id', mentor.id)
                            .eq('user_id', currentUserId)
                          if (error) throw error
                          setMentors(prev => prev.filter(m => m.id !== mentor.id))
                        }}
                      />
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        onClick={() => setProgramModalMentor(mentor)}
                        style={{ background: 'var(--cta-bg)', border: 'none', flex: 1 }}
                      >
                        Request Program
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openRequestModal(mentor)}>
                        Quick Request
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/profile/${mentor.user_id}`}>Profile</Link>
                      </Button>
                      <BookmarkButton contentType="mentor" contentId={mentor.id} size="sm" />
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No mentors found</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery || selectedArea !== "All Areas"
                ? "Try adjusting your filters"
                : "No mentors are currently available"}
            </p>
            <Button
              variant="outline"
              onClick={handleBecomeMentorClick}
              style={{ border: '1px solid rgba(168,85,247,0.4)', color: 'var(--primary)' }}
            >
              {currentUserRoles.includes("mentor") ? "Mentor Dashboard" : "Become a Mentor"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* End of mentors tab */}
      </>}

      {/* Program Request Modal */}
      {programModalMentor && (
        <RequestProgramModal
          mentor={programModalMentor}
          onClose={() => setProgramModalMentor(null)}
          onSuccess={() => {
            setProgramModalMentor(null)
            toast.success('Program request sent!')
          }}
        />
      )}

      {/* Quick Mentorship Request Modal */}
      <Dialog open={!!selectedMentor} onOpenChange={closeModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request Mentorship</DialogTitle>
            <DialogDescription>
              Send a request to {selectedMentor?.profile?.full_name}.
            </DialogDescription>
          </DialogHeader>

          {requestSuccess ? (
            <div className="py-6 text-center space-y-3">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
              <p className="font-medium">
                Request sent to {selectedMentor?.profile?.full_name}.
              </p>
              <p className="text-sm text-muted-foreground">
                You&apos;ll be notified when they respond.
              </p>
              <Button onClick={closeModal} className="mt-2">Done</Button>
            </div>
          ) : (
            <>
              {/* Mentor preview */}
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={selectedMentor?.profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {selectedMentor?.profile?.full_name?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold">{selectedMentor?.profile?.full_name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedMentor?.profile?.department}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Project selector */}
                <div className="space-y-2">
                  <Label>Select Project</Label>
                  {userProjects.length === 0 ? (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-muted text-sm text-muted-foreground">
                      <FolderKanban className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>
                        You need an active project to request mentorship.{" "}
                        <Link href="/ideas/new" className="text-primary underline" onClick={closeModal}>
                          Post a research idea first.
                        </Link>
                      </span>
                    </div>
                  ) : (
                    <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a project..." />
                      </SelectTrigger>
                      <SelectContent>
                        {userProjects.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <Label>
                    Message
                    <span className="ml-2 text-xs text-muted-foreground font-normal">
                      {requestMessage.length}/200
                    </span>
                  </Label>
                  <Textarea
                    placeholder="Briefly describe what you need guidance on..."
                    value={requestMessage}
                    onChange={(e) => setRequestMessage(e.target.value.slice(0, 200))}
                    rows={3}
                  />
                </div>

                {/* File upload */}
                <div className="space-y-2">
                  <Label>Attach Project Brief <span className="text-muted-foreground font-normal">(optional, PDF only, max 5 MB)</span></Label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-md border text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors">
                      <Paperclip className="h-4 w-4" />
                      {briefFile ? briefFile.name : "Choose PDF file"}
                    </div>
                    <input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                  {briefError && (
                    <p className="text-xs text-destructive">{briefError}</p>
                  )}
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={closeModal}>
                  Cancel
                </Button>
                <Button
                  onClick={handleRequestMentorship}
                  disabled={isRequesting || (userProjects.length > 0 && !selectedProjectId)}
                  style={{ background: 'var(--cta-bg)', border: 'none' }}
                >
                  {isRequesting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Request"
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
